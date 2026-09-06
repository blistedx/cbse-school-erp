import { NextResponse } from 'next/server';
import { sendWebPushNotification } from '@/lib/web-push';
import { requireRole, STAFF_ROLES } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const auth = requireRole(request, STAFF_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const {
      title,
      body: messageBody,
      url = '/app',
      audience = 'ALL',
      urgent = false,
      senderName = 'School Administration',
      senderRole = 'ADMIN'
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and message body are required' },
        { status: 400 }
      );
    }

    const results = await sendWebPushNotification({
      title,
      body: messageBody,
      url,
      audience,
      urgent,
      senderName,
      senderRole
    });

    return NextResponse.json({
      success: true,
      results,
      message: `Dispatched to ${results.sent} active device(s).`
    });
  } catch (error: any) {
    console.error('[API Send Notification Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to dispatch push notification' },
      { status: 500 }
    );
  }
}
