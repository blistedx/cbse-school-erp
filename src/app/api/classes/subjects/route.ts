/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

// GET subjects for a class
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id') || searchParams.get('classId');
    if (!classId) {
      return NextResponse.json({ success: false, error: 'class_id is required' }, { status: 400 });
    }

    const classes = await Database.getClasses();
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      class_id: classId,
      class_name: targetClass.class_name,
      section: targetClass.section,
      subjects: targetClass.subjects || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add a new subject or update entire subjects list
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { class_id, subjects, name, code, type, weekly_periods, assigned_teacher, max_marks } = body;

    if (!class_id) {
      return NextResponse.json({ success: false, error: 'class_id is required' }, { status: 400 });
    }

    // Bulk update subjects
    if (Array.isArray(subjects)) {
      const updatedClass = await Database.updateClassSubjects(class_id, subjects);
      return NextResponse.json({ success: true, class: updatedClass, subjects: updatedClass?.subjects || [] });
    }

    // Add single subject
    if (!name) {
      return NextResponse.json({ success: false, error: 'Subject name is required' }, { status: 400 });
    }

    const updatedClass = await Database.addSubjectToClass(class_id, {
      name,
      code,
      type,
      weekly_periods,
      assigned_teacher,
      max_marks
    });

    return NextResponse.json({ success: true, class: updatedClass, subjects: updatedClass?.subjects || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Rename / edit an existing subject in a class
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { class_id, subject_id, name, code, type, weekly_periods, assigned_teacher, max_marks } = body;

    if (!class_id || !subject_id) {
      return NextResponse.json({ success: false, error: 'class_id and subject_id are required' }, { status: 400 });
    }

    const updatedClass = await Database.updateClassSubject(class_id, subject_id, {
      name,
      code,
      type,
      weekly_periods,
      assigned_teacher,
      max_marks
    });

    return NextResponse.json({ success: true, class: updatedClass, subjects: updatedClass?.subjects || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a subject from a class
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id') || searchParams.get('classId');
    const subjectId = searchParams.get('subject_id') || searchParams.get('subjectId');

    if (!classId || !subjectId) {
      return NextResponse.json({ success: false, error: 'class_id and subject_id are required' }, { status: 400 });
    }

    const updatedClass = await Database.deleteSubjectFromClass(classId, subjectId);
    return NextResponse.json({ success: true, class: updatedClass, subjects: updatedClass?.subjects || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Reset subjects of a class to CBSE standards
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { class_id } = body;

    if (!class_id) {
      return NextResponse.json({ success: false, error: 'class_id is required' }, { status: 400 });
    }

    const updatedClass = await Database.resetClassToCbseSubjects(class_id);
    return NextResponse.json({ success: true, class: updatedClass, subjects: updatedClass?.subjects || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
