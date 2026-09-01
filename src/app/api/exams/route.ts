/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { ScheduledExamItem } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const session = searchParams.get('session') || searchParams.get('academic_session') || undefined;
    const class_name = searchParams.get('class_name') || searchParams.get('className') || undefined;
    const type = searchParams.get('type') || undefined;

    const exams = await Database.getScheduledExams(school_id, session, class_name, type);
    return NextResponse.json({ success: true, count: exams.length, exams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Array of exams to batch insert
    if (Array.isArray(body.exams) && body.exams.length > 0) {
      const inserted = await Database.createScheduledExams(body.exams);
      return NextResponse.json({ success: true, count: inserted.length, exams: inserted });
    }

    // 2. Single exam insertion
    const {
      school_id,
      academic_session,
      title,
      type,
      class_name,
      section,
      subject_name,
      subject_code,
      date,
      time,
      max_marks,
      pass_marks,
      status
    } = body;

    if (!title || !class_name || !subject_name) {
      return NextResponse.json(
        { success: false, error: 'Title, class_name, and subject_name are required' },
        { status: 400 }
      );
    }

    const newExam: ScheduledExamItem = {
      id: body.id || `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: school_id || 'DPS2026',
      academic_session: academic_session || '2026-27',
      title,
      type: type || 'CLASS_TEST',
      class_name,
      section: section || 'A',
      subject_name,
      subject_code: subject_code || 'CORE',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '09:30 AM',
      max_marks: Number(max_marks) || 20,
      pass_marks: Number(pass_marks) || Math.ceil((Number(max_marks) || 20) * 0.33),
      status: status || 'PENDING',
      created_at: new Date().toISOString()
    };

    const inserted = await Database.createScheduledExams([newExam]);
    return NextResponse.json({ success: true, exam: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required for update' }, { status: 400 });
    }

    const updated = await Database.updateScheduledExam(id, updates);
    return NextResponse.json({ success: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 });
    }

    const deleted = await Database.deleteScheduledExam(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
