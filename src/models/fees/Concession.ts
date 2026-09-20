import mongoose, { Schema, Document } from 'mongoose';

export interface IConcession extends Document {
  schoolId: string;
  academicSession: string;   // e.g. "2026-2027"
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  concessionType: 'sibling' | 'staff_ward' | 'merit' | 'rte' | 'special';
  discountMode: 'percentage' | 'flat';
  discountValue: number;     // e.g. 25 (for 25%) or 1000 (for ₹1000)
  applicableHeads: string[]; // ["ALL"] or ["TUI", "ADM", ...]
  reason?: string;
  approvedBy: string;
  validTill?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConcessionSchema = new Schema<IConcession>({
  schoolId: { type: String, required: true, index: true },
  academicSession: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  admissionNo: { type: String, required: true, index: true },
  className: { type: String, required: true },
  concessionType: { 
    type: String, 
    enum: ['sibling', 'staff_ward', 'merit', 'rte', 'special'], 
    default: 'sibling' 
  },
  discountMode: { 
    type: String, 
    enum: ['percentage', 'flat'], 
    default: 'percentage' 
  },
  discountValue: { type: Number, required: true, default: 0 },
  applicableHeads: { type: [String], default: ['ALL'] },
  reason: String,
  approvedBy: { type: String, required: true },
  validTill: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ConcessionSchema.index({ schoolId: 1, academicSession: 1, studentId: 1 });

export default mongoose.models.Concession || 
  mongoose.model<IConcession>('Concession', ConcessionSchema);
