import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('school_id') || searchParams.get('schoolId') || undefined;
    const teachers = await Database.getTeachers(schoolId);
    return NextResponse.json({ success: true, count: teachers.length, teachers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'UPDATE' || (body.id && body.is_update)) {
      const { id, ...updates } = body;
      const updated = await Database.updateTeacher(id, updates);
      return NextResponse.json({ success: true, message: 'Teacher profile updated!', teacher: updated });
    }
    const schoolId = body.school_id || body.schoolId;
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'school_id is required.' }, { status: 400 });
    }
    const teacher = await Database.createTeacher({ ...body, school_id: schoolId });
    return NextResponse.json({ success: true, message: 'Teacher registered successfully!', teacher });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Teacher ID is required.' }, { status: 400 });
    }
    const updated = await Database.updateTeacher(id, updates);
    return NextResponse.json({ success: true, message: 'Teacher profile updated!', teacher: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Teacher ID is required.' }, { status: 400 });
    }
    const updated = await Database.updateTeacher(id, updates);
    return NextResponse.json({ success: true, message: 'Teacher profile updated!', teacher: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Teacher ID is required.' }, { status: 400 });
    }
    await Database.deleteTeacher(id);
    return NextResponse.json({ success: true, message: 'Teacher deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
