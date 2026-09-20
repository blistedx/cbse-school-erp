import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  schoolId: string;
  academicSession: string;   // "2026-2027"
  voucherNo: string;         // e.g. "EXP-2026-0001"
  date: Date;
  accountHeadId: string;
  accountHeadName: string;
  category: 'SALARY' | 'ELECTRICITY' | 'MAINTENANCE' | 'LAB' | 'EVENT' | 'TRANSPORT_FUEL' | 'EXAM_EXPENSE' | 'OFFICE_SUPPLIES' | 'MISC_EXPENSE';
  amount: number;
  paymentMode: 'cash' | 'online' | 'cheque' | 'upi' | 'bank_transfer';
  paidTo: string;            // Vendor / Staff Name
  invoiceNo?: string;
  invoiceFileUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  enteredBy: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  voucherNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  accountHeadId: { type: String, required: true },
  accountHeadName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['SALARY', 'ELECTRICITY', 'MAINTENANCE', 'LAB', 'EVENT', 'TRANSPORT_FUEL', 'EXAM_EXPENSE', 'OFFICE_SUPPLIES', 'MISC_EXPENSE'],
    default: 'MISC_EXPENSE'
  },
  amount: { type: Number, required: true },
  paymentMode: { 
    type: String, 
    enum: ['cash', 'online', 'cheque', 'upi', 'bank_transfer'], 
    default: 'cash' 
  },
  paidTo: { type: String, required: true },
  invoiceNo: String,
  invoiceFileUrl: String,
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' 
  },
  approvedBy: String,
  enteredBy: { type: String, required: true },
  remarks: String,
}, { timestamps: true });

ExpenseSchema.index({ schoolId: 1, date: -1 });

export default mongoose.models.Expense || 
  mongoose.model<IExpense>('Expense', ExpenseSchema);
