/*! EduSuite Fee Master — Core Ledger Engine v3.0.0 */

import { getDatabase, sanitizeDocNoBinary } from '../mongodb';
import {
  FeeLedgerLine,
  FeeLineType,
  FeeHead,
  AcademicMonth,
  LedgerFeeSummary,
  StudentLedgerViewItem,
  FeeAggregateFilters,
  FeeAggregateRow,
  GroupByDimension,
  NON_REFUNDABLE_HEADS,
} from './types';
import { ACADEMIC_MONTHS, MONTH_INDEX, MONTH_FULL_NAMES, paiseToRupees } from './constants';

const COLLECTION = 'fee_ledger';

let lineCounter = 0;
export function generateLineId(): string {
  lineCounter++;
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FLL-${ts}-${rand}-${lineCounter}`;
}

export function generateReceiptNo(schoolId: string): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const prefix = (schoolId || 'SCH').replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `${prefix}-REC-${ts.toString().slice(-6)}-${rand}`;
}

let indexesEnsured = false;
export async function ensureLedgerIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION);
    await Promise.all([
      col.createIndex({ school_id: 1, academic_session: 1, is_cancelled: 1 }),
      col.createIndex({ school_id: 1, student_id: 1, academic_session: 1, is_cancelled: 1 }),
      col.createIndex({ school_id: 1, academic_session: 1, line_type: 1 }),
      col.createIndex({ school_id: 1, academic_session: 1, fee_head: 1, month: 1 }),
      col.createIndex({ school_id: 1, txn_date: 1 }),
      col.createIndex({ school_id: 1, receipt_no: 1 }, { sparse: true }),
    ]);
    indexesEnsured = true;
  } catch (e) {
    console.error('[fees-engine/ledger] Error ensuring indexes:', e);
  }
}

export async function postLedgerLines(
  schoolId: string,
  lines: Partial<FeeLedgerLine>[],
  actorId?: string
): Promise<FeeLedgerLine[]> {
  if (!lines || lines.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];

  const prepared: FeeLedgerLine[] = lines.map((raw, idx) => {
    if (!raw.line_type) throw new Error(`Line ${idx}: line_type is required`);
    if (!raw.fee_head) throw new Error(`Line ${idx}: fee_head is required`);
    if (typeof raw.amount !== 'number' || raw.amount < 0) {
      throw new Error(`Line ${idx}: amount must be a non-negative number (paise)`);
    }
    if (!raw.student_id) throw new Error(`Line ${idx}: student_id is required`);

    if (raw.line_type === 'REFUND' && NON_REFUNDABLE_HEADS.includes(raw.fee_head)) {
      throw new Error(
        `Refunds are strictly prohibited for non-refundable fee head "${raw.fee_head}". Prospectus, registration, admission, annual, and miscellaneous charges cannot be refunded.`
      );
    }

    const line: FeeLedgerLine = {
      id: raw.id || generateLineId(),
      school_id: schoolId,
      academic_session: raw.academic_session || '2026-27',
      student_id: raw.student_id,
      class_name: raw.class_name || '',
      section: raw.section || 'A',
      admission_no: raw.admission_no || '',
      line_type: raw.line_type,
      fee_head: raw.fee_head,
      month: raw.month || null,
      slot_id: raw.slot_id || null,
      amount: Math.round(raw.amount),
      adjustment_direction: raw.line_type === 'ADJUSTMENT' ? (raw.adjustment_direction || 'DEBIT') : undefined,
      txn_date: raw.txn_date || todayDate,
      due_date: raw.due_date || null,
      payment_mode: raw.payment_mode || null,
      receipt_no: raw.receipt_no || (raw.line_type === 'PAYMENT' ? generateReceiptNo(schoolId) : null),
      cheque_no: raw.cheque_no || null,
      txn_ref: raw.txn_ref || null,
      concession_type: raw.concession_type || null,
      collected_by: raw.collected_by || actorId || null,
      approved_by: raw.approved_by || null,
      is_cancelled: false,
      cancelled_reason: null,
      cancelled_by: null,
      cancelled_at: null,
      linked_line_id: raw.linked_line_id || null,
      remarks: raw.remarks || null,
      created_at: now,
    };

    return line;
  });

  await ensureLedgerIndexes();
  try {
    const db = await getDatabase();
    if (db) {
      await db.collection(COLLECTION).insertMany(
        prepared.map(l => sanitizeDocNoBinary({ ...l })),
        { ordered: true }
      );
    }
  } catch (e: any) {
    console.error('[fees-engine/ledger] Error posting lines:', e);
    throw new Error(`Failed to post ledger lines: ${e.message}`);
  }

  return prepared;
}

export async function cancelLedgerLine(
  schoolId: string,
  lineId: string,
  reason: string,
  cancelledBy: string
): Promise<FeeLedgerLine | null> {
  await ensureLedgerIndexes();
  const db = await getDatabase();
  if (!db) return null;

  const original = (await db.collection(COLLECTION).findOne({
    id: lineId,
    school_id: schoolId,
  })) as unknown as FeeLedgerLine | null;

  if (!original) return null;
  if (original.is_cancelled) {
    throw new Error('Line is already cancelled');
  }

  const now = new Date().toISOString();

  await db.collection(COLLECTION).updateOne(
    { id: lineId, school_id: schoolId },
    {
      $set: {
        is_cancelled: true,
        cancelled_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: now,
      },
    }
  );

  return {
    ...original,
    is_cancelled: true,
    cancelled_reason: reason,
    cancelled_by: cancelledBy,
    cancelled_at: now,
  };
}

export async function getStudentLedger(
  schoolId: string,
  studentId: string,
  session: string = '2026-27',
  includeCancelled: boolean = false
): Promise<FeeLedgerLine[]> {
  await ensureLedgerIndexes();
  try {
    const db = await getDatabase();
    if (db) {
      const filter: any = {
        school_id: schoolId,
        student_id: studentId,
        academic_session: session,
      };
      if (!includeCancelled) {
        filter.is_cancelled = { $ne: true };
      }
      const docs = await db.collection(COLLECTION)
        .find(filter)
        .sort({ txn_date: 1, created_at: 1 })
        .toArray();
      return docs as unknown as FeeLedgerLine[];
    }
  } catch (e) {
    console.error('[fees-engine/ledger] Error fetching student ledger:', e);
  }
  return [];
}

export async function getSchoolLedgerLines(
  schoolId: string,
  session: string = '2026-27',
  additionalFilter: Record<string, any> = {},
  projection?: Record<string, any>
): Promise<FeeLedgerLine[]> {
  await ensureLedgerIndexes();
  try {
    const db = await getDatabase();
    if (db) {
      const filter: any = {
        school_id: schoolId,
        academic_session: session,
        is_cancelled: { $ne: true },
        ...additionalFilter,
      };
      let cursor = db.collection(COLLECTION).find(filter);
      if (projection) {
        cursor = cursor.project(projection);
      }
      const docs = await cursor.toArray();
      return docs as unknown as FeeLedgerLine[];
    }
  } catch (e) {
    console.error('[fees-engine/ledger] Error fetching school ledger lines:', e);
  }
  return [];
}

export interface SchoolFeeOverviewAggregate {
  totalBilledPaise: number;
  totalCollectedPaise: number;
  totalPendingPaise: number;
  totalDiscountPaise: number;
  totalAdvancePaise: number;
  collectionPercentage: number;
  studentsWithNothingPaid: number;
  topPending: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    classSection: string;
    fatherName: string;
    mobile: string;
    pendingPaise: number;
  }>;
}

export async function getSchoolFeeOverviewAggregation(
  schoolId: string,
  session: string = '2026-27',
  studentsMap?: Map<string, any>
): Promise<SchoolFeeOverviewAggregate> {
  await ensureLedgerIndexes();
  const db = await getDatabase();
  if (!db) {
    return {
      totalBilledPaise: 0,
      totalCollectedPaise: 0,
      totalPendingPaise: 0,
      totalDiscountPaise: 0,
      totalAdvancePaise: 0,
      collectionPercentage: 0,
      studentsWithNothingPaid: 0,
      topPending: [],
    };
  }

  const pipeline = [
    {
      $match: {
        school_id: schoolId,
        academic_session: session,
        is_cancelled: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$student_id',
        studentId: { $first: '$student_id' },
        admissionNo: { $first: '$admission_no' },
        className: { $first: '$class_name' },
        section: { $first: '$section' },
        demand: {
          $sum: {
            $cond: [
              { $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE', 'FINE']] },
              '$amount',
              {
                $cond: [
                  { $and: [{ $eq: ['$line_type', 'ADJUSTMENT'] }, { $ne: ['$adjustment_direction', 'CREDIT'] }] },
                  '$amount',
                  0,
                ],
              },
            ],
          },
        },
        paid: {
          $sum: {
            $cond: [
              { $eq: ['$line_type', 'PAYMENT'] },
              '$amount',
              {
                $cond: [
                  { $and: [{ $eq: ['$line_type', 'ADJUSTMENT'] }, { $eq: ['$adjustment_direction', 'CREDIT'] }] },
                  '$amount',
                  0,
                ],
              },
            ],
          },
        },
        discount: {
          $sum: {
            $cond: [{ $in: ['$line_type', ['DISCOUNT', 'WAIVER']] }, '$amount', 0],
          },
        },
      },
    },
  ];

  const studentAggregates = await db.collection(COLLECTION).aggregate(pipeline).toArray();

  let totalBilled = 0;
  let totalCollected = 0;
  let totalDiscount = 0;
  let totalPending = 0;
  let totalAdvance = 0;
  let zeroPaidStudents = 0;
  const pendingList: Array<any> = [];

  for (const row of studentAggregates) {
    const demand = Number(row.demand) || 0;
    const paid = Number(row.paid) || 0;
    const discount = Number(row.discount) || 0;
    const bal = Math.max(0, demand - discount - paid);
    const adv = Math.max(0, paid + discount - demand);

    totalBilled += demand;
    totalCollected += paid;
    totalDiscount += discount;
    totalPending += bal;
    totalAdvance += adv;

    if (demand > 0 && paid === 0) {
      zeroPaidStudents++;
    }

    if (bal > 0) {
      const st = studentsMap?.get(row.studentId);
      const studentName = st ? (`${st.first_name || ''} ${st.last_name || ''}`.trim() || st.admission_no) : (row.studentId);
      const fatherName = st?.father_name || 'N/A';
      const mobile = st?.emergency_contact || st?.mobile || 'N/A';
      const classSection = st ? `${st.class_name} - ${st.section || 'A'}` : `${row.className || ''} - ${row.section || 'A'}`;

      pendingList.push({
        studentId: row.studentId,
        studentName,
        admissionNo: row.admissionNo || st?.admission_no || '',
        classSection,
        fatherName,
        mobile,
        pendingPaise: bal,
      });
    }
  }

  pendingList.sort((a, b) => b.pendingPaise - a.pendingPaise);

  const netDemand = Math.max(0, totalBilled - totalDiscount);
  const collectionPercentage = netDemand > 0 ? Math.round((totalCollected / netDemand) * 100) : 0;

  return {
    totalBilledPaise: totalBilled,
    totalCollectedPaise: totalCollected,
    totalPendingPaise: totalPending,
    totalDiscountPaise: totalDiscount,
    totalAdvancePaise: totalAdvance,
    collectionPercentage,
    studentsWithNothingPaid: zeroPaidStudents,
    topPending: pendingList.slice(0, 10),
  };
}

export function computeSummaryFromLines(lines: FeeLedgerLine[]): LedgerFeeSummary {
  let totalDemand = 0;
  let totalDiscount = 0;
  let totalWaiver = 0;
  let totalFine = 0;
  let totalPaid = 0;
  let totalRefund = 0;

  const headMap = new Map<FeeHead, { demand: number; paid: number; discount: number; waiver: number; balance: number }>();
  const monthMap = new Map<AcademicMonth, { demand: number; paid: number; discount: number; waiver: number; fine: number; balance: number }>();
  const slotMap = new Map<string, { demand: number; paid: number; discount: number; waiver: number; fine: number; balance: number }>();

  let earliestPendingDueDate: string | null = null;
  let monthsPendingCount = 0;

  for (const line of lines) {
    if (line.is_cancelled) continue;
    const amt = Math.round(line.amount);

    switch (line.line_type) {
      case 'DEMAND':
      case 'OPENING_BALANCE':
        totalDemand += amt;
        break;
      case 'PAYMENT':
        totalPaid += amt;
        break;
      case 'DISCOUNT':
        totalDiscount += amt;
        break;
      case 'WAIVER':
        totalWaiver += amt;
        break;
      case 'FINE':
        totalFine += amt;
        totalDemand += amt;
        break;
      case 'REFUND':
        totalRefund += amt;
        break;
      case 'ADJUSTMENT':
        if (line.adjustment_direction === 'CREDIT') {
          totalPaid += amt;
        } else {
          totalDemand += amt;
        }
        break;
    }

    const hk = line.fee_head;
    if (!headMap.has(hk)) headMap.set(hk, { demand: 0, paid: 0, discount: 0, waiver: 0, balance: 0 });
    const hw = headMap.get(hk)!;
    if (line.line_type === 'DEMAND' || line.line_type === 'FINE' || line.line_type === 'OPENING_BALANCE') hw.demand += amt;
    else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT') hw.demand += amt;
    else if (line.line_type === 'PAYMENT') hw.paid += amt;
    else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT') hw.paid += amt;
    else if (line.line_type === 'DISCOUNT') hw.discount += amt;
    else if (line.line_type === 'WAIVER') hw.waiver += amt;

    if (line.month) {
      const mk = line.month;
      if (!monthMap.has(mk)) monthMap.set(mk, { demand: 0, paid: 0, discount: 0, waiver: 0, fine: 0, balance: 0 });
      const mw = monthMap.get(mk)!;
      if (line.line_type === 'DEMAND' || line.line_type === 'OPENING_BALANCE') mw.demand += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT') mw.demand += amt;
      else if (line.line_type === 'PAYMENT') mw.paid += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT') mw.paid += amt;
      else if (line.line_type === 'DISCOUNT') mw.discount += amt;
      else if (line.line_type === 'WAIVER') mw.waiver += amt;
      else if (line.line_type === 'FINE') { mw.fine += amt; mw.demand += amt; }
    }

    if (line.slot_id) {
      const sk = line.slot_id;
      if (!slotMap.has(sk)) slotMap.set(sk, { demand: 0, paid: 0, discount: 0, waiver: 0, fine: 0, balance: 0 });
      const sw = slotMap.get(sk)!;
      if (line.line_type === 'DEMAND' || line.line_type === 'OPENING_BALANCE') sw.demand += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction !== 'CREDIT') sw.demand += amt;
      else if (line.line_type === 'PAYMENT') sw.paid += amt;
      else if (line.line_type === 'ADJUSTMENT' && line.adjustment_direction === 'CREDIT') sw.paid += amt;
      else if (line.line_type === 'DISCOUNT') sw.discount += amt;
      else if (line.line_type === 'WAIVER') sw.waiver += amt;
      else if (line.line_type === 'FINE') { sw.fine += amt; sw.demand += amt; }
    }
  }

  const rawBalance = totalDemand - totalDiscount - totalWaiver - totalPaid + totalRefund;

  const headWise = Array.from(headMap.entries()).map(([fee_head, h]) => ({
    fee_head,
    demand: h.demand,
    paid: h.paid,
    discount: h.discount,
    waiver: h.waiver,
    balance: Math.max(0, h.demand - h.paid - h.discount - h.waiver),
  }));

  const now = new Date();
  const jsMonth = now.getMonth();
  const currentAcademicIndex = jsMonth >= 3 ? jsMonth - 3 : jsMonth + 9;

  const monthWise = ACADEMIC_MONTHS.map((month, idx) => {
    const mw = monthMap.get(month) || { demand: 0, paid: 0, discount: 0, waiver: 0, fine: 0, balance: 0 };
    const bal = mw.demand - mw.paid - mw.discount - mw.waiver;
    let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'UPCOMING' = 'UPCOMING';

    if (mw.demand === 0 && idx > currentAcademicIndex) {
      status = 'UPCOMING';
    } else if (bal <= 0 && mw.demand > 0) {
      status = 'PAID';
    } else if (mw.paid > 0 && bal > 0) {
      status = 'PARTIAL';
      if (idx <= currentAcademicIndex) monthsPendingCount++;
    } else if (idx <= currentAcademicIndex) {
      status = mw.demand > 0 ? (idx < currentAcademicIndex ? 'OVERDUE' : 'PENDING') : 'UPCOMING';
      if (mw.demand > 0) monthsPendingCount++;
    } else {
      status = 'UPCOMING';
    }

    return {
      month,
      demand: mw.demand,
      paid: mw.paid,
      discount: mw.discount,
      waiver: mw.waiver,
      fine: mw.fine,
      balance: Math.max(0, bal),
      status,
    };
  });

  let status: LedgerFeeSummary['status'] = 'PENDING';
  if (totalDemand === 0) {
    status = 'PENDING';
  } else if (rawBalance < 0) {
    status = 'ADVANCE';
  } else if (rawBalance === 0) {
    if (totalWaiver + totalDiscount >= totalDemand) status = 'WAIVED';
    else status = 'PAID';
  } else if (totalPaid > 0) {
    const hasOverdue = monthWise.some(m => m.status === 'OVERDUE');
    status = hasOverdue ? 'OVERDUE' : 'PARTIAL';
  } else {
    const hasOverdue = monthWise.some(m => m.status === 'OVERDUE');
    status = hasOverdue ? 'OVERDUE' : 'PENDING';
  }

  return {
    totalDemand,
    totalDiscount,
    totalWaiver,
    totalFine,
    totalPaid,
    totalRefund,
    balance: Math.max(0, rawBalance),
    status,
    nextDueDate: earliestPendingDueDate,
    monthsPendingCount,
    headWise,
    monthWise,
  };
}

export async function getStudentFeeSummary(
  schoolId: string,
  studentId: string,
  session: string = '2026-27'
): Promise<LedgerFeeSummary> {
  const lines = await getStudentLedger(schoolId, studentId, session, false);
  return computeSummaryFromLines(lines);
}

export function buildStudentLedgerView(lines: FeeLedgerLine[]): StudentLedgerViewItem[] {
  const groups = new Map<string, {
    key: string;
    fee_head: string;
    period: string;
    month: AcademicMonth | null;
    slot_id: string | null;
    gross_paise: number;
    discount_paise: number;
    paid_paise: number;
    due_date: string | null;
    lines: FeeLedgerLine[];
  }>();

  for (const line of lines) {
    if (line.is_cancelled) continue;
    const period = line.month ? MONTH_FULL_NAMES[line.month] : (line.slot_id ? line.slot_id.replace(/_/g, ' ') : 'Annual / One-Time');
    const groupKey = `${line.fee_head}_${line.month || line.slot_id || 'ANNUAL'}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        fee_head: line.fee_head,
        period,
        month: line.month,
        slot_id: line.slot_id || null,
        gross_paise: 0,
        discount_paise: 0,
        paid_paise: 0,
        due_date: line.due_date,
        lines: [],
      });
    }

    const item = groups.get(groupKey)!;
    item.lines.push(line);

    if (line.line_type === 'DEMAND' || line.line_type === 'FINE' || line.line_type === 'OPENING_BALANCE') {
      item.gross_paise += line.amount;
      if (line.due_date && !item.due_date) item.due_date = line.due_date;
    } else if (line.line_type === 'DISCOUNT' || line.line_type === 'WAIVER') {
      item.discount_paise += line.amount;
    } else if (line.line_type === 'PAYMENT') {
      item.paid_paise += line.amount;
    } else if (line.line_type === 'ADJUSTMENT') {
      if (line.adjustment_direction === 'CREDIT') {
        item.paid_paise += line.amount;
      } else {
        item.gross_paise += line.amount;
      }
    }
  }

  const sortedMonthWeight = (m: AcademicMonth | null) => (m ? MONTH_INDEX[m] : -1);

  return Array.from(groups.values())
    .map(g => {
      const net_paise = Math.max(0, g.gross_paise - g.discount_paise);
      const due_paise = Math.max(0, net_paise - g.paid_paise);

      let status: StudentLedgerViewItem['status'] = 'UPCOMING';
      if (g.gross_paise === 0 && g.paid_paise === 0) {
        status = 'UPCOMING';
      } else if (due_paise === 0 && (net_paise > 0 || g.paid_paise > 0)) {
        status = 'PAID';
      } else if (g.paid_paise > 0 && due_paise > 0) {
        status = 'PARTIAL';
      } else if (due_paise > 0) {
        const today = new Date().toISOString().split('T')[0];
        status = g.due_date && g.due_date < today ? 'OVERDUE' : 'PENDING';
      }

      return {
        id: g.key,
        fee_head: g.fee_head,
        period: g.period,
        month: g.month,
        slot_id: g.slot_id,
        gross_paise: g.gross_paise,
        discount_paise: g.discount_paise,
        net_paise,
        paid_paise: g.paid_paise,
        due_paise,
        status,
        due_date: g.due_date,
        lines: g.lines,
      };
    })
    .sort((a, b) => sortedMonthWeight(a.month) - sortedMonthWeight(b.month));
}

export async function getStudentLedgerView(
  schoolId: string,
  studentId: string,
  session: string = '2026-27'
): Promise<StudentLedgerViewItem[]> {
  const lines = await getStudentLedger(schoolId, studentId, session, false);
  return buildStudentLedgerView(lines);
}

export async function getFeeAggregate(
  schoolId: string,
  filters: FeeAggregateFilters,
  groupBy: GroupByDimension[]
): Promise<FeeAggregateRow[]> {
  await ensureLedgerIndexes();

  const match: any = {
    school_id: schoolId,
    academic_session: filters.session || '2026-27',
  };

  if (!filters.includeCancelled) {
    match.is_cancelled = { $ne: true };
  }
  if (filters.dateFrom || filters.dateTo) {
    match.txn_date = {};
    if (filters.dateFrom) match.txn_date.$gte = filters.dateFrom;
    if (filters.dateTo) match.txn_date.$lte = filters.dateTo;
  }
  if (filters.months && filters.months.length > 0) {
    match.month = { $in: filters.months };
  }
  if (filters.classes && filters.classes.length > 0) {
    match.class_name = { $in: filters.classes };
  }
  if (filters.sections && filters.sections.length > 0) {
    match.section = { $in: filters.sections };
  }
  if (filters.studentIds && filters.studentIds.length > 0) {
    match.student_id = { $in: filters.studentIds };
  }
  if (filters.feeHeads && filters.feeHeads.length > 0) {
    match.fee_head = { $in: filters.feeHeads };
  }
  if (filters.lineTypes && filters.lineTypes.length > 0) {
    match.line_type = { $in: filters.lineTypes };
  }
  if (filters.paymentModes && filters.paymentModes.length > 0) {
    match.payment_mode = { $in: filters.paymentModes };
  }
  if (filters.concessionTypes && filters.concessionTypes.length > 0) {
    match.concession_type = { $in: filters.concessionTypes };
  }
  if (filters.collectedBy && filters.collectedBy.length > 0) {
    match.collected_by = { $in: filters.collectedBy };
  }

  const groupId: Record<string, any> = {};
  for (const dim of groupBy) {
    switch (dim) {
      case 'month': groupId.month = '$month'; break;
      case 'class': groupId.class_name = '$class_name'; break;
      case 'section': groupId.section = '$section'; break;
      case 'fee_head': groupId.fee_head = '$fee_head'; break;
      case 'payment_mode': groupId.payment_mode = '$payment_mode'; break;
      case 'concession_type': groupId.concession_type = '$concession_type'; break;
      case 'collected_by': groupId.collected_by = '$collected_by'; break;
      case 'date': groupId.txn_date = '$txn_date'; break;
      case 'student': groupId.student_id = '$student_id'; break;
      case 'category': groupId.category = '$concession_type'; break;
      case 'receipt_no': groupId.receipt_no = '$receipt_no'; break;
      default: break;
    }
  }

  const groupIdExpr = Object.keys(groupId).length > 0 ? groupId : null;

  try {
    const db = await getDatabase();
    if (db) {
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: groupIdExpr,
            demand: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $in: ['$line_type', ['DEMAND', 'OPENING_BALANCE']] },
                      {
                        $and: [
                          { $eq: ['$line_type', 'ADJUSTMENT'] },
                          { $ne: ['$adjustment_direction', 'CREDIT'] }
                        ]
                      }
                    ]
                  },
                  '$amount',
                  0,
                ],
              },
            },
            fine: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'FINE'] }, '$amount', 0],
              },
            },
            discount: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'DISCOUNT'] }, '$amount', 0],
              },
            },
            waiver: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'WAIVER'] }, '$amount', 0],
              },
            },
            collected: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$line_type', 'PAYMENT'] },
                      {
                        $and: [
                          { $eq: ['$line_type', 'ADJUSTMENT'] },
                          { $eq: ['$adjustment_direction', 'CREDIT'] }
                        ]
                      }
                    ]
                  },
                  '$amount',
                  0,
                ],
              },
            },
            refund: {
              $sum: {
                $cond: [{ $eq: ['$line_type', 'REFUND'] }, '$amount', 0],
              },
            },
            studentCount: { $addToSet: '$student_id' },
          },
        },
        {
          $project: {
            _id: 0,
            dimensions: '$_id',
            demand: { $add: ['$demand', '$fine'] },
            discount: 1,
            waiver: 1,
            fine: 1,
            collected: 1,
            refund: 1,
            balance: {
              $subtract: [
                { $add: ['$demand', '$fine', '$refund'] },
                { $add: ['$collected', '$discount', '$waiver'] },
              ],
            },
            studentCount: { $size: '$studentCount' },
          },
        },
      ];

      if (filters.pendingOnly || (filters.minBalance !== undefined && filters.minBalance > 0)) {
        const minBal = filters.minBalance || 1;
        pipeline.push({
          $match: {
            balance: { $gte: minBal }
          }
        });
      }

      const results = await db.collection(COLLECTION).aggregate(pipeline).toArray();

      const mapped = results.map(r => {
        const demand = Math.round(r.demand || 0);
        const collected = Math.round(r.collected || 0);
        const discount = Math.round(r.discount || 0);
        const waiver = Math.round(r.waiver || 0);
        const fine = Math.round(r.fine || 0);
        const refund = Math.round(r.refund || 0);
        const rawBal = (demand + fine + refund) - (collected + discount + waiver);
        const balance = Math.max(0, Math.round(r.balance !== undefined ? r.balance : rawBal));

        return {
          dimensions: r.dimensions || {},
          demand,
          discount,
          waiver,
          fine,
          collected,
          refund,
          balance,
          studentCount: r.studentCount || 0,
        };
      });

      if (filters.pendingOnly) {
        return mapped.filter(r => r.balance > 0);
      }

      return mapped;
    }
  } catch (e) {
    console.error('[fees-engine/ledger] Aggregate error:', e);
  }

  return [];
}
