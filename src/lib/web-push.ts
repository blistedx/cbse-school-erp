/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/lib/mongodb';

// File path for storing subscriptions and broadcast logs locally as fallback
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'push_subscriptions.json');
const BROADCASTS_FILE = path.join(process.cwd(), 'data', 'broadcast_notifications.json');

// VAPID Keys Setup — must match keys used at subscription time on the client
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BHPK2Kr3RVjmnjxjUCqpt3Bq3x-dElAKKhWcTP0E3-6nWx80qDLrNOmUcVyiIYb07Ry0Fa-edBtQhpNcAaAtnV0';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '4SpMYw6G3zfXNQOnTFbhvZU369W63QiznlWCaKMmQCs';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:blistedx@gmail.com';

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

export interface BroadcastRecord {
  id: string;
  title: string;
  body: string;
  url: string;
  audience: string;
  urgent: boolean;
  senderName?: string;
  senderRole?: string;
  deliveredCount: number;
  timestamp: string;
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

// Read saved broadcast notifications
export async function getBroadcastHistory(limit = 30): Promise<BroadcastRecord[]> {
  try {
    const db = await getDatabase();
    if (db) {
      const records = await db
        .collection<BroadcastRecord>('broadcast_notifications')
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      if (records && records.length > 0) {
        return records;
      }
    }
  } catch (e) {
    console.warn('[WebPush] MongoDB broadcast read error, falling back to local file:', e);
  }

  try {
    if (fs.existsSync(BROADCASTS_FILE)) {
      const data = fs.readFileSync(BROADCASTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, limit);
      }
    }
  } catch (e) {}

  return [];
}

// Save a broadcast notification to history
export async function saveBroadcastRecord(record: BroadcastRecord): Promise<void> {
  try {
    const db = await getDatabase();
    if (db) {
      await db.collection('broadcast_notifications').insertOne(record as any);
    }
  } catch (e) {
    console.warn('[WebPush] Mongo save broadcast notice:', e);
  }

  try {
    let list: BroadcastRecord[] = [];
    if (fs.existsSync(BROADCASTS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(BROADCASTS_FILE, 'utf-8'));
      } catch (e) {}
    }
    list.unshift(record);
    const dir = path.dirname(BROADCASTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BROADCASTS_FILE, JSON.stringify(list.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {}
}

// Dispatch Web Push notification to all subscribers or targeted audience
export async function sendWebPushNotification({
  title,
  body,
  url = '/app',
  audience = 'ALL',
  urgent = false,
  senderName = 'School Administration',
  senderRole = 'PRINCIPAL'
}: {
  title: string;
  body: string;
  url?: string;
  audience?: string;
  urgent?: boolean;
  senderName?: string;
  senderRole?: string;
}) {
  const subscriptions = await getSavedSubscriptions();
  const results = {
    total: subscriptions.length,
    sent: 0,
    failed: 0,
    errors: [] as string[]
  };

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    urgent,
    tag: `bc-${Date.now()}`,
    data: { url, audience, urgent, timestamp: new Date().toISOString() }
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

  // Record this broadcast to history
  const broadcastLog: BroadcastRecord = {
    id: `bc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title,
    body,
    url,
    audience,
    urgent,
    senderName,
    senderRole,
    deliveredCount: results.sent,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString()
  };
  await saveBroadcastRecord(broadcastLog);

  return results;
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

