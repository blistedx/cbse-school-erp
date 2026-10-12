/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { Database } from '@/lib/db';
import { AttendanceService } from '@/lib/services/attendance.service';
import { FeesService } from '@/lib/services/fees.service';
import { getTodayDateStr, isSameClass, normalizeClassName } from '@/lib/utils';
import { PrincipalStudentDossier } from '@/lib/types';

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
    const category = (searchParams.get('category') || 'attendance').toLowerCase();
    const subReport = searchParams.get('sub_report') || 'class_wise';

    // Filters
    const className = searchParams.get('class_name') || searchParams.get('className') || undefined;
    const section = searchParams.get('section') || undefined;
    const month = searchParams.get('month') || undefined;
    const dateFrom = searchParams.get('date_from') || searchParams.get('from') || undefined;
    const dateTo = searchParams.get('date_to') || searchParams.get('to') || undefined;
    const search = searchParams.get('search') || undefined;
    const examId = searchParams.get('exam_id') || undefined;
    const studentId = searchParams.get('student_id') || undefined;

    // ─────────────────────────────────────────────────────────────
    // 1. ATTENDANCE REPORTS
    // ─────────────────────────────────────────────────────────────
    if (category === 'attendance') {
      if (subReport === 'student_absent_list' || subReport === 'absent_list') {
        const targetDate = dateFrom || getTodayDateStr();
        const absents = await AttendanceService.getAbsentList(tenant, targetDate, session, className, section);
        return NextResponse.json({
          success: true,
          category,
          subReport,
          date: targetDate,
          count: absents.length,
          data: absents
        });
      }

      if (subReport === 'staff_attendance') {
        const targetDate = dateFrom || getTodayDateStr();
        const [teachers, records] = await Promise.all([
          Database.getTeachers(tenant, session),
          AttendanceService.getAllAttendanceRecords(tenant, session)
        ]);

        const facRecord = records.find(r =>
          r.date === targetDate &&
          (/faculty|staff/i.test(r.class_name || '') || /faculty|staff/i.test(r.section || ''))
        );

        const teacherStatusMap = new Map<string, string>();
        if (facRecord?.student_records) {
          for (const sr of facRecord.student_records) {
            teacherStatusMap.set(sr.student_id, sr.status);
          }
        }

        const data = teachers.map(t => {
          const status = teacherStatusMap.get(t.id) || (t.status === 'ON_LEAVE' ? 'LEAVE' : 'PRESENT');
          return {
            id: t.id,
            staff_code: t.staff_code || t.employee_code || 'EMP',
            full_name: t.full_name,
            department: t.department || 'Academics',
            designation: t.designation || 'Faculty',
            phone: t.phone || 'N/A',
            date: targetDate,
            status
          };
        });

        return NextResponse.json({
          success: true,
          category,
          subReport,
          date: targetDate,
          count: data.length,
          data
        });
      }

      if (subReport === 'date_wise') {
        const records = await AttendanceService.getAllAttendanceRecords(tenant, session);
        let filtered = records.filter(r =>
          !/faculty|staff/i.test(r.class_name || '') &&
          !/faculty|staff/i.test(r.section || '')
        );

        if (dateFrom) filtered = filtered.filter(r => r.date >= dateFrom);
        if (dateTo) filtered = filtered.filter(r => r.date <= dateTo);
        if (className) filtered = filtered.filter(r => isSameClass(r.class_name, className));
        if (section) filtered = filtered.filter(r => (r.section || 'A').toUpperCase() === section.toUpperCase());

        // Group by Date
        const dateMap = new Map<string, { present: number; total: number }>();
        for (const r of filtered) {
          const cur = dateMap.get(r.date) || { present: 0, total: 0 };
          cur.present += Number(r.present_count) || 0;
          cur.total += Number(r.total_students) || 0;
          dateMap.set(r.date, cur);
        }

        const rows = Array.from(dateMap.entries()).map(([date, counts]) => {
          const absent = Math.max(0, counts.total - counts.present);
          const percent = counts.total > 0 ? Number(((counts.present / counts.total) * 100).toFixed(1)) : 0;
          return {
            date,
            totalStudents: counts.total,
            presentCount: counts.present,
            absentCount: absent,
            attendancePercent: percent
          };
        }).sort((a, b) => b.date.localeCompare(a.date));

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: rows.length,
          data: rows
        });
      }

      // Default: class_wise
      const [records, classes, students] = await Promise.all([
        AttendanceService.getAllAttendanceRecords(tenant, session),
        Database.getClasses(tenant, session),
        Database.getStudents(tenant, session)
      ]);

      const targetDate = dateFrom || getTodayDateStr();
      const dateRecords = records.filter(r => r.date === targetDate);

      const rows = classes.map(c => {
        const classStudents = students.filter(s =>
          isSameClass(s.class_name, c.class_name) &&
          (s.section || 'A').toUpperCase() === (c.section || 'A').toUpperCase() &&
          s.status !== 'INACTIVE'
        );
        const matchRec = dateRecords.find(r =>
          isSameClass(r.class_name, c.class_name) &&
          (r.section || 'A').toUpperCase() === (c.section || 'A').toUpperCase()
        );

        const total = classStudents.length > 0 ? classStudents.length : (Number(matchRec?.total_students) || 0);
        const present = Number(matchRec?.present_count) || 0;
        const absent = matchRec ? Math.max(0, total - present) : 0;
        const percent = total > 0 && matchRec ? Number(((present / total) * 100).toFixed(1)) : 0;

        return {
          className: c.class_name,
          section: c.section || 'A',
          classSection: `${c.class_name} - ${c.section || 'A'}`,
          totalStudents: total,
          presentCount: present,
          absentCount: absent,
          attendancePercent: percent,
          isMarked: Boolean(matchRec),
          date: targetDate
        };
      });

      return NextResponse.json({
        success: true,
        category,
        subReport,
        date: targetDate,
        count: rows.length,
        data: rows
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. FEES REPORTS (USES FEE MASTER REPORT ENGINE)
    // ─────────────────────────────────────────────────────────────
    if (category === 'fees') {
      if (subReport === 'pending_defaulters') {
        const pending = await FeesService.getPendingList(tenant, session, {
          className,
          section,
          month,
          search
        });
        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: pending.length,
          data: pending
        });
      }

      if (subReport === 'annual_fee_pending') {
        const res = await FeesService.getAnnualFeePending(tenant, session, {
          className,
          section,
          search
        });
        return NextResponse.json({
          success: true,
          category,
          subReport,
          totalDuePaise: res.totalDuePaise,
          totalPendingCount: res.totalPendingCount,
          count: res.items.length,
          data: res.items
        });
      }

      if (subReport === 'discount_sibling_summary' || subReport === 'sibling_discounts') {
        const report = await FeesService.executeReport(tenant, 'sibling_discount_report', {
          session,
          classes: className ? [className] : undefined,
          search
        });
        return NextResponse.json({
          success: true,
          category,
          subReport,
          summaryKpis: report.summaryKpis,
          columns: report.columns,
          count: report.rows.length,
          data: report.rows,
          grandTotalRow: report.grandTotalRow
        });
      }

      // Default: month_wise and class_wise collection
      const targetMonth = month || 'SEP';
      const report = await FeesService.executeReport(tenant, 'month_class_collection', {
        session,
        months: targetMonth ? [targetMonth as any] : undefined,
        classes: className ? [className] : undefined,
        search
      });

      return NextResponse.json({
        success: true,
        category,
        subReport,
        month: targetMonth,
        summaryKpis: report.summaryKpis,
        columns: report.columns,
        count: report.rows.length,
        data: report.rows,
        grandTotalRow: report.grandTotalRow
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ACADEMICS REPORTS
    // ─────────────────────────────────────────────────────────────
    if (category === 'academics') {
      const [exams, marks, students] = await Promise.all([
        Database.getScheduledExams(tenant, session),
        Database.getExamMarks(tenant, session),
        Database.getStudents(tenant, session)
      ]);

      if (subReport === 'syllabus_completion') {
        const [plans, progress, classes] = await Promise.all([
          Database.getSyllabusPlans(tenant, session, className, searchParams.get('subject') || undefined, month || undefined),
          Database.getSyllabusProgress(tenant),
          Database.getClasses(tenant)
        ]);

        const rows = plans.map(p => {
          const cls = classes.find(c => isSameClass(c.class_name, p.class_name));
          const subj = cls?.subjects?.find(s => s.name.toLowerCase().trim() === p.subject_name.toLowerCase().trim());
          const teacherName = subj?.assigned_teacher || cls?.class_teacher || 'Assigned Faculty';

          const topics = p.topics || [];
          const completedTopics = topics.filter(t => {
            const prog = progress.find(pr => pr.topic_id === t.id);
            return prog?.status === 'COMPLETED';
          });

          const totalPlannedPeriods = topics.reduce((acc, t) => acc + (t.planned_periods || 0), 0);
          const totalPeriodsUsed = topics.reduce((acc, t) => {
            const prog = progress.find(pr => pr.topic_id === t.id);
            return acc + (prog?.periods_used || 0);
          }, 0);

          const percent = topics.length > 0 ? Math.round((completedTopics.length / topics.length) * 100) : 0;

          return {
            id: p.id,
            class_name: p.class_name,
            subject_name: p.subject_name,
            month: p.month,
            assigned_teacher: teacherName,
            total_topics: topics.length,
            completed_topics: completedTopics.length,
            pending_topics: topics.length - completedTopics.length,
            planned_periods: totalPlannedPeriods,
            periods_used: totalPeriodsUsed,
            completion_percent: percent,
            status: percent === 100 ? 'COMPLETED' : percent > 0 ? 'IN_PROGRESS' : 'PENDING'
          };
        });

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: rows.length,
          data: rows
        });
      }

      if (subReport === 'toppers') {
        // Compute overall student percentages
        const studentMarksMap = new Map<string, { totalObtained: number; totalMax: number; count: number }>();
        for (const m of marks) {
          if (examId && m.exam_id !== examId) continue;
          if (className && !isSameClass(m.class_name, className)) continue;

          const cur = studentMarksMap.get(m.student_id) || { totalObtained: 0, totalMax: 0, count: 0 };
          cur.totalObtained += Number(m.marks_obtained) || 0;
          cur.totalMax += Number(m.max_marks) || 100;
          cur.count += 1;
          studentMarksMap.set(m.student_id, cur);
        }

        const toppers = Array.from(studentMarksMap.entries())
          .map(([sId, record]) => {
            const student = students.find(s => s.id === sId);
            const percent = record.totalMax > 0
              ? Number(((record.totalObtained / record.totalMax) * 100).toFixed(2))
              : 0;
            return {
              studentId: sId,
              studentName: student?.full_name || 'Scholar',
              admissionNo: student?.admission_no || '',
              className: student?.class_name || 'Class 10',
              section: student?.section || 'A',
              totalObtained: record.totalObtained,
              totalMax: record.totalMax,
              subjectsCount: record.count,
              percentage: percent
            };
          })
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 10);

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: toppers.length,
          data: toppers
        });
      }

      if (subReport === 'subject_performance') {
        const subjectMap = new Map<string, {
          marks: number[];
          maxMarks: number;
          passed: number;
          total: number;
        }>();

        for (const m of marks) {
          if (examId && m.exam_id !== examId) continue;
          if (className && !isSameClass(m.class_name, className)) continue;

          const sub = m.subject_name || 'General';
          const cur = subjectMap.get(sub) || { marks: [], maxMarks: Number(m.max_marks) || 100, passed: 0, total: 0 };
          const obt = Number(m.marks_obtained) || 0;
          cur.marks.push(obt);
          cur.total += 1;
          if (obt >= (cur.maxMarks * 0.33)) cur.passed += 1;
          subjectMap.set(sub, cur);
        }

        const data = Array.from(subjectMap.entries()).map(([sub, stat]) => {
          const max = stat.marks.length > 0 ? Math.max(...stat.marks) : 0;
          const min = stat.marks.length > 0 ? Math.min(...stat.marks) : 0;
          const sum = stat.marks.reduce((a, b) => a + b, 0);
          const avg = stat.marks.length > 0 ? Number((sum / stat.marks.length).toFixed(1)) : 0;
          const passRate = stat.total > 0 ? Number(((stat.passed / stat.total) * 100).toFixed(1)) : 0;

          return {
            subjectName: sub,
            studentsCount: stat.total,
            maxScore: max,
            minScore: min,
            averageScore: avg,
            passingPercentage: passRate
          };
        });

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: data.length,
          data
        });
      }

      if (subReport === 'published_report_cards') {
        const templates = await Database.getReportCardTemplates(tenant, session, className);
        const publishedTemplates = templates.filter(t => t.status === 'PUBLISHED');

        // Target students of class
        const targetStudents = className
          ? students.filter(s => isSameClass(s.class_name, className) && s.status !== 'INACTIVE')
          : students.slice(0, 30);

        return NextResponse.json({
          success: true,
          category,
          subReport,
          templatesCount: publishedTemplates.length,
          templates: publishedTemplates,
          studentsCount: targetStudents.length,
          students: targetStudents.map(s => ({
            id: s.id,
            admission_no: s.admission_no,
            full_name: s.full_name,
            class_name: s.class_name,
            section: s.section,
            roll_no: s.roll_no
          }))
        });
      }

      // Default: exam_class_result
      const filteredMarks = marks.filter(m => {
        if (examId && m.exam_id !== examId) return false;
        if (className && !isSameClass(m.class_name, className)) return false;
        return true;
      });

      // Group marks by student
      const studentResultMap = new Map<string, {
        studentId: string;
        subjects: Record<string, { obtained: number; max: number; grade: string }>;
        totalObtained: number;
        totalMax: number;
      }>();

      for (const m of filteredMarks) {
        const cur = studentResultMap.get(m.student_id) || {
          studentId: m.student_id,
          subjects: {},
          totalObtained: 0,
          totalMax: 0
        };
        cur.subjects[m.subject_name] = {
          obtained: Number(m.marks_obtained) || 0,
          max: Number(m.max_marks) || 100,
          grade: m.grade || 'A'
        };
        cur.totalObtained += Number(m.marks_obtained) || 0;
        cur.totalMax += Number(m.max_marks) || 100;
        studentResultMap.set(m.student_id, cur);
      }

      const rows = Array.from(studentResultMap.values()).map(res => {
        const student = students.find(s => s.id === res.studentId);
        const pct = res.totalMax > 0 ? Number(((res.totalObtained / res.totalMax) * 100).toFixed(1)) : 0;
        let grade = 'A1';
        if (pct < 33) grade = 'E (Needs Improvement)';
        else if (pct < 50) grade = 'D';
        else if (pct < 60) grade = 'C';
        else if (pct < 75) grade = 'B';
        else if (pct < 90) grade = 'A';
        else grade = 'A+';

        return {
          studentId: res.studentId,
          studentName: student?.full_name || 'Scholar',
          admissionNo: student?.admission_no || '',
          className: student?.class_name || className || 'Class 10',
          section: student?.section || 'A',
          rollNo: student?.roll_no || '1',
          subjects: res.subjects,
          totalObtained: res.totalObtained,
          totalMax: res.totalMax,
          percentage: pct,
          grade,
          status: pct >= 33 ? 'PASSED' : 'FAILED'
        };
      }).sort((a, b) => b.percentage - a.percentage);

      return NextResponse.json({
        success: true,
        category,
        subReport,
        count: rows.length,
        exams: exams.map(e => ({ id: e.id, name: e.title || e.type, date: e.date, class_name: e.class_name })),
        data: rows
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. STUDENTS REPORTS (STRENGTH & DOSSIER)
    // ─────────────────────────────────────────────────────────────
    if (category === 'students') {
      const students = await Database.getStudents(tenant, session);

      if (subReport === 'student_dossier') {
        if (!studentId) {
          // Return search list
          let filtered = students.filter(s => s.status !== 'INACTIVE');
          if (className) filtered = filtered.filter(s => isSameClass(s.class_name, className));
          if (section) filtered = filtered.filter(s => (s.section || 'A').toUpperCase() === section.toUpperCase());
          if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(s =>
              (s.full_name || '').toLowerCase().includes(q) ||
              (s.admission_no || '').toLowerCase().includes(q)
            );
          }

          return NextResponse.json({
            success: true,
            category,
            subReport,
            count: filtered.length,
            students: filtered.slice(0, 50).map(s => ({
              id: s.id,
              admission_no: s.admission_no,
              full_name: s.full_name,
              class_name: s.class_name,
              section: s.section,
              roll_no: s.roll_no,
              father_name: s.father_name || s.guardian_name,
              phone: s.guardian_phone || s.phone
            }))
          });
        }

        // Complete Student Dossier 360 Card
        const student = students.find(s => s.id === studentId || s.admission_no === studentId);
        if (!student) {
          return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
        }

        const [attStatus, feeStatus, examMarks] = await Promise.all([
          AttendanceService.getStudentAttendance(tenant, student.id, session),
          FeesService.getStudentFeeStatus(tenant, student.id, session),
          Database.getExamMarks(tenant, session, undefined, undefined, student.id)
        ]);

        const dossier: PrincipalStudentDossier = {
          student,
          attendance: {
            totalWorkingDays: attStatus.totalWorkingDays,
            presentDays: attStatus.presentDays,
            absentDays: attStatus.absentDays,
            leaveDays: attStatus.leaveDays,
            attendancePercent: attStatus.attendancePercent,
            records: attStatus.records.slice(-10)
          },
          fees: {
            totalBilled: Math.round(feeStatus.summary.totalBilledPaise / 100),
            totalPaid: Math.round(feeStatus.summary.totalPaidPaise / 100),
            totalPending: Math.round(feeStatus.summary.netPendingPaise / 100),
            status: feeStatus.summary.status,
            receiptsCount: feeStatus.receipts.length,
            receipts: feeStatus.receipts.map(r => ({
              receipt_no: r.receipt_no,
              date: r.payment_date,
              amount: Math.round(r.amount_paise / 100),
              payment_mode: r.payment_mode
            }))
          },
          marks: examMarks.map(m => ({
            exam_id: m.exam_id,
            exam_name: m.exam_id,
            subject: m.subject_name,
            marks_obtained: Number(m.marks_obtained) || 0,
            max_marks: Number(m.max_marks) || 100,
            grade: m.grade
          }))
        };

        return NextResponse.json({
          success: true,
          category,
          subReport,
          dossier
        });
      }

      // Default: class_wise strength
      const classes = await Database.getClasses(tenant, session);
      const rows = classes.map(c => {
        const cStudents = students.filter(s =>
          isSameClass(s.class_name, c.class_name) &&
          (s.section || 'A').toUpperCase() === (c.section || 'A').toUpperCase() &&
          s.status !== 'INACTIVE'
        );

        const boys = cStudents.filter(s => (s.gender || '').toUpperCase() === 'MALE').length;
        const girls = cStudents.filter(s => (s.gender || '').toUpperCase() === 'FEMALE').length;
        const other = cStudents.length - boys - girls;
        const rte = cStudents.filter(s => String(s.is_rte || '').toUpperCase() === 'YES').length;
        const transport = cStudents.filter(s => String(s.transport_opted || '').toUpperCase() === 'YES').length;

        return {
          className: c.class_name,
          section: c.section || 'A',
          classSection: `${c.class_name} - ${c.section || 'A'}`,
          boysCount: boys,
          girlsCount: girls,
          otherCount: other,
          totalStrength: cStudents.length,
          rteCount: rte,
          transportOpted: transport
        };
      });

      return NextResponse.json({
        success: true,
        category,
        subReport,
        totalStudentsCount: students.filter(s => s.status !== 'INACTIVE').length,
        count: rows.length,
        data: rows
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. STAFF REPORTS
    // ─────────────────────────────────────────────────────────────
    if (category === 'staff') {
      const teachers = await Database.getTeachers(tenant, session);

      if (subReport === 'class_subject_allocation') {
        const rows = teachers.map(t => ({
          id: t.id,
          staffCode: t.staff_code || t.employee_code || 'EMP',
          staffName: t.full_name,
          department: t.department || 'Academics',
          assignedClass: t.assigned_class || 'None',
          subjectsTaught: Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.department || 'General'),
          classesTaught: t.classes_taught || 'General Classes',
          teacherType: t.teacher_type || 'TGT'
        }));

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: rows.length,
          data: rows
        });
      }

      if (subReport === 'leave_summary') {
        const approvals = await Database.getApprovals(tenant, session, 'STAFF_LEAVE');
        const rows = teachers.map(t => {
          const tApprovals = approvals.filter(a => a.details?.staff_id === t.id);
          const approved = tApprovals.filter(a => a.status === 'APPROVED');
          const pending = tApprovals.filter(a => a.status === 'PENDING');
          const totalDaysTaken = approved.reduce((sum, a) => sum + (Number(a.details?.days) || 1), 0);

          return {
            id: t.id,
            staffCode: t.staff_code || 'EMP',
            staffName: t.full_name,
            department: t.department || 'Academics',
            designation: t.designation || 'Faculty',
            status: t.status,
            totalApplications: tApprovals.length,
            approvedLeaves: approved.length,
            pendingLeaves: pending.length,
            totalDaysTaken,
            remainingCasualQuota: Math.max(0, 12 - totalDaysTaken)
          };
        });

        return NextResponse.json({
          success: true,
          category,
          subReport,
          count: rows.length,
          data: rows
        });
      }

      // Default: staff_list
      let filtered = teachers;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(t =>
          (t.full_name || '').toLowerCase().includes(q) ||
          (t.staff_code || '').toLowerCase().includes(q) ||
          (t.department || '').toLowerCase().includes(q)
        );
      }

      const rows = filtered.map(t => ({
        id: t.id,
        staffCode: t.staff_code || t.employee_code || 'EMP',
        fullName: t.full_name,
        department: t.department || 'Academics',
        designation: t.designation || 'Faculty',
        qualification: t.qualification || 'M.A., B.Ed',
        phone: t.phone || 'N/A',
        email: t.email || 'N/A',
        status: t.status || 'ACTIVE',
        employmentType: t.employment_type || 'PERMANENT',
        dateOfJoining: t.date_of_joining || '2024-04-01'
      }));

      return NextResponse.json({
        success: true,
        category,
        subReport,
        count: rows.length,
        data: rows
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid report category: ${category}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API_PRINCIPAL_REPORTS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate requested Principal Report.' },
      { status: 500 }
    );
  }
}
