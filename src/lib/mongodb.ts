/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

const options = {
  maxPoolSize: 20,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  tls: true,
  tlsAllowInvalidCertificates: true
};

let lastConnectionFailedAt = 0;
const FAILURE_COOLDOWN_MS = 2000;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoUri(): string {
  let uri = process.env.MONGODB_URI || '';
  if (!uri && typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      const dotenv = require('dotenv');
      dotenv.config({ path: '.env.local' });
      dotenv.config({ path: '.env' });
      uri = process.env.MONGODB_URI || '';
    } catch {
      // ignore
    }
  }
  return uri;
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) return null;

  if (lastConnectionFailedAt && Date.now() - lastConnectionFailedAt < FAILURE_COOLDOWN_MS) {
    return null;
  }

  try {
    // Cache the promise globally in both development and serverless/production
    // to ensure connection reuse across Next.js API routes and warm lambdas
    if (!global._mongoClientPromise) {
      const client = new MongoClient(getMongoUri(), options);
      global._mongoClientPromise = client.connect().then(c => {
        lastConnectionFailedAt = 0;
        console.log('[MongoDB Atlas Cloud] Connected successfully to Database (edugit)');
        return c;
      }).catch(err => {
        lastConnectionFailedAt = Date.now();
        console.warn('[MongoDB Atlas Cloud] Notice: Cloud DB connection unavailable, using Local Store:', err.message);
        global._mongoClientPromise = undefined;
        return null as any;
      });
    }
    return await global._mongoClientPromise;
  } catch (err: any) {
    lastConnectionFailedAt = Date.now();
    return null;
  }
}

export async function getDatabase(dbName = 'edugit'): Promise<Db | null> {
  if (!isMongoConfigured()) return null;
  try {
    const client = await getMongoClient();
    if (!client) return null;
    return client.db(dbName);
  } catch (err: any) {
    return null;
  }
}

export async function checkMongoStatus(): Promise<{ connected: boolean; error: string | null; uriMasked: string }> {
  const uriMasked = uri ? uri.replace(/:([^@]+)@/, ':****@') : 'Local Only';

  if (!isMongoConfigured()) {
    return { connected: false, error: 'MongoDB Atlas not configured (Local Mode)', uriMasked };
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return { connected: false, error: 'Database instance not available (using Local Store)', uriMasked };
    }
    const ping = await db.command({ ping: 1 });
    return { connected: ping.ok === 1, error: null, uriMasked };
  } catch (err: any) {
    return { connected: false, error: err.message, uriMasked };
  }
}

/**
 * Hard constraint enforcement:
 * Recursively scans and strips any base64 raw data URLs (e.g. data:image/...;base64,...)
 * or raw binary Buffers from MongoDB documents.
 * Strictly guarantees that MongoDB stores only URL references and lightweight metadata.
 */
export function sanitizeDocNoBinary<T>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc;
  if (Buffer.isBuffer(doc)) {
    console.warn('[SECURITY VIOLATION PREVENTED]: Attempted to write raw Buffer to MongoDB. Stripped.');
    return '' as any;
  }
  if (Array.isArray(doc)) {
    return doc.map(sanitizeDocNoBinary) as any;
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(doc)) {
    if (Buffer.isBuffer(value)) {
      console.warn(`[SECURITY VIOLATION PREVENTED]: Stripped raw Buffer in field '${key}' before MongoDB persistence.`);
      clean[key] = '';
    } else if (typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,')) {
      console.warn(`[SECURITY VIOLATION PREVENTED]: Stripped raw base64 data in field '${key}' before MongoDB persistence.`);
      clean[key] = '';
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeDocNoBinary(value);
    } else {
      clean[key] = value;
    }
  }
  return clean as T;
}

