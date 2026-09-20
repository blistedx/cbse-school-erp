import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeStructureAllocation {
  feeHeadId: string;
  headName?: string;
  headCode?: string;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'term' | 'one-time';
  amount: number;
}

export interface IFeeStructure extends Document {
  schoolId: string;
  academicSession: string;   // e.g. "2026-2027"
  className: string;         // e.g. "PG", "Class I", "XI A", "XII B"
  stream?: string;           // "GENERAL", "SCIENCE", "COMMERCE", "ARTS"
  allocations: IFeeStructureAllocation[];
  totalMonthlyAmount: number;
  totalAnnualAmount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  className: { type: String, required: true, index: true },
  stream: { type: String, default: 'GENERAL' },
  allocations: [{
    feeHeadId: { type: String, required: true },
    headName: String,
    headCode: String,
    frequency: { type: String, default: 'monthly' },
    amount: { type: Number, required: true, default: 0 }
  }],
  totalMonthlyAmount: { type: Number, required: true, default: 0 },
  totalAnnualAmount: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FeeStructureSchema.index({ schoolId: 1, academicSession: 1, className: 1 }, { unique: true });

export default mongoose.models.FeeStructure || 
  mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
