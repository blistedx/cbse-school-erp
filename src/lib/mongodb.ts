import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 2000,
  connectTimeoutMS: 2000,
  socketTimeoutMS: 10000,
  tls: true,
  tlsAllowInvalidCertificates: true
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')));
}

export function getMongoUri(): string {
  return uri;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) return null;

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect().then(c => {
          console.log('[MongoDB Atlas Cloud] Connected successfully to Database (edugit)');
          return c;
        }).catch(err => {
          console.warn('[MongoDB Atlas Cloud] Notice: Cloud DB connection unavailable, using Local Store:', err.message);
          global._mongoClientPromise = undefined;
          return null as any;
        });
      }
      return await global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        const client = new MongoClient(uri, options);
        clientPromise = client.connect().then(c => {
          console.log('[MongoDB Atlas Cloud] Connected successfully to Database (edugit)');
          return c;
        }).catch(err => {
          console.warn('[MongoDB Atlas Cloud] Notice: Cloud DB connection unavailable, using Local Store:', err.message);
          clientPromise = null;
          return null as any;
        });
      }
      return await clientPromise;
    }
  } catch (err: any) {
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
