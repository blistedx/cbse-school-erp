import FeePayment from '@/models/fees/FeePayment';
import { getDatabase } from '@/lib/mongodb';

export async function generateReceiptNo(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCP/${year}/`;

  try {
    const lastPayment = await FeePayment
      .findOne({ schoolId, receiptNo: { $regex: `^${prefix}` } })
      .sort({ createdAt: -1 })
      .lean();

    if (lastPayment && lastPayment.receiptNo) {
      const parts = lastPayment.receiptNo.split('/');
      const lastNum = parseInt(parts.pop() || '0', 10);
      return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
    }
  } catch {
    // Direct Mongo driver fallback
    try {
      const db = await getDatabase();
      if (db) {
        const lastDoc = await db.collection('fee_payments')
          .findOne(
            { schoolId, receiptNo: { $regex: `^${prefix}` } },
            { sort: { createdAt: -1 } }
          );

        if (lastDoc && lastDoc.receiptNo) {
          const parts = lastDoc.receiptNo.split('/');
          const lastNum = parseInt(parts.pop() || '0', 10);
          return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
        }
      }
    } catch {}
  }

  // First receipt of the year: e.g. RCP/2026/00001
  return `${prefix}${String(1).padStart(5, '0')}`;
}

export default generateReceiptNo;
