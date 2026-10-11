/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { isSameClass, getTodayDateStr } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || searchParams.get('academic_session') || '2026-27';
    const selectedClass = searchParams.get('class_name');
    const selectedSection = searchParams.get('section');
    const selectedSubject = searchParams.get('subject_name');
    const selectedMonth = searchParams.get('month');
    const todayStr = getTodayDateStr();

    // 1. Resolve teacher allocations
    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    // Teacher can only see their allocated class-subject-sections
    const allocatedSubjects = assignments.allocatedSubjects;
    if (allocatedSubjects.length === 0) {
      return NextResponse.json({
        success: true,
        allocated_subjects: [],
        plans: [],
        progress_summary: { total_topics: 0, completed_topics: 0, percent: 0 }
      });
    }

    // Filter target allocations
    const targetAllocations = allocatedSubjects.filter(alloc => {
      if (selectedClass && !isSameClass(alloc.class_name, selectedClass)) return false;
      if (selectedSection && (alloc.section || 'A').toUpperCase() !== selectedSection.toUpperCase()) return false;
      if (selectedSubject && alloc.subject_name.toLowerCase().trim() !== selectedSubject.toLowerCase().trim()) return false;
      return true;
    });

    // 2. Fetch admin syllabus plans
    const allPlans = await Database.getSyllabusPlans(tenant, session);
    const allProgress = await Database.getSyllabusProgress(tenant, assignments.teacher.id);

    // Filter plans that belong to teacher's allocated class-subjects
    const filteredPlans = allPlans.filter(p => {
      const isTeacherSubject = targetAllocations.some(alloc => 
        isSameClass(alloc.class_name, p.class_name) &&
        alloc.subject_name.toLowerCase().trim() === p.subject_name.toLowerCase().trim()
      );
      if (!isTeacherSubject) return false;
      if (selectedMonth && p.month.toLowerCase().trim() !== selectedMonth.toLowerCase().trim()) return false;
      return true;
    });

    // Merge plan topics with teacher progress records
    let totalTopics = 0;
    let completedTopics = 0;

    const enrichedPlans = filteredPlans.map(plan => {
      const enrichedTopics = (plan.topics || []).map(t => {
        const prog = allProgress.find(pr => 
          pr.topic_id === t.id &&
          isSameClass(pr.class_name, plan.class_name) &&
          pr.subject_name.toLowerCase().trim() === plan.subject_name.toLowerCase().trim()
        );

        const status = prog?.status || 'NOT_STARTED';
        const isCompleted = status === 'COMPLETED';
        const isOverdue = !isCompleted && !!t.target_date && t.target_date < todayStr;

        totalTopics++;
        if (isCompleted) completedTopics++;

        return {
          ...t,
          status,
          periods_used: prog ? prog.periods_used : 0,
          completion_date: prog?.completion_date,
          teacher_remarks: prog?.teacher_remarks || '',
          reopen_reason: prog?.reopen_reason,
          is_overdue: isOverdue,
          updated_at: prog?.updated_at
        };
      });

      const planTotal = enrichedTopics.length;
      const planCompleted = enrichedTopics.filter(t => t.status === 'COMPLETED').length;
      const planPercent = planTotal > 0 ? Math.round((planCompleted / planTotal) * 100) : 0;

      return {
        ...plan,
        topics: enrichedTopics,
        total_topics: planTotal,
        completed_topics: planCompleted,
        completion_percent: planPercent
      };
    });

    const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return NextResponse.json({
      success: true,
      allocated_subjects: allocatedSubjects,
      plans: enrichedPlans,
      progress_summary: {
        total_topics: totalTopics,
        completed_topics: completedTopics,
        percent: overallPercent
      }
    });
  } catch (error: any) {
    console.error('[API_TEACHER_SYLLABUS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve syllabus progress.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const userRole = (auth.role || '').toUpperCase();
    if (userRole !== 'TEACHER' && !['SUPERADMIN', 'GOD_ACCESS', 'AGENCY_SUPERADMIN'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const tenant = resolveTenantSchoolId(auth, body.school_id || body.schoolId);
    if (tenant instanceof NextResponse) return tenant;

    const assignments = await Database.getTeacherAssignments(tenant, auth.userId);
    if (!assignments) {
      return NextResponse.json({ success: false, error: 'Teacher assignments not found.' }, { status: 404 });
    }

    const { action, class_name, section, subject_name, topic_id, status, periods_used, completion_date, teacher_remarks, reopen_reason, plan_id } = body;

    // Check teacher is allocated
    const isAllocated = assignments.allocatedSubjects.some(alloc => 
      isSameClass(alloc.class_name, class_name) &&
      (alloc.section || 'A').toUpperCase().trim() === (section || 'A').toUpperCase().trim() &&
      alloc.subject_name.toLowerCase().trim() === subject_name.toLowerCase().trim()
    );

    if (!isAllocated && userRole === 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: `Security Violation: You cannot modify syllabus progress for ${class_name}-${section} ${subject_name}.`
      }, { status: 403 });
    }

    // Handle "Mark Month Completed"
    if (action === 'complete_month' && plan_id) {
      const allPlans = await Database.getSyllabusPlans(tenant, body.academic_session || '2026-27');
      const targetPlan = allPlans.find(p => p.id === plan_id);
      if (!targetPlan) {
        return NextResponse.json({ success: false, error: 'Syllabus plan not found.' }, { status: 404 });
      }

      const todayStr = getTodayDateStr();
      for (const topic of targetPlan.topics || []) {
        await Database.saveSyllabusProgress({
          id: `SYL-PRG-${topic.id}-${section || 'A'}`,
          school_id: tenant,
          academic_session: body.academic_session || '2026-27',
          teacher_id: assignments.teacher.id,
          class_name,
          section: section || 'A',
          subject_name,
          topic_id: topic.id,
          status: 'COMPLETED',
          periods_used: topic.planned_periods || 1,
          completion_date: todayStr,
          teacher_remarks: `Marked completed with month batch (${targetPlan.month})`,
          updated_at: new Date().toISOString()
        });
      }

      return NextResponse.json({
        success: true,
        message: `All topics in ${targetPlan.month} marked completed successfully.`
      });
    }

    // Single topic progress update
    if (!topic_id) {
      return NextResponse.json({ success: false, error: 'Topic ID is required.' }, { status: 400 });
    }

    // If reopening a completed topic, check mandatory reopen reason
    if (status !== 'COMPLETED' && reopen_reason) {
      if (reopen_reason.trim().length < 5) {
        return NextResponse.json({ success: false, error: 'A justification reason is required to re-open a topic.' }, { status: 400 });
      }
    }

    const savedProgress = await Database.saveSyllabusProgress({
      id: body.id,
      school_id: tenant,
      academic_session: body.academic_session || '2026-27',
      teacher_id: assignments.teacher.id,
      class_name,
      section: section || 'A',
      subject_name,
      topic_id,
      status: status || 'IN_PROGRESS',
      periods_used: Number(periods_used) || 0,
      completion_date: status === 'COMPLETED' ? (completion_date || getTodayDateStr()) : undefined,
      teacher_remarks: (teacher_remarks || '').trim(),
      reopen_reason: reopen_reason ? reopen_reason.trim() : undefined,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Topic status updated to ${status}.`,
      progress: savedProgress
    });
  } catch (error: any) {
    console.error('[API_TEACHER_SYLLABUS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update syllabus progress.' }, { status: 500 });
  }
}
