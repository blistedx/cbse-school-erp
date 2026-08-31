/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/lib/mongodb';

// File path for storing subscriptions locally as fallback
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'push_subscriptions.json');

// VAPID Keys Setup (Using standard verified keys with fallback)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLwV4s70LAjU6YFUCkY4vvI65ZTYQWFodZAXhlxvhfbju3T5xONlziQ-nYnG1dZmQepiJD3pVg0BbGTPn_26PPs';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Jif-K8bVCJlgh48dr5JsAcFIyGiIo48oG6ca7EV5pqw';
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

// Read saved push subscriptions from MongoDB Atlas (with local JSON fallback)
export async function getSavedSubscriptions(): Promise<PushSubscriptionRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const records = await db.collection<PushSubscriptionRecord>('push_subscriptions').find({}).toArray();
      if (records && records.length > 0) {
        return records;
      }
    }
  } catch (e) {
    console.warn('[WebPush] MongoDB read error, falling back to local store:', e);
  }

  // Fallback to local file
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}

  return [];
}

// Save or update subscription in MongoDB Atlas & local file
export async function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  role?: string;
  userId?: string;
  class_name?: string;
}): Promise<boolean> {
  const record: PushSubscriptionRecord = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    endpoint: sub.endpoint,
    keys: sub.keys,
    role: sub.role || 'ALL',
    userId: sub.userId || 'guest',
    class_name: sub.class_name || 'ALL',
    createdAt: new Date().toISOString()
  };

  let savedInMongo = false;

  try {
    const db = await getDatabase();
    if (db) {
      await db.collection('push_subscriptions').updateOne(
        { endpoint: sub.endpoint },
        { $set: record },
        { upsert: true }
      );
      savedInMongo = true;
    }
  } catch (e) {
    console.warn('[WebPush] Failed to save in MongoDB, saving locally:', e);
  }

  // Save to local JSON as well
  try {
    let list: PushSubscriptionRecord[] = [];
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
      } catch (e) {}
    }
    const existingIndex = list.findIndex(s => s.endpoint === sub.endpoint);
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
    return savedInMongo;
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
  const subscriptions = await getSavedSubscriptions();
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

  const deadEndpoints: string[] = [];

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
    } catch (error: any) {
      results.failed++;
      console.warn(`[WebPush] Failed to send to ${sub.endpoint.slice(0, 35)}...`, error?.statusCode || error?.message);
      
      // If subscription expired or gone (410 Gone / 404), mark for removal
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        deadEndpoints.push(sub.endpoint);
      }
    }
  }

  // Prune dead subscriptions from MongoDB & local file
  if (deadEndpoints.length > 0) {
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('push_subscriptions').deleteMany({ endpoint: { $in: deadEndpoints } });
      }
    } catch (e) {}

    try {
      const activeSubs = subscriptions.filter(s => !deadEndpoints.includes(s.endpoint));
      fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(activeSubs, null, 2), 'utf-8');
    } catch (e) {}
  }

  return results;
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
