import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeeHead {
  schoolId: string;
  name: string;              // "Tuition Fee"
  code: string;              // "TUI"
  type: 'recurring' | 'one-time';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'term';
  isRefundable: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeeHeadDocument extends IFeeHead, Document {}

const FeeHeadSchema = new Schema<IFeeHeadDocument>({
  schoolId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['recurring', 'one-time'], default: 'recurring' },
  frequency: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'yearly', 'term'], 
    default: 'monthly' 
  },
  isRefundable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FeeHeadSchema.index({ schoolId: 1, code: 1 }, { unique: true });

const FeeHead: Model<IFeeHeadDocument> = (mongoose.models.FeeHead as Model<IFeeHeadDocument>) || 
  mongoose.model<IFeeHeadDocument>('FeeHead', FeeHeadSchema);

export default FeeHead;
