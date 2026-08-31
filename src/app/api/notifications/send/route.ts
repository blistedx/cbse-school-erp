/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { sendWebPushNotification } from '@/lib/web-push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, url = '/app', audience = 'ALL', urgent = false } = body;

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
      urgent
    });

    return NextResponse.json({
      success: true,
      results,
      message: `Dispatched to ${results.sent} active device(s).`
    });
  } catch (error: any) {
    console.error('[API Send Notification Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch push notification' },
      { status: 500 }
    );
  }
}
