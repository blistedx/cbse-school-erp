import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { school_code, username, password, role } = body;

    const auth = await Database.authenticateUser(school_code, username, password, role);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthorized school access.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: auth.user,
      school: auth.school
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
