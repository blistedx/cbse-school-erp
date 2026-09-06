/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sendDemoRequestEmail } from '@/lib/email';
import { requireRole, AGENCY_ONLY } from '@/lib/auth-guard';
import { checkRateLimit } from '@/lib/rate-limiter';
import { validateBody, demoRequestSchema } from '@/lib/validation-schemas';

export async function POST(request: Request) {
  try {
    // 🔒 RATE LIMIT: 5 demo requests per 15 minutes per IP to prevent spam and email abuse
    const rateLimit = checkRateLimit(request, {
      bucketName: 'request_demo',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000
    });
    if (!rateLimit.allowed && rateLimit.response) {
      return rateLimit.response;
    }

    const rawBody = await request.json();
    const validation = validateBody(demoRequestSchema, rawBody);
    if (!validation.success) return validation.response;

    const { schoolName, city, strength, board, contactName, email, phone, notes } = validation.data;

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
    console.error('[API_REQUEST_DEMO_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit demo request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireRole(request, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;
    const requests = await Database.getDemoRequests();
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('[API_REQUEST_DEMO_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch demo requests.' }, { status: 500 });
  }
}
