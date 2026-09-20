import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudentFeeAllocation {
  feeHeadId: string;
  headName: string;
  headCode?: string;
  baseAmount: number;
  concessionAmount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface IStudentFeeMonthStatus {
  month: string;             // "APR", "MAY", ...
  year: number;
  dueDate: Date;
  monthlyAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'due' | 'waived';
  receiptNo?: string;
}

export interface IStudentFee {
  schoolId: string;
  academicSession: string;   // "2026-2027"
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  rollNo?: string;
  transportOpted: boolean;
  transportSlab?: string;
  hostelOpted: boolean;
  allocations: IStudentFeeAllocation[];
  monthSchedules: IStudentFeeMonthStatus[];
  totalAnnualFee: number;
  totalConcession: number;
  totalFine: number;
  totalPaid: number;
  totalDue: number;
  status: 'paid' | 'partial' | 'due' | 'waived';
  lastPaymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudentFeeDocument extends IStudentFee, Document {}

const StudentFeeSchema = new Schema<IStudentFeeDocument>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  admissionNo: { type: String, required: true, index: true },
  className: { type: String, required: true },
  section: { type: String, default: 'A' },
  rollNo: String,
  transportOpted: { type: Boolean, default: false },
  transportSlab: String,
  hostelOpted: { type: Boolean, default: false },
  allocations: [{
    feeHeadId: String,
    headName: String,
    headCode: String,
    baseAmount: Number,
    concessionAmount: { type: Number, default: 0 },
    fineAmount: { type: Number, default: 0 },
    netAmount: Number,
    paidAmount: { type: Number, default: 0 },
    dueAmount: Number
  }],
  monthSchedules: [{
    month: String,
    year: Number,
    dueDate: Date,
    monthlyAmount: Number,
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['paid', 'partial', 'due', 'waived'], default: 'due' },
    receiptNo: String
  }],
  totalAnnualFee: { type: Number, required: true, default: 0 },
  totalConcession: { type: Number, default: 0 },
  totalFine: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalDue: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    enum: ['paid', 'partial', 'due', 'waived'], 
    default: 'due' 
  },
  lastPaymentDate: Date,
}, { timestamps: true });

StudentFeeSchema.index({ schoolId: 1, academicSession: 1, studentId: 1 }, { unique: true });
StudentFeeSchema.index({ schoolId: 1, className: 1, status: 1 });

const StudentFee: Model<IStudentFeeDocument> = (mongoose.models.StudentFee as Model<IStudentFeeDocument>) || 
  mongoose.model<IStudentFeeDocument>('StudentFee', StudentFeeSchema);

export default StudentFee;
