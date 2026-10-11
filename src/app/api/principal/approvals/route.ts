/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';
import { postLedgerLines } from '@/lib/fees-engine/ledger';
import { AggregatesService } from '@/lib/services/aggregates.service';
import { invalidateFeeOverviewMemoryCache } from '@/lib/fees-engine';
import { PrincipalApprovalType, PrincipalApprovalStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Strict Principal Guard
    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access strictly reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const type = (searchParams.get('type') || undefined) as PrincipalApprovalType | undefined;
    const status = (searchParams.get('status') || undefined) as PrincipalApprovalStatus | undefined;

    const requests = await Database.getApprovals(tenant, session, type, status);

    const counts = {
      all: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
      certificate_tc: requests.filter(r => r.type === 'CERTIFICATE_TC' && r.status === 'PENDING').length,
      biometric_regularization: requests.filter(r => r.type === 'BIOMETRIC_REGULARIZATION' && r.status === 'PENDING').length,
      staff_leave: requests.filter(r => r.type === 'STAFF_LEAVE' && r.status === 'PENDING').length,
      fee_concession: requests.filter(r => r.type === 'FEE_CONCESSION' && r.status === 'PENDING').length,
      admission: requests.filter(r => r.type === 'ADMISSION' && r.status === 'PENDING').length,
    };

    return NextResponse.json({
      success: true,
      count: requests.length,
      counts,
      requests
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_APPROVALS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load approvals.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(userRole);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Approval actions are exclusively reserved for the School Principal.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.id || !body.action) {
      return NextResponse.json(
        { success: false, error: 'Request id and action (APPROVE or REJECT) are required.' },
        { status: 400 }
      );
    }

    const { id, action, remarks } = body;
    const cleanAction = String(action).toUpperCase().trim();
    if (cleanAction !== 'APPROVE' && cleanAction !== 'REJECT') {
      return NextResponse.json(
        { success: false, error: 'Action must be either APPROVE or REJECT.' },
        { status: 400 }
      );
    }

    // Mandatory Remark Check
    const cleanRemarks = (remarks || '').trim();
    if (!cleanRemarks) {
      return NextResponse.json(
        { success: false, error: 'A mandatory remark must be provided when approving or rejecting a request.' },
        { status: 400 }
      );
    }

    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const principalActor = {
      id: auth.userId || 'principal_admin',
      name: (auth as any).full_name || (auth as any).username || 'Abhishek Shukla (Principal)',
      role: 'PRINCIPAL'
    };

    // Action the request
    const updated = await Database.actionApproval(id, cleanAction as 'APPROVE' | 'REJECT', cleanRemarks, principalActor);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Approval request not found.' },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // SUB-MODULE SYNCHRONIZATION
    // ─────────────────────────────────────────────────────────────
    if (cleanAction === 'APPROVE') {
      // 1. Fee Concession / Waiver Approved -> Post to Ledger
      if (updated.type === 'FEE_CONCESSION' && updated.details.student_id && updated.details.amount_paise) {
        try {
          const discountAmt = Math.round(Number(updated.details.amount_paise));
          if (discountAmt > 0) {
            await postLedgerLines(tenant, [
              {
                student_id: updated.details.student_id,
                admission_no: updated.details.admission_no || '',
                student_name: updated.details.student_name || 'Scholar',
                class_name: updated.details.class_name || 'Class 1',
                section: updated.details.section || 'A',
                fee_head: (updated.details.fee_head as any) || 'TUITION',
                line_type: 'DISCOUNT',
                amount: discountAmt,
                remarks: `Principal Approval: ${cleanRemarks} (Ref: ${updated.id})`,
                posted_by: principalActor.name,
                academic_session: updated.academic_session || '2026-27'
              }
            ]);
            invalidateFeeOverviewMemoryCache(tenant);
            AggregatesService.recordFeeDelta(tenant, updated.academic_session || '2026-27', {
              pendingPaiseDelta: -discountAmt
            }).catch(() => {});
          }
        } catch (feeErr) {
          console.warn('[APPROVAL_FEE_CONCESSION_SYNC_WARN]', feeErr);
        }
      }

      // 2. Staff Leave Approved -> Sync Teacher status
      if (updated.type === 'STAFF_LEAVE' && updated.details.staff_id) {
        try {
          const teachers = await Database.getTeachers(tenant);
          const t = teachers.find(item => item.id === updated.details.staff_id);
          if (t) {
            t.status = 'ON_LEAVE';
            await Database.saveTeacher(t);
          }
        } catch (leaveErr) {
          console.warn('[APPROVAL_STAFF_LEAVE_SYNC_WARN]', leaveErr);
        }
      }

      // 3. TC Approved -> Sync Student Status
      if (updated.type === 'CERTIFICATE_TC' && updated.details.student_id) {
        try {
          const students = await Database.getStudents(tenant);
          const s = students.find(item => item.id === updated.details.student_id);
          if (s) {
            s.transfer_certificate_no = updated.details.serial_no;
            await Database.saveStudent(s);
          }
        } catch (tcErr) {
          console.warn('[APPROVAL_TC_SYNC_WARN]', tcErr);
        }
      }

      // 4. Admission Approved -> Sync Student status
      if (updated.type === 'ADMISSION' && updated.details.student_id) {
        try {
          const students = await Database.getStudents(tenant);
          const s = students.find(item => item.id === updated.details.student_id);
          if (s) {
            s.status = 'ACTIVE';
            await Database.saveStudent(s);
          }
        } catch (admErr) {
          console.warn('[APPROVAL_ADMISSION_SYNC_WARN]', admErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // AUDIT LOG PERSISTENCE
    // ─────────────────────────────────────────────────────────────
    logAuditEvent({
      actor: principalActor,
      module: 'APPROVALS' as any,
      action: `PRINCIPAL_${cleanAction}`,
      severity: 'INFO',
      summary: `Principal ${cleanAction === 'APPROVE' ? 'Approved' : 'Rejected'} ${updated.type.replace('_', ' ')} for ${updated.title} with remark: "${cleanRemarks}"`,
      details: {
        approval_id: updated.id,
        type: updated.type,
        action: cleanAction,
        remarks: cleanRemarks,
        applicant: updated.requested_by.name,
        details: updated.details
      },
      targetId: updated.details.student_id || updated.details.staff_id || updated.id,
      targetName: updated.details.student_name || updated.details.staff_name || updated.title,
      school_id: tenant,
      session: updated.academic_session
    });

    return NextResponse.json({
      success: true,
      message: `Request successfully ${cleanAction === 'APPROVE' ? 'approved' : 'rejected'}.`,
      request: updated
    });
  } catch (error: any) {
    console.error('[API_PRINCIPAL_APPROVALS_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval action.' },
      { status: 500 }
    );
  }
}
