import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction {
  schoolId: string;
  type: 'income' | 'expense';
  category: string;        // Fee, Salary, Electricity, Maintenance, Exam Fee, etc.
  amount: number;
  date: Date;
  paymentMode?: string;    // cash, bank_transfer, upi, cheque, card
  reference?: string;      // Receipt/Invoice No
  description?: string;
  voucherNo: string;
  attachmentUrl?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const TransactionSchema = new Schema<ITransactionDocument>({
  schoolId: { type: String, required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now, index: true },
  paymentMode: { type: String, default: 'cash' },
  reference: String,
  description: { type: String, default: '' },
  voucherNo: { type: String, required: true, unique: true, sparse: true, index: true },
  attachmentUrl: String,
  createdBy: { type: String, default: 'SYSTEM' },
}, { timestamps: true });

TransactionSchema.index({ schoolId: 1, date: -1 });
TransactionSchema.index({ schoolId: 1, type: 1, category: 1 });

const Transaction: Model<ITransactionDocument> = (mongoose.models.Transaction as Model<ITransactionDocument>) || 
  mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

export default Transaction;
