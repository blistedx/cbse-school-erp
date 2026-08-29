import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendDemoRequestEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolName, city, strength, board, contactName, email, phone, notes } = body;

    if (!schoolName || !contactName || !email) {
      return NextResponse.json(
        { success: false, error: 'School name, contact name, and email are required.' },
        { status: 400 }
      );
    }

    // 1. Save as PENDING Demo Request (Lead Queue) immediately
    const demoReq = await Database.createDemoRequest({
      school_name: schoolName.trim(),
      city: city?.trim() || '',
      strength: strength?.trim() || '',
      board: board?.trim() || 'CBSE',
      contact_name: contactName.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      notes: notes?.trim() || ''
    });

    // 2. Dispatch email notification in background (non-blocking for sub-100ms response)
    sendDemoRequestEmail({
      schoolName,
      city: city || 'Not specified',
      strength: strength || 'N/A',
      board: board || 'CBSE',
      contactName,
      email,
      phone,
      notes
    }).catch((err) => {
      console.warn('Background email notification error:', err);
    });

    // 3. Return instant response to the client
    return NextResponse.json({
      success: true,
      requestId: demoReq.id,
      message: 'Demo request submitted successfully. Our team will review your request within 2 business days.'
    });
  } catch (error: any) {
    console.error('Request demo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit demo request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requests = await Database.getDemoRequests();
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
