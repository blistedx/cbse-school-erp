import { z } from 'zod';

export const feeCollectionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  breakdown: z.array(z.object({
    feeHeadId: z.string().min(1, 'Fee head ID is required'),
    amount: z.number().positive('Amount must be positive'),
    fine: z.number().min(0).default(0),
    concession: z.number().min(0).default(0),
  })).min(1, 'At least one fee head breakdown is required'),
  paymentMode: z.enum(['cash', 'online', 'cheque', 'upi', 'card']),
  remarks: z.string().optional(),
});

export type FeeCollectionInput = z.infer<typeof feeCollectionSchema>;
