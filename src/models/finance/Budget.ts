import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetQuarterAllocation {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  allocated: number;
  spent: number;
}

export interface IBudget extends Document {
  schoolId: string;
  academicSession: string;   // "2026-2027"
  fiscalYear: string;        // "FY 2026-27"
  accountHeadId: string;
  accountHeadName: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  quarterlyBreakdown: IBudgetQuarterAllocation[];
  notes?: string;
  status: 'draft' | 'approved' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

const BudgetSchema = new Schema<IBudget>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  fiscalYear: { type: String, required: true },
  accountHeadId: { type: String, required: true },
  accountHeadName: { type: String, required: true },
  category: { type: String, required: true },
  allocatedAmount: { type: Number, required: true, default: 0 },
  spentAmount: { type: Number, required: true, default: 0 },
  remainingAmount: { type: Number, required: true, default: 0 },
  quarterlyBreakdown: [{
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  }],
  notes: String,
  status: { type: String, enum: ['draft', 'approved', 'closed'], default: 'approved' },
}, { timestamps: true });

BudgetSchema.index({ schoolId: 1, academicSession: 1, accountHeadId: 1 }, { unique: true });

export default mongoose.models.Budget || 
  mongoose.model<IBudget>('Budget', BudgetSchema);
