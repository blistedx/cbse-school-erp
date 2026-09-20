/*! EduSuite Fee Master — Realistic Test Seed Generator (As of Sept 10) v3.0.0 */

import { Student } from '../types';
import { getDatabase } from '../mongodb';
import {
  PaymentMode,
  FeeLedgerLine,
} from './types';
import {
  ACADEMIC_MONTHS,
  paiseToRupees,
} from './constants';
import { bulkMapFees, detectFamilyGrouping } from './mapper';
import { getFeeConfig } from './config';
import { getStudentLedger, postLedgerLines, generateReceiptNo } from './ledger';
import { collectFeePayment } from './collection';

export async function seedRealisticFeeData(
  schoolId: string,
  students: Student[],
  session: string = '2026-27',
  actorId: string = 'ADMIN_SEED'
): Promise<{
  studentsCount: number;
  mappedCount: number;
  paymentsCount: number;
  totalCollectedRupees: number;
}> {
  // 1. Bulk map all students first
  const mapResult = await bulkMapFees(schoolId, students, session, undefined, actorId);

  const activeStudents = students.filter(s => s.status === 'ACTIVE');
  const paymentModes: PaymentMode[] = ['UPI', 'CASH', 'CHEQUE', 'ONLINE'];

  let paymentsCount = 0;
  let totalCollectedPaise = 0;

  const db = await getDatabase();

  for (let i = 0; i < activeStudents.length; i++) {
    const student = activeStudents[i];
    const hash = (student.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + i;

    // Determine student persona
    const persona = hash % 100;
    // 0-4 (5%): Never paid anything (Defaulter)
    // 5-14 (10%): Annual fee pending, paid 1-2 tuition months
    // 15-30 (16%): 1-3 months pending (paid up to May/June)
    // 31-35 (5%): Partial payments
    // 36-45 (10%): Advance payment (Full year paid with 1 month tuition discount)
    // 46-99 (54%): Normal paid up to August / September

    // Check if student already has payments
    const existingLedger = await getStudentLedger(schoolId, student.id, session, false);
    const hasExistingPayments = existingLedger.some(l => l.line_type === 'PAYMENT');
    if (hasExistingPayments) continue; // Skip to keep idempotent

    if (persona < 5) {
      // Never paid anything
      continue;
    }

    if (persona >= 36 && persona <= 45) {
      // Advance Payer: Pay full year demand
      const allDemands = existingLedger.filter(l => l.line_type === 'DEMAND');
      const allDiscounts = existingLedger.filter(l => l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER');
      const totalDemand = allDemands.reduce((sum, d) => sum + d.amount, 0);
      const totalDisc = allDiscounts.reduce((sum, d) => sum + d.amount, 0);
      const netDue = Math.max(0, totalDemand - totalDisc);

      if (netDue > 0) {
        const mode = paymentModes[hash % paymentModes.length];
        const res = await collectFeePayment({
          schoolId,
          student,
          session,
          amountPaise: netDue,
          paymentMode: mode,
          remarks: 'Annual full-year advance payment with discount',
          collectedBy: 'ACCOUNTS_OFFICE',
          isAdvanceYearly: true,
        });
        paymentsCount++;
        totalCollectedPaise += netDue;
      }
      continue;
    }

    // Determine target months to pay
    let targetMonths: string[] = ['APR', 'MAY', 'JUN', 'JUL', 'AUG'];
    if (persona >= 46) {
      targetMonths = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];
    } else if (persona >= 15 && persona <= 30) {
      targetMonths = ['APR', 'MAY', 'JUN'];
    } else if (persona >= 5 && persona < 15) {
      targetMonths = ['APR', 'MAY'];
    } else if (persona >= 31 && persona <= 35) {
      targetMonths = ['APR', 'MAY', 'JUN', 'JUL'];
    }

    // Filter demands for these months
    const eligibleDemands = existingLedger.filter(l => {
      if (l.line_type !== 'DEMAND') return false;
      if (persona >= 5 && persona < 15 && l.fee_head === 'ANNUAL') return false; // Skip annual fee for this group
      if (!l.month) return true; // One-time/annual
      return targetMonths.includes(l.month);
    });

    const demandsTotal = eligibleDemands.reduce((sum, d) => sum + d.amount, 0);
    const relatedDiscounts = existingLedger.filter(l =>
      (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') &&
      (!l.month || targetMonths.includes(l.month))
    );
    const discountsTotal = relatedDiscounts.reduce((sum, d) => sum + d.amount, 0);

    let payAmount = Math.max(0, demandsTotal - discountsTotal);
    if (persona >= 31 && persona <= 35) {
      payAmount = Math.round(payAmount * 0.7); // Partial payment
    }

    if (payAmount > 0) {
      const mode = paymentModes[hash % paymentModes.length];
      const receiptNo = generateReceiptNo(schoolId);
      const payDay = 5 + (hash % 20); // 5th to 25th of month
      const payDate = `2026-09-${String(Math.min(10, payDay)).padStart(2, '0')}`;

      // Post lines
      await collectFeePayment({
        schoolId,
        student,
        session,
        amountPaise: payAmount,
        paymentMode: mode,
        remarks: `Standard fee deposit up to September 10 (Session ${session})`,
        collectedBy: 'ACCOUNTS_OFFICE',
      });

      paymentsCount++;
      totalCollectedPaise += payAmount;
    }
  }

  return {
    studentsCount: activeStudents.length,
    mappedCount: mapResult.mappedStudents,
    paymentsCount,
    totalCollectedRupees: Math.round(paiseToRupees(totalCollectedPaise)),
  };
}
