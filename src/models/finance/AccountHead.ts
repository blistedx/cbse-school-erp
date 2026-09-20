import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountHead extends Document {
  schoolId: string;
  name: string;              // "Student Tuition Fees", "Teacher Salaries", "Lab Chemicals"
  code: string;              // "ACC-INC-01", "ACC-EXP-02"
  type: 'income' | 'expense' | 'asset' | 'liability';
  parentHeadId?: string;
  description?: string;
  openingBalance?: number;
  currentBalance?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AccountHeadSchema = new Schema<IAccountHead>({
  schoolId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['income', 'expense', 'asset', 'liability'], 
    required: true 
  },
  parentHeadId: String,
  description: String,
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AccountHeadSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export default mongoose.models.AccountHead || 
  mongoose.model<IAccountHead>('AccountHead', AccountHeadSchema);
