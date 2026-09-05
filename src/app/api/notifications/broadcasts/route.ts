/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { getBroadcastHistory, sendWebPushNotification } from '@/lib/web-push';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const broadcasts = await getBroadcastHistory(50);
    return NextResponse.json({
      success: true,
      count: broadcasts.length,
      broadcasts
    });
  } catch (error: any) {
    console.error('[API Broadcasts GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      body: messageBody,
      url = '/app',
      audience = 'ALL',
      urgent = false,
      senderName = 'School Administration',
      senderRole = 'PRINCIPAL'
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and message body are required' },
        { status: 400 }
      );
    }

    if (senderRole === 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Bus Drivers are not permitted to send broadcast messages.' },
        { status: 403 }
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
      message: `Broadcast successfully dispatched to ${results.sent} active device(s).`
    });
  } catch (error: any) {
    console.error('[API Broadcasts POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch broadcast' },
      { status: 500 }
    );
  }
}
