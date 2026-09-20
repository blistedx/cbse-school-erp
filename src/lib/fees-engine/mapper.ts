/*! EduSuite Fee Master — Student Fee Ledger Auto-Mapper v3.0.0 */

import { Student } from '../types';
import { getDatabase } from '../mongodb';
import {
  FeeLedgerLine,
  FeeConfig,
  AcademicMonth,
} from './types';
import {
  ACADEMIC_MONTHS,
  getDefaultDueDate,
} from './constants';
import {
  getFeeConfig,
  getTuitionRateForClass,
  getAnnualFeeForClass,
  getTransportSlabRate,
  getHostelRate,
  calculateSiblingDiscount,
  getDepositSchedule,
} from './config';
import { postLedgerLines, getStudentLedger } from './ledger';

export interface SiblingInfo {
  familyKey: string;
  childOrder: number;
  siblingCount: number;
}

export function detectFamilyGrouping(students: Student[]): Map<string, SiblingInfo> {
  const familyMap = new Map<string, Student[]>();

  for (const s of students) {
    if (s.status !== 'ACTIVE') continue;
    const father = (s.father_name || '').trim().toLowerCase().replace(/^(mr|dr|shri|adv)\.?\s+/i, '');
    const mobile = (s.emergency_contact_phone || s.phone || s.guardian_phone || s.emergency_contact || s.mobile || '').replace(/[^0-9]/g, '').slice(-10);
    const familyId = s.family_id || '';

    let key = '';
    if (familyId) {
      key = `fam:${familyId}`;
    } else if (father && mobile && mobile.length >= 10) {
      key = `fm:${father}:${mobile}`;
    } else if (mobile && mobile.length >= 10) {
      key = `mob:${mobile}`;
    }

    if (key) {
      if (!familyMap.has(key)) familyMap.set(key, []);
      familyMap.get(key)!.push(s);
    }
  }

  const result = new Map<string, SiblingInfo>();

  for (const [key, members] of familyMap.entries()) {
    if (members.length < 2) continue; // Not a multi-child sibling group

    // Sort chronologically by class weight / age: elder child = order 1, younger = order 2, 3, etc.
    const sorted = [...members].sort((a, b) => {
      const getAgeOrClass = (st: Student) => {
        if (st.dob) {
          const t = new Date(st.dob).getTime();
          if (!isNaN(t)) return t;
        }
        const num = parseInt((st.class_name || '').replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 0 : -num; // Higher class = born earlier
      };
      return getAgeOrClass(a) - getAgeOrClass(b);
    });

    sorted.forEach((st, idx) => {
      result.set(st.id, {
        familyKey: key,
        childOrder: idx + 1,
        siblingCount: members.length,
      });
    });
  }

  return result;
}

export async function mapStudentFees(
  schoolId: string,
  student: Student,
  session: string = '2026-27',
  options: {
    config?: FeeConfig;
    siblingInfo?: SiblingInfo;
    actorId?: string;
  } = {}
): Promise<{ createdCount: number; skippedCount: number; lines: FeeLedgerLine[] }> {
  if (student.status !== 'ACTIVE') {
    return { createdCount: 0, skippedCount: 0, lines: [] };
  }

  const config = options.config || (await getFeeConfig(schoolId, session));
  const sessionStartYear = parseInt(session.split('-')[0], 10) || 2026;

  // Retrieve existing lines for student to ensure 100% idempotency
  const existingLines = await getStudentLedger(schoolId, student.id, session, false);
  const existingDemands = new Set<string>();
  const existingDiscounts = new Set<string>();

  for (const line of existingLines) {
    if (line.line_type === 'DEMAND' || line.line_type === 'OPENING_BALANCE') {
      existingDemands.add(`${line.fee_head}:${line.month || 'NONE'}:${line.slot_id || 'NONE'}`);
    } else if (line.line_type === 'DISCOUNT') {
      existingDiscounts.add(`${line.concession_type || 'DISC'}:${line.fee_head}:${line.month || 'NONE'}`);
    }
  }

  const linesToPost: Partial<FeeLedgerLine>[] = [];
  let skippedCount = 0;

  const isRte = student.is_rte === 'YES';
  const isStaffWard = student.concession_category === 'STAFF_WARD';
  const isSingleGirl = student.single_girl_child === 'YES' || student.concession_category === 'SINGLE_GIRL_CHILD';
  const isNewAdmission = student.is_new_admission === 'YES' || student.admission_type === 'NEW' || !student.previous_school;

  const tuitionRate = getTuitionRateForClass(config, student.class_name);
  const annualFeeRate = getAnnualFeeForClass(config, student.class_name);
  const hasTransport = (student.transport_opted || '').toUpperCase() === 'YES';
  const transportRate = hasTransport ? getTransportSlabRate(config, student.transport_slab_id || '1') : 0;
  const hasHostel = student.hostel_opted && student.hostel_opted !== 'NO';
  const hostelRate = hasHostel ? getHostelRate(config, student.hostel_opted === 'WITH_AC' ? 'WITH_AC' : 'WITHOUT_AC') : { monthly: 0, security: 0 };

  const siblingInfo = options.siblingInfo || { childOrder: 1, siblingCount: 1, familyKey: '' };
  const childOrder = siblingInfo.childOrder;

  // 1. One-time Registration & Admission Fees for New Admissions
  if (isNewAdmission) {
    const regKey = `REGISTRATION:NONE:NONE`;
    if (!existingDemands.has(regKey) && config.one_time_charges.prospectus_registration_paise > 0) {
      linesToPost.push({
        student_id: student.id,
        class_name: student.class_name,
        section: student.section || 'A',
        admission_no: student.admission_no || '',
        academic_session: session,
        line_type: 'DEMAND',
        fee_head: 'REGISTRATION',
        month: null,
        slot_id: 'ONE_TIME',
        amount: config.one_time_charges.prospectus_registration_paise,
        txn_date: `${sessionStartYear}-04-01`,
        due_date: `${sessionStartYear}-04-15`,
        remarks: 'One-time Prospectus + Registration Fee (Non-refundable)',
      });
    } else {
      skippedCount++;
    }

    const admKey = `ADMISSION:NONE:NONE`;
    if (!existingDemands.has(admKey) && config.one_time_charges.admission_fee_paise > 0) {
      linesToPost.push({
        student_id: student.id,
        class_name: student.class_name,
        section: student.section || 'A',
        admission_no: student.admission_no || '',
        academic_session: session,
        line_type: 'DEMAND',
        fee_head: 'ADMISSION',
        month: null,
        slot_id: 'ONE_TIME',
        amount: isRte ? 0 : config.one_time_charges.admission_fee_paise,
        txn_date: `${sessionStartYear}-04-01`,
        due_date: `${sessionStartYear}-04-15`,
        remarks: 'One-time Admission Fee',
      });
    } else {
      skippedCount++;
    }
  }

  // 2. Annual Composite Fee (April Due)
  const annualKey = `ANNUAL:APR:SLOT_1_APR`;
  if (!existingDemands.has(annualKey) && annualFeeRate > 0) {
    linesToPost.push({
      student_id: student.id,
      class_name: student.class_name,
      section: student.section || 'A',
      admission_no: student.admission_no || '',
      academic_session: session,
      line_type: 'DEMAND',
      fee_head: 'ANNUAL',
      month: 'APR',
      slot_id: 'SLOT_1_APR',
      amount: isRte ? 0 : annualFeeRate,
      txn_date: getDefaultDueDate('APR', sessionStartYear),
      due_date: getDefaultDueDate('APR', sessionStartYear),
      remarks: 'Annual Composite Fee (Session 2026-27)',
    });
  } else {
    skippedCount++;
  }

  // 3. Hostel Security Deposit (if opted)
  if (hasHostel && hostelRate.security > 0) {
    const secKey = `SECURITY_DEPOSIT:NONE:NONE`;
    if (!existingDemands.has(secKey)) {
      linesToPost.push({
        student_id: student.id,
        class_name: student.class_name,
        section: student.section || 'A',
        admission_no: student.admission_no || '',
        academic_session: session,
        line_type: 'DEMAND',
        fee_head: 'SECURITY_DEPOSIT',
        month: null,
        slot_id: 'ONE_TIME',
        amount: hostelRate.security,
        txn_date: `${sessionStartYear}-04-01`,
        due_date: `${sessionStartYear}-04-15`,
        remarks: 'Hostel Security Caution Money (Refundable)',
      });
    }
  }

  // 4. Monthly / Installment Deposit Schedule mapping for 12 Academic Months
  const depositSchedule = getDepositSchedule(config);

  for (const slot of depositSchedule) {
    for (const month of slot.months) {
      const dueDate = getDefaultDueDate(month, sessionStartYear);

      // A. Tuition Fee Demand
      const tuitionKey = `TUITION:${month}:${slot.slot_id}`;
      if (!existingDemands.has(tuitionKey)) {
        linesToPost.push({
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          academic_session: session,
          line_type: 'DEMAND',
          fee_head: 'TUITION',
          month,
          slot_id: slot.slot_id,
          amount: tuitionRate,
          txn_date: dueDate,
          due_date: dueDate,
        });
      } else {
        skippedCount++;
      }

      // B. Transport Fee Demand (if opted)
      if (hasTransport && transportRate > 0) {
        const transKey = `TRANSPORT:${month}:${slot.slot_id}`;
        if (!existingDemands.has(transKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DEMAND',
            fee_head: 'TRANSPORT',
            month,
            slot_id: slot.slot_id,
            amount: transportRate,
            txn_date: dueDate,
            due_date: dueDate,
          });
        } else {
          skippedCount++;
        }
      }

      // C. Hostel Monthly Fee Demand (if opted)
      if (hasHostel && hostelRate.monthly > 0) {
        const hostelKey = `HOSTEL:${month}:${slot.slot_id}`;
        if (!existingDemands.has(hostelKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DEMAND',
            fee_head: 'HOSTEL',
            month,
            slot_id: slot.slot_id,
            amount: hostelRate.monthly,
            txn_date: dueDate,
            due_date: dueDate,
          });
        } else {
          skippedCount++;
        }
      }

      // D. Exam Fee Demand (July Unit Test ₹500, Sept Half-Yearly ₹1000, Feb Annual ₹1000)
      if (month === 'JUL' || month === 'SEP' || month === 'FEB') {
        const examAmt = month === 'JUL' ? 50000 : 100000;
        const examKey = `EXAM:${month}:${slot.slot_id}`;
        if (!existingDemands.has(examKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DEMAND',
            fee_head: 'EXAM',
            month,
            slot_id: slot.slot_id,
            amount: examAmt,
            txn_date: dueDate,
            due_date: dueDate,
          });
        }
      }

      // ─── Auto-Apply Visible Discount Lines ───
      // Sibling Discount
      if (childOrder >= 2 && !isRte && !isStaffWard) {
        const sibDisc = calculateSiblingDiscount(config, childOrder, tuitionRate, transportRate);
        const discKey = `SIBLING:TUITION:${month}`;
        if (!existingDiscounts.has(discKey) && sibDisc.tuitionDiscountPaise > 0) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DISCOUNT',
            fee_head: 'TUITION',
            month,
            slot_id: slot.slot_id,
            concession_type: 'SIBLING',
            amount: sibDisc.tuitionDiscountPaise,
            txn_date: dueDate,
            remarks: `Sibling Concession (${sibDisc.discountPercent}% tuition off - Child #${childOrder})`,
          });
        }

        if (sibDisc.freeTransport && hasTransport && sibDisc.transportDiscountPaise > 0) {
          const transDiscKey = `SIBLING:TRANSPORT:${month}`;
          if (!existingDiscounts.has(transDiscKey)) {
            linesToPost.push({
              student_id: student.id,
              class_name: student.class_name,
              section: student.section || 'A',
              admission_no: student.admission_no || '',
              academic_session: session,
              line_type: 'DISCOUNT',
              fee_head: 'TRANSPORT',
              month,
              slot_id: slot.slot_id,
              concession_type: 'SIBLING',
              amount: sibDisc.transportDiscountPaise,
              txn_date: dueDate,
              remarks: `Sibling Free Transport (Child #${childOrder})`,
            });
          }
        }
      }

      // Staff Ward 100% Tuition Waiver
      if (isStaffWard && !isRte) {
        const staffKey = `STAFF_WARD:TUITION:${month}`;
        if (!existingDiscounts.has(staffKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DISCOUNT',
            fee_head: 'TUITION',
            month,
            slot_id: slot.slot_id,
            concession_type: 'STAFF_WARD',
            amount: tuitionRate,
            txn_date: dueDate,
            remarks: 'Staff Ward 100% Tuition Waiver',
          });
        }
      }

      // RTE 100% Waiver
      if (isRte) {
        const rteKey = `RTE:TUITION:${month}`;
        if (!existingDiscounts.has(rteKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'WAIVER',
            fee_head: 'TUITION',
            month,
            slot_id: slot.slot_id,
            concession_type: 'RTE',
            amount: tuitionRate,
            txn_date: dueDate,
            remarks: 'RTE 100% Mandate Fee Waiver',
          });
        }
      }

      // Single Girl Child Concession (50% Tuition)
      if (isSingleGirl && !isRte && !isStaffWard) {
        const sgcKey = `SINGLE_GIRL_CHILD:TUITION:${month}`;
        if (!existingDiscounts.has(sgcKey)) {
          linesToPost.push({
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            academic_session: session,
            line_type: 'DISCOUNT',
            fee_head: 'TUITION',
            month,
            slot_id: slot.slot_id,
            concession_type: 'SINGLE_GIRL_CHILD',
            amount: Math.round(tuitionRate * 0.5),
            txn_date: dueDate,
            remarks: 'Single Girl Child 50% Concession',
          });
        }
      }
    }
  }

  if (linesToPost.length === 0) {
    return { createdCount: 0, skippedCount, lines: [] };
  }

  const posted = await postLedgerLines(schoolId, linesToPost, options.actorId);
  return { createdCount: posted.length, skippedCount, lines: posted };
}

export async function bulkMapFees(
  schoolId: string,
  students: Student[],
  session: string = '2026-27',
  filter?: { classGroup?: string; studentId?: string },
  actorId?: string
): Promise<{
  totalStudents: number;
  mappedStudents: number;
  totalLinesCreated: number;
  totalLinesSkipped: number;
}> {
  const config = await getFeeConfig(schoolId, session);
  const siblingMap = detectFamilyGrouping(students);

  let targetStudents = students.filter(s => s.status === 'ACTIVE');
  if (filter?.studentId) {
    targetStudents = targetStudents.filter(s => s.id === filter.studentId);
  } else if (filter?.classGroup) {
    const norm = filter.classGroup.toUpperCase();
    targetStudents = targetStudents.filter(s => (s.class_name || '').toUpperCase().includes(norm));
  }

  let totalLinesCreated = 0;
  let totalLinesSkipped = 0;
  let mappedStudents = 0;

  for (const st of targetStudents) {
    const sib = siblingMap.get(st.id) || { childOrder: 1, siblingCount: 1, familyKey: '' };
    const res = await mapStudentFees(schoolId, st, session, {
      config,
      siblingInfo: sib,
      actorId,
    });

    if (res.createdCount > 0) {
      mappedStudents++;
      totalLinesCreated += res.createdCount;
    }
    totalLinesSkipped += res.skippedCount;
  }

  return {
    totalStudents: targetStudents.length,
    mappedStudents,
    totalLinesCreated,
    totalLinesSkipped,
  };
}
