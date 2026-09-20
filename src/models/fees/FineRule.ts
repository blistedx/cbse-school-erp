import mongoose, { Schema, Document } from 'mongoose';

export interface IFineRule extends Document {
  schoolId: string;
  academicSession: string;
  name: string;              // "Late Fee Penalty"
  dueDayOfMonth: number;     // e.g. 10 (due on 10th of the month)
  gracePeriodDays: number;   // e.g. 5 days grace period
  fineType: 'flat' | 'daily' | 'percentage';
  fineAmount: number;        // e.g. ₹50/day or ₹200 flat
  maxFineCap?: number;       // e.g. ₹1000 max fine
  applicableHeads: string[]; // ["TUI", "ALL"]
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FineRuleSchema = new Schema<IFineRule>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dueDayOfMonth: { type: Number, default: 10 },
  gracePeriodDays: { type: Number, default: 5 },
  fineType: { 
    type: String, 
    enum: ['flat', 'daily', 'percentage'], 
    default: 'flat' 
  },
  fineAmount: { type: Number, required: true, default: 100 },
  maxFineCap: { type: Number, default: 1000 },
  applicableHeads: { type: [String], default: ['TUI'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FineRuleSchema.index({ schoolId: 1, academicSession: 1 });

export default mongoose.models.FineRule || 
  mongoose.model<IFineRule>('FineRule', FineRuleSchema);
