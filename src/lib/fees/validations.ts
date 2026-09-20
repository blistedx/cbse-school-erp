import { z } from 'zod';
import { NextResponse } from 'next/server';

export type ValidationResult<T> =
  | { success: true; data: T; response?: never }
  | { success: false; response: NextResponse; data?: never };

/**
 * Zod validation helper that parses data and returns either validated data or a standardized 400 response.
 */
export function validateRequest<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    const message = result.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Validation Error: ${message}`, details: errorDetails },
        { status: 400 }
      )
    };
  }
  return { success: true, data: result.data };
}

// 1. FEE HEAD VALIDATION SCHEMA
export const FeeHeadSchema = z.object({
  name: z.string().min(1, 'Fee Head name is required').max(100),
  code: z.string().min(1, 'Fee Head code is required').max(50),
  type: z.enum(['recurring', 'one_time', 'optional', 'deposit', 'annual', 'term']).default('recurring'),
  frequency: z.enum(['monthly', 'quarterly', 'half_yearly', 'annually', 'one_time']).default('monthly'),
  isRefundable: z.boolean().default(false),
  defaultAmount: z.number().min(0, 'Default amount must be non-negative').default(0),
  accountHeadId: z.string().optional(),
  taxPercent: z.number().min(0).max(100).optional().default(0),
  isActive: z.boolean().default(true),
  schoolId: z.string().optional()
});

export type FeeHeadInput = z.infer<typeof FeeHeadSchema>;

// 2. FEE PAYMENT / POS COLLECTION SCHEMA
export const FeePaymentBreakdownItemSchema = z.object({
  feeHeadId: z.string().min(1, 'Fee head ID is required'),
  headName: z.string().optional(),
  amount: z.number().min(0, 'Amount must be >= 0'),
  fine: z.number().min(0, 'Fine must be >= 0').default(0),
  concession: z.number().min(0, 'Concession must be >= 0').default(0),
  netAmount: z.number().optional()
});

export const CollectFeeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().optional(),
  admissionNo: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
  schoolId: z.string().optional(),
  academicSession: z.string().optional().default('2026-2027'),
  monthsCovered: z.array(z.string()).optional(),
  breakdown: z.array(FeePaymentBreakdownItemSchema).min(1, 'At least one fee head breakdown is required'),
  paymentMode: z.enum(['cash', 'online', 'cheque', 'upi', 'card', 'bank_transfer']).default('cash'),
  transactionRef: z.string().optional(),
  chequeNo: z.string().optional(),
  bankName: z.string().optional(),
  remarks: z.string().optional(),
  collectedBy: z.string().default('CASHIER')
});

export type CollectFeeInput = z.infer<typeof CollectFeeSchema>;

// 3. FEE STRUCTURE SCHEMA
export const FeeStructureHeadItemSchema = z.object({
  feeHeadId: z.string().min(1, 'Fee head ID is required'),
  headName: z.string().optional(),
  amount: z.number().min(0, 'Amount must be >= 0'),
  frequency: z.enum(['monthly', 'quarterly', 'half_yearly', 'annually', 'one_time']).default('monthly'),
  optional: z.boolean().default(false)
});

export const FeeStructureSchema = z.object({
  schoolId: z.string().optional(),
  academicSession: z.string().default('2026-2027'),
  className: z.string().min(1, 'Class name is required'),
  heads: z.array(FeeStructureHeadItemSchema).min(1, 'At least one fee head structure is required'),
  totalAnnual: z.number().min(0).optional()
});

export type FeeStructureInput = z.infer<typeof FeeStructureSchema>;

// 4. CONCESSION SCHEMA
export const ConcessionSchema = z.object({
  schoolId: z.string().optional(),
  academicSession: z.string().default('2026-2027'),
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().optional(),
  admissionNo: z.string().optional(),
  className: z.string().optional(),
  feeHeadId: z.string().min(1, 'Fee head ID is required'),
  headName: z.string().optional(),
  type: z.enum(['percentage', 'flat']),
  value: z.number().min(0, 'Concession value must be non-negative'),
  category: z.enum(['SIBLING', 'STAFF_WARD', 'RTE', 'MERIT', 'SPORTS', 'NEED_BASED', 'OTHER']).default('OTHER'),
  reason: z.string().optional(),
  approvedBy: z.string().default('PRINCIPAL'),
  isActive: z.boolean().default(true)
});

export type ConcessionInput = z.infer<typeof ConcessionSchema>;

// 5. FINANCE TRANSACTION SCHEMA (INCOME / EXPENSE)
export const TransactionSchema = z.object({
  schoolId: z.string().optional(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.union([z.string(), z.date()]).optional(),
  paymentMode: z.enum(['cash', 'online', 'cheque', 'upi', 'card', 'bank_transfer']).default('cash'),
  reference: z.string().optional(),
  description: z.string().default(''),
  voucherNo: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  createdBy: z.string().default('SYSTEM')
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

// 6. REPORT QUERY PARAMETER SCHEMAS
export const DailyReportQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  schoolId: z.string().optional(),
  paymentMode: z.string().optional(),
  session: z.string().optional()
});

export const DefaultersQuerySchema = z.object({
  days: z.coerce.number().min(0).default(30),
  schoolId: z.string().optional(),
  className: z.string().optional(),
  session: z.string().optional()
});

export const PlReportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  schoolId: z.string().optional()
});
