import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb+srv://blistedx_db_user:b7TGgj57Xu8jX3C1@aierp.3kejnhw.mongodb.net/edugit?retryWrites=true&w=majority&appName=AIERP';

const options = {
  maxPoolSize: 25,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  tls: true,
  tlsAllowInvalidCertificates: true
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return true;
}

export function getMongoUri(): string {
  return uri;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().then(c => {
        console.log('[MongoDB Atlas Cloud] Connected successfully to Online Database (edugit)');
        return c;
      });
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri, options);
      clientPromise = client.connect().then(c => {
        console.log('[MongoDB Atlas Cloud] Connected successfully to Online Database (edugit)');
        return c;
      });
    }
    return clientPromise;
  }
}

export async function getDatabase(dbName = 'edugit'): Promise<Db | null> {
  try {
    const client = await getMongoClient();
    return client.db(dbName);
  } catch (err: any) {
    console.error('[MongoDB Atlas] Connection error:', err.message);
    return null;
  }
}

export async function checkMongoStatus(): Promise<{ connected: boolean; error: string | null; uriMasked: string }> {
  const uriMasked = uri.replace(/:([^@]+)@/, ':****@');

  try {
    const db = await getDatabase();
    if (!db) {
      return { connected: false, error: 'Database instance not available', uriMasked };
    }
    const ping = await db.command({ ping: 1 });
    return { connected: ping.ok === 1, error: null, uriMasked };
  } catch (err: any) {
    return { connected: false, error: err.message, uriMasked };
  }
}
