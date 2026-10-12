import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const emptyCols = ['feepayments', 'transactions', 'incomes', 'expenses', 'studentfees'];

async function dropEmpty() {
  const client = new MongoClient(process.env.MONGODB_URI, { tlsAllowInvalidCertificates: true });
  try {
    await client.connect();
    const db = client.db('edugit');
    for (const col of emptyCols) {
      const c = db.collection(col);
      const count = await c.countDocuments();
      if (count === 0) {
        await db.dropCollection(col);
        console.log(`[Mongo Atlas] Successfully dropped empty collection: ${col}`);
      } else {
        console.warn(`[Mongo Atlas] Skipped ${col} — contains ${count} documents.`);
      }
    }
  } catch (err) {
    console.error('Error dropping collections:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

dropEmpty();
