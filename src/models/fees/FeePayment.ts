import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeePaymentBreakdown {
  feeHeadId: string;
  headName?: string;
  amount: number;
  fine: number;
  concession: number;
  netAmount?: number;
}

export interface IFeePayment {
  schoolId: string;
  academicSession?: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  section?: string;
  receiptNo: string;
  paymentDate: Date;
  monthsCovered?: string[];
  amount: number;
  subtotal?: number;
  totalConcession?: number;
  lateFine?: number;
  paymentMode: 'cash' | 'online' | 'cheque' | 'upi' | 'card';
  transactionRef?: string;
  chequeNo?: string;
  bankName?: string;
  breakdown: IFeePaymentBreakdown[];
  collectedBy: string;
  remarks?: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeePaymentDocument extends IFeePayment, Document {}

const FeePaymentSchema = new Schema<IFeePaymentDocument>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, default: '2026-2027', index: true },
  studentId: { type: String, required: true, index: true },
  studentName: String,
  admissionNo: String,
  className: String,
  section: String,
  receiptNo: { type: String, required: true, unique: true, index: true },
  paymentDate: { type: Date, default: Date.now },
  monthsCovered: [String],
  amount: { type: Number, required: true },
  subtotal: Number,
  totalConcession: { type: Number, default: 0 },
  lateFine: { type: Number, default: 0 },
  paymentMode: { 
    type: String, 
    enum: ['cash', 'online', 'cheque', 'upi', 'card'], 
    required: true 
  },
  transactionRef: String,
  chequeNo: String,
  bankName: String,
  breakdown: [{
    feeHeadId: String,
    headName: String,
    amount: Number,
    fine: { type: Number, default: 0 },
    concession: { type: Number, default: 0 },
    netAmount: Number
  }],
  collectedBy: { type: String, required: true },
  remarks: String,
  status: { 
    type: String, 
    enum: ['success', 'pending', 'failed', 'refunded'], 
    default: 'success' 
  },
}, { timestamps: true });

FeePaymentSchema.index({ schoolId: 1, paymentDate: -1 });
FeePaymentSchema.index({ schoolId: 1, receiptNo: 1 });

const FeePayment: Model<IFeePaymentDocument> = (mongoose.models.FeePayment as Model<IFeePaymentDocument>) || 
  mongoose.model<IFeePaymentDocument>('FeePayment', FeePaymentSchema);

export default FeePayment;
