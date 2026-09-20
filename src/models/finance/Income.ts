import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  schoolId: string;
  academicSession: string;   // e.g. "2026-2027"
  voucherNo: string;         // e.g. "INC-2026-0001"
  date: Date;
  accountHeadId: string;
  accountHeadName: string;
  category: 'FEE_COLLECTION' | 'DONATION' | 'GRANT' | 'UNIFORM_SALE' | 'BOOK_SALE' | 'INTEREST' | 'MISC_INCOME';
  amount: number;
  paymentMode: 'cash' | 'online' | 'cheque' | 'upi' | 'bank_transfer';
  receivedFrom: string;
  transactionRef?: string;
  remarks?: string;
  enteredBy: string;
  status: 'active' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

const IncomeSchema = new Schema<IIncome>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  voucherNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  accountHeadId: { type: String, required: true },
  accountHeadName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['FEE_COLLECTION', 'DONATION', 'GRANT', 'UNIFORM_SALE', 'BOOK_SALE', 'INTEREST', 'MISC_INCOME'],
    default: 'MISC_INCOME'
  },
  amount: { type: Number, required: true },
  paymentMode: { 
    type: String, 
    enum: ['cash', 'online', 'cheque', 'upi', 'bank_transfer'], 
    default: 'cash' 
  },
  receivedFrom: { type: String, required: true },
  transactionRef: String,
  remarks: String,
  enteredBy: { type: String, required: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
}, { timestamps: true });

IncomeSchema.index({ schoolId: 1, date: -1 });

export default mongoose.models.Income || 
  mongoose.model<IIncome>('Income', IncomeSchema);
