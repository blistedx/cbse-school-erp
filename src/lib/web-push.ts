import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// File path for storing subscriptions locally
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'push_subscriptions.json');

// VAPID Keys Setup (Using standard pre-generated valid keys with fallback)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8M_rLd4fI0P4cT6y8dK3x5F1x7q8b2C9e1v4g';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@cbse-school-erp.edu.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('[WebPush] Notice during VAPID setup:', err);
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  role?: string;
  userId?: string;
  class_name?: string;
  createdAt: string;
}

// Read saved push subscriptions
export function getSavedSubscriptions(): PushSubscriptionRecord[] {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('[WebPush] Error reading subscriptions:', e);
    return [];
  }
}

// Save or update subscription
export function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string }; role?: string; userId?: string; class_name?: string }): boolean {
  try {
    const list = getSavedSubscriptions();
    const existingIndex = list.findIndex(s => s.endpoint === sub.endpoint);

    const record: PushSubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      endpoint: sub.endpoint,
      keys: sub.keys,
      role: sub.role || 'ALL',
      userId: sub.userId || 'guest',
      class_name: sub.class_name || 'ALL',
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record, id: list[existingIndex].id };
    } else {
      list.push(record);
    }

    const dir = path.dirname(SUBSCRIPTIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[WebPush] Error saving subscription:', e);
    return false;
  }
}

// Dispatch Web Push notification to all subscribers or targeted audience
export async function sendWebPushNotification({
  title,
  body,
  url = '/app',
  audience = 'ALL',
  urgent = false
}: {
  title: string;
  body: string;
  url?: string;
  audience?: string;
  urgent?: boolean;
}) {
  const subscriptions = getSavedSubscriptions();
  const results = {
    total: subscriptions.length,
    sent: 0,
    failed: 0,
    errors: [] as string[]
  };

  if (subscriptions.length === 0) {
    return results;
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon.svg',
    urgent,
    data: { url }
  });

  const activeSubs: PushSubscriptionRecord[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        payload
      );
      results.sent++;
      activeSubs.push(sub);
    } catch (error: any) {
      results.failed++;
      console.warn(`[WebPush] Failed to send to ${sub.endpoint.slice(0, 35)}...`, error?.statusCode || error?.message);
      
      // If subscription expired or gone (410 Gone / 404), remove it
      if (error?.statusCode !== 410 && error?.statusCode !== 404) {
        activeSubs.push(sub);
      }
    }
  }

  // Prune invalid endpoints
  if (activeSubs.length !== subscriptions.length) {
    try {
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(activeSubs, null, 2), 'utf-8');
    } catch (e) {}
  }

  return results;
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
