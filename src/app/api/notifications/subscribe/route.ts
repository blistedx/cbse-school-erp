import { NextResponse } from 'next/server';
import { saveSubscription, getSavedSubscriptions } from '@/lib/web-push';

export async function GET() {
  const subs = getSavedSubscriptions();
  return NextResponse.json({
    success: true,
    count: subs.length,
    subscriptions: subs.map(s => ({ id: s.id, role: s.role, createdAt: s.createdAt }))
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys, role, userId, class_name } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const saved = saveSubscription({ endpoint, keys, role, userId, class_name });

    return NextResponse.json({
      success: saved,
      message: saved ? 'Device subscribed for Web Push notifications successfully.' : 'Failed to save subscription.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
