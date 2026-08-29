import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 2000,
  connectTimeoutMS: 2000,
  tls: true,
  tlsAllowInvalidCertificates: true
};

let cachedClient: MongoClient | null = null;
let lastConnectionAttempt = 0;
let lastConnectionError: string | null = null;
const RETRY_INTERVAL_MS = 10000; // Retry Atlas every 10 seconds if it failed

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientInstance: MongoClient | null | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastError: string | null | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastAttemptTime: number | undefined;
}

export function isMongoConfigured(): boolean {
  const currentUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
  return currentUri.startsWith('mongodb://') || currentUri.startsWith('mongodb+srv://');
}

export function getMongoUri(): string {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || '';
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const currentUri = getMongoUri();
  if (!currentUri || (!currentUri.startsWith('mongodb://') && !currentUri.startsWith('mongodb+srv://'))) {
    return null;
  }

  // Check if we already have an active connected client
  if (global._mongoClientInstance) {
    return global._mongoClientInstance;
  }

  // Avoid spamming Atlas if connection recently failed (e.g. IP whitelist / TLS error)
  const now = Date.now();
  const lastAttempt = global._mongoLastAttemptTime || 0;
  if (global._mongoLastError && (now - lastAttempt < RETRY_INTERVAL_MS)) {
    return null; // Return fast null so API uses instant local storage
  }

  global._mongoLastAttemptTime = now;

  try {
    const client = new MongoClient(currentUri, options);
    const connectPromise = client.connect();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Atlas connection probe timeout (800ms)')), 800)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    global._mongoClientInstance = client;
    global._mongoLastError = null;
    cachedClient = client;
    console.log('[MongoDB Atlas] Connected successfully to Cloud Database');
    return client;
  } catch (err: any) {
    global._mongoLastError = err.message || 'Connection failed';
    global._mongoClientInstance = null;
    return null;
  }
}

export async function getDatabase(dbName = 'edusuite'): Promise<Db | null> {
  try {
    const client = await getMongoClient();
    if (!client) return null;
    return client.db(dbName);
  } catch (err) {
    return null;
  }
}

export async function checkMongoStatus(): Promise<{ connected: boolean; error: string | null; uriMasked: string }> {
  const currentUri = getMongoUri();
  const uriMasked = currentUri ? currentUri.replace(/:([^@]+)@/, ':****@') : 'NOT_CONFIGURED';

  if (!isMongoConfigured()) {
    return { connected: false, error: 'MONGODB_URI not configured in .env', uriMasked };
  }

  try {
    const client = new MongoClient(currentUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      tls: true,
      tlsAllowInvalidCertificates: true
    });
    await client.connect();
    const db = client.db('edusuite');
    const ping = await db.command({ ping: 1 });
    await client.close();
    return { connected: ping.ok === 1, error: null, uriMasked };
  } catch (err: any) {
    let helpMsg = err.message;
    if (err.message?.includes('SSL alert') || err.message?.includes('tlsv1 alert internal error') || err.message?.includes('Server selection timed out')) {
      helpMsg = 'MongoDB Atlas IP Whitelist: Please ensure 0.0.0.0/0 (Allow Access from Anywhere) is added to your MongoDB Atlas Network Access list at cloud.mongodb.com.';
    }
    return { connected: false, error: helpMsg, uriMasked };
  }
}
