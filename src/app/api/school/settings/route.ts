import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      school_id,
      school_name,
      board,
      city,
      principal_name,
      admin_name,
      admin_id,
      username,
      full_name,
      admin_pin
    } = body;

    if (!school_id) {
      return NextResponse.json({ success: false, error: 'School ID is required' }, { status: 400 });
    }

    const updated = await Database.updateSchoolSettings(school_id, {
      school_name,
      board,
      city,
      principal_name: principal_name || full_name || admin_name,
      admin_name: admin_name || full_name || principal_name,
      admin_id: admin_id || username,
      admin_pin
    });

    return NextResponse.json({ success: true, school: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
