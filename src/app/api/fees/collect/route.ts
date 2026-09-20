import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongoose';
import FeePayment from '@/models/fees/FeePayment';
import StudentFee from '@/models/fees/StudentFee';
import { generateReceiptNo } from '@/lib/fees/receiptGenerator';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getSessionUser } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { validateRequest, CollectFeeSchema } from '@/lib/fees/validations';

export async function POST(req: NextRequest) {
  let session: mongoose.ClientSession | null = null;

  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const sessionUser = getSessionUser(req);
    const body = await req.json();

    const tenantResult = resolveTenantSchoolId(auth, body.schoolId || searchParamsSchoolId(req));
    const schoolId = typeof tenantResult === 'string' ? tenantResult : (sessionUser?.schoolId || auth.schoolId);
    const collectedBy = body.collectedBy || sessionUser?.userId || auth.userId || 'Accounts Cashier';
    const academicSession = body.academicSession || '2026-2027';

    const validation = validateRequest(CollectFeeSchema, {
      ...body,
      schoolId,
      collectedBy,
      academicSession
    });

    if (!validation.success) {
      return validation.response;
    }

    const validatedData = validation.data;
    const {
      studentId,
      studentName,
      admissionNo,
      className,
      section,
      monthsCovered,
      breakdown = [],
      paymentMode = 'cash',
      transactionRef = '',
      remarks = '',
    } = validatedData;
    const lateFine = body.lateFine || 0;

    await connectDB();

    // 1. Calculate Subtotal, Concession, Fine, and Net Total Amount
    let calculatedSubtotal = 0;
    let calculatedConcession = 0;
    let calculatedFine = Number(lateFine) || 0;

    const sanitizedBreakdown = breakdown.map((item: any) => {
      const baseAmt = Number(item.amount || item.base_amount || 0);
      const fineAmt = Number(item.fine || item.fine_amount || 0);
      const concAmt = Number(item.concession || item.concession_amount || 0);
      const netAmt = Math.max(0, baseAmt + fineAmt - concAmt);

      calculatedSubtotal += baseAmt;
      calculatedFine += fineAmt;
      calculatedConcession += concAmt;

      return {
        feeHeadId: item.feeHeadId || item.head_id || 'head-misc',
        headName: item.headName || item.head_name || 'Fee Particular',
        amount: baseAmt,
        fine: fineAmt,
        concession: concAmt,
        netAmount: netAmt
      };
    });

    const totalPaidAmount = Math.max(0, calculatedSubtotal + calculatedFine - calculatedConcession);

    // 2. Generate Unique Sequential Receipt Number
    const receiptNo = body.receiptNo || await generateReceiptNo(schoolId);

    // 3. Execute with Mongoose Transaction (with Standalone Fallback)
    let paymentDoc: any = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch {
      session = null;
      useTransaction = false;
    }

    const sessionOpts = session ? { session } : {};

    try {
      // 3.1 Create Payment Record
      const paymentPayload = {
        schoolId,
        academicSession,
        studentId,
        studentName: studentName || 'Student',
        admissionNo: admissionNo || '',
        className: className || '',
        section: section || 'A',
        receiptNo,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        monthsCovered: Array.isArray(monthsCovered) ? monthsCovered : ['APR'],
        amount: totalPaidAmount,
        subtotal: calculatedSubtotal,
        totalConcession: calculatedConcession,
        lateFine: calculatedFine,
        paymentMode: (paymentMode || 'cash').toLowerCase() as any,
        transactionRef,
        breakdown: sanitizedBreakdown,
        collectedBy,
        remarks,
        status: 'success' as const
      };

      if (session) {
        const createdArray = await FeePayment.create([paymentPayload], sessionOpts);
        paymentDoc = createdArray[0];
      } else {
        paymentDoc = await FeePayment.create(paymentPayload);
      }

      // 3.2 Update Student Fee Ledger
      for (const item of sanitizedBreakdown) {
        await StudentFee.findOneAndUpdate(
          { schoolId, studentId, 'allocations.feeHeadId': item.feeHeadId },
          {
            $inc: {
              'allocations.$.paidAmount': item.netAmount,
              'allocations.$.dueAmount': -item.netAmount,
              totalPaid: item.netAmount,
              totalDue: -item.netAmount
            },
            $set: {
              lastPaymentDate: new Date(),
              updatedAt: new Date()
            }
          },
          sessionOpts
        );
      }

      // 3.3 Also record in Institutional Finance Inflow Daybook
      const db = await getDatabase();
      if (db) {
        await db.collection('finance_entries').insertOne({
          school_id: schoolId,
          academic_session: academicSession,
          voucher_no: receiptNo,
          entry_type: 'INCOME',
          category: 'FEE_COLLECTION',
          account_name: 'Cash Counter',
          date: new Date().toISOString().split('T')[0],
          amount: totalPaidAmount,
          payment_mode: (paymentMode || 'CASH').toUpperCase(),
          reference_no: transactionRef || receiptNo,
          payer_payee: studentName || admissionNo || 'Student',
          description: `Fee collection for ${studentName || admissionNo} (${(monthsCovered || ['APR']).join(', ')})`,
          created_by: collectedBy,
          created_at: new Date().toISOString()
        });
      }

      if (session && useTransaction) {
        await session.commitTransaction();
      }
    } catch (txErr: any) {
      if (session && useTransaction) {
        await session.abortTransaction();
      }
      throw txErr;
    }

    return NextResponse.json({
      success: true,
      message: 'Fee collected and receipt generated successfully',
      data: paymentDoc,
      receiptNo,
      receiptUrl: `/api/fees/receipt/${paymentDoc._id || paymentDoc.id || receiptNo}`
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API Fee Collect Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process fee collection' 
    }, { status: 500 });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

function searchParamsSchoolId(req: NextRequest): string | null {
  try {
    const { searchParams } = new URL(req.url);
    return searchParams.get('school_id') || searchParams.get('schoolId');
  } catch {
    return null;
  }
}
