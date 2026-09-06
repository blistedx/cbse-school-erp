/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import { validateBody, createFeeInvoiceSchema, updateFeeInvoiceSchema } from '@/lib/validation-schemas';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const invoices = await Database.getFeeInvoices(tenant, session);
    return NextResponse.json({ success: true, count: invoices.length, invoices });
  } catch (error: any) {
    console.error('[API_FEES_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fee transactions.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const validation = validateBody(createFeeInvoiceSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const tenant = resolveTenantSchoolId(auth, body.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const invoice = await Database.createFeeInvoice({
      ...body,
      school_id: tenant
    });
    return NextResponse.json({ success: true, message: 'Fee invoice created!', invoice });
  } catch (error: any) {
    console.error('[API_FEES_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create fee invoice.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const invoice_id = rawBody.invoice_id || rawBody.id;
    if (!invoice_id) {
      return NextResponse.json({ success: false, error: 'invoice_id is required' }, { status: 400 });
    }

    const validation = validateBody(updateFeeInvoiceSchema, rawBody);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const adminUser = (auth as any)?.user?.full_name || (auth as any)?.user?.username || 'School Administrator';

    const updated = await Database.updateFeeInvoice(invoice_id, {
      status: body.status,
      payment_mode: body.payment_mode,
      paid_amount: body.paid_amount,
      concession_amount: body.concession_amount,
      concession_reason: body.concession_reason,
      waived_by: body.waived_by || adminUser
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Fee invoice updated successfully!', invoice: updated });
  } catch (error: any) {
    console.error('[API_FEES_PATCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update fee invoice.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    const deleted = await Database.deleteFeeInvoice(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error('[API_FEES_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete fee invoice.' }, { status: 500 });
  }
}
