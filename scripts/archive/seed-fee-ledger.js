/*! Giterp Fee Master — Production Realistic Seed Data Generator v2.0.0 */
/**
 * seed-fee-ledger.js
 *
 * Implements:
 * 1. School's ACTUAL fee structure (Part A):
 *    - Prospectus + Registration: ₹1,000 (one-time, non-refundable)
 *    - Admission Fee: ₹5,000 (one-time, non-refundable)
 *    - Annual Fee: ₹5,000 (PG-VIII) / ₹6,000 (IX-XII)
 *    - Tuition (monthly/quarterly): PG=₹1,000, I-II=₹1,400, III-V=₹1,600, VI-VIII=₹1,800, IX-X=₹2,000, XI-XII=₹2,400
 *    - Transport (by distance slab): 1-3km=₹800, 4-6km=₹900, 7-12km=₹1,100, 13-16km=₹1,300, 16-20km=₹1,800
 *    - Hostel: ₹6,000 (Non-AC), ₹7,833 (AC) + ₹10,000 Security Deposit
 *    - Sibling Rules: 2nd child=20% tuition off, 3rd child=30% tuition off, 4th child=30% tuition off + free transport
 * 2. New Fee Heads (Part B):
 *    - EXAM, LATE_FEE, LAB, FILE_MISC, TC, ANNUAL, PROSPECTUS, ADMISSION, SECURITY_DEPOSIT
 * 3. Realistic Seed Distribution (Part C):
 *    - ~70% Fully Paid (April-July)
 *    - ~15% Partially Paid
 *    - ~10% Overdue Defaulters
 *    - 2-3 Bounced Cheques per school
 *    - Late fee fines assessed
 *    - Lab & Misc charges
 *    - Idempotent execution
 *    - Full sync with students collection fee_status
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const COLLECTION = 'fee_ledger';
const SESSION = '2026-27';

// ─── Rate Lookup Functions (in Paise) ───

function getTuitionRatePaise(className) {
  const c = String(className || '').toUpperCase().trim();
  if (['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG', 'PRE-PRIMARY'].some(k => c.includes(k))) return 100000; // ₹1,000/mo
  if (['1', 'I', '2', 'II', 'CLASS 1', 'CLASS 2', 'CLASS I', 'CLASS II'].some(k => c.includes(k))) return 140000; // ₹1,400/mo
  if (['3', 'III', '4', 'IV', '5', 'V', 'CLASS 3', 'CLASS 4', 'CLASS 5'].some(k => c.includes(k))) return 160000; // ₹1,600/mo
  if (['6', 'VI', '7', 'VII', '8', 'VIII', 'CLASS 6', 'CLASS 7', 'CLASS 8'].some(k => c.includes(k))) return 180000; // ₹1,800/mo
  if (['9', 'IX', '10', 'X', 'CLASS 9', 'CLASS 10'].some(k => c.includes(k))) return 200000; // ₹2,000/mo
  if (['11', 'XI', '12', 'XII', 'CLASS 11', 'CLASS 12'].some(k => c.includes(k))) return 240000; // ₹2,400/mo
  return 160000;
}

function getAnnualFeePaise(className) {
  const c = String(className || '').toUpperCase().trim();
  if (['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII'].some(k => c.includes(k))) {
    return 600000; // ₹6,000/yr for Class IX-XII
  }
  return 500000; // ₹5,000/yr for PG-VIII
}

function getTransportRatePaise(slabId) {
  const s = String(slabId || '1');
  if (s === '1') return 80000;  // ₹800 (1-3 km)
  if (s === '2') return 90000;  // ₹900 (4-6 km)
  if (s === '3') return 110000; // ₹1,100 (7-12 km)
  if (s === '4') return 130000; // ₹1,300 (13-16 km)
  if (s === '5') return 180000; // ₹1,800 (16-20 km)
  return 90000;
}

function getHostelRatePaise(opted) {
  const o = String(opted || '').toUpperCase();
  if (o === 'WITH_AC') return 783300; // ₹7,833
  if (o === 'WITHOUT_AC' || o === 'YES') return 600000; // ₹6,000
  return 0;
}

// ─── ID Generators ───

let lineCounter = 0;
function makeLineId(prefix = 'FLL') {
  lineCounter++;
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${ts}-${rand}-${lineCounter}`;
}

const PAYMENT_MODES = ['UPI', 'CASH', 'UPI', 'ONLINE', 'CASH', 'UPI', 'CHEQUE', 'ONLINE'];
const CASHIERS = ['USR-ACC-01', 'USR-ACC-02', 'USR-CASH-COUNTER'];

async function seed() {
  console.log('⚡ Starting Production Realistic Fee Ledger Seeder for Session', SESSION, '...\n');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('edugit');
  const ledgerCol = db.collection(COLLECTION);
  const studentsCol = db.collection('students');
  const feeConfigCol = db.collection('fee_config');

  // Ensure indexes
  console.log('🔍 Ensuring fee_ledger compound indexes...');
  await Promise.all([
    ledgerCol.createIndex({ school_id: 1, academic_session: 1, student_id: 1 }),
    ledgerCol.createIndex({ school_id: 1, txn_date: 1 }),
    ledgerCol.createIndex({ school_id: 1, fee_head: 1, month: 1 }),
    ledgerCol.createIndex({ school_id: 1, receipt_no: 1 }, { sparse: true }),
    ledgerCol.createIndex({ school_id: 1, line_type: 1, is_cancelled: 1 }),
  ]);

  // Clean existing seed lines for session 2026-27 to make script strictly idempotent
  console.log('🧹 Purging existing session 2026-27 ledger data for clean seed...');
  await ledgerCol.deleteMany({ academic_session: SESSION });

  // Load all students
  const students = await studentsCol.find({}).toArray();
  console.log(`📋 Found ${students.length} students across all schools in database.`);

  // Group students by school
  const schoolStudents = new Map();
  for (const s of students) {
    const schoolId = s.school_id || 'DPS2026';
    if (!schoolStudents.has(schoolId)) schoolStudents.set(schoolId, []);
    schoolStudents.get(schoolId).push(s);
  }

  const schoolStats = [];

  for (const [schoolId, sList] of schoolStudents.entries()) {
    console.log(`\n🏫 Seeding school: ${schoolId} (${sList.length} students)...`);

    // Sibling detection mapping by father's phone or guardian phone
    const familyMap = new Map();
    for (const s of sList) {
      const phone = (s.father_phone || s.guardian_phone || s.mother_phone || '').trim().replace(/\D/g, '');
      const fatherName = (s.father_name || s.guardian_name || '').trim().toLowerCase();
      const familyKey = phone.length >= 10 ? phone : (fatherName ? `name:${fatherName}` : null);
      if (familyKey) {
        if (!familyMap.has(familyKey)) familyMap.set(familyKey, []);
        familyMap.get(familyKey).push(s);
      }
    }

    // Map student ID to sibling tier
    // 1st child: 0% discount
    // 2nd child: 20% tuition concession
    // 3rd child: 30% tuition concession
    // 4th child: 30% tuition concession + 100% free transport
    const siblingTierMap = new Map();
    for (const [key, famMembers] of familyMap.entries()) {
      if (famMembers.length > 1) {
        // Sort older to younger (admission date or admission_no)
        famMembers.sort((a, b) => (a.admission_no || a.id).localeCompare(b.admission_no || b.id));
        for (let i = 0; i < famMembers.length; i++) {
          const childOrder = i + 1;
          if (childOrder === 2) siblingTierMap.set(famMembers[i].id, { order: 2, tuitionDiscountPct: 20, freeTransport: false });
          else if (childOrder === 3) siblingTierMap.set(famMembers[i].id, { order: 3, tuitionDiscountPct: 30, freeTransport: false });
          else if (childOrder >= 4) siblingTierMap.set(famMembers[i].id, { order: 4, tuitionDiscountPct: 30, freeTransport: true });
        }
      }
    }
    console.log(`👨‍👩‍👧 Identified ${siblingTierMap.size} students eligible for sibling concession.`);

    let receiptSeq = 1000;
    const batchLines = [];
    let bouncedStudentsAssigned = 0;

    // Student status counters
    let countPaid = 0;
    let countPartial = 0;
    let countPending = 0;
    let countOverdue = 0;

    let totalDemandRaised = 0;
    let totalCollected = 0;
    let totalDiscount = 0;

    for (let sIdx = 0; sIdx < sList.length; sIdx++) {
      const student = sList[sIdx];
      const isRte = String(student.is_rte || '').toUpperCase() === 'YES';
      const siblingTier = siblingTierMap.get(student.id) || null;
      const isTransport = String(student.transport_opted || '').toUpperCase() === 'YES';
      const transportSlab = student.transport_slab_id || ((sIdx % 5) + 1).toString();
      const isHostel = student.hostel_opted && String(student.hostel_opted).toUpperCase() !== 'NO';
      const isNewAdmission = student.admission_no && (student.admission_no.includes('2026') || sIdx % 4 === 0);

      const tuitionMonthly = getTuitionRatePaise(student.class_name);
      const annualFee = getAnnualFeePaise(student.class_name);
      const transportMonthly = getTransportRatePaise(transportSlab);
      const hostelMonthly = getHostelRatePaise(student.hostel_opted || 'WITHOUT_AC');

      // Random payment cohort distribution:
      // 0 to 69: ~70% Fully Paid (Apr-Jul, Aug paid/partial)
      // 70 to 84: ~15% Partially Paid
      // 85 to 94: ~10% Unpaid Defaulters / Overdue
      // 95 to 99: Bounced cheque / special case
      const cohortRand = (sIdx * 37 + 13) % 100;
      let isBouncedStudent = false;
      if (bouncedStudentsAssigned < 3 && (cohortRand >= 95 || sIdx === 12 || sIdx === 28)) {
        isBouncedStudent = true;
        bouncedStudentsAssigned++;
      }

      const isFullyPaid = cohortRand < 70 && !isBouncedStudent;
      const isPartial = cohortRand >= 70 && cohortRand < 85 && !isBouncedStudent;
      const isDefaulter = cohortRand >= 85 && cohortRand < 95 && !isBouncedStudent;

      // ─── 1. SLOT 1: APRIL (+ Annual Fee, + Admission/Prospectus if new) ───
      const aprDue = '2026-04-15';
      const aprPayDate = `2026-04-${String(4 + (sIdx % 9)).padStart(2, '0')}`;
      receiptSeq++;
      const aprReceiptNo = `${schoolId.slice(0, 4).toUpperCase()}-REC-2604-${String(receiptSeq).padStart(4, '0')}`;
      const payMode = PAYMENT_MODES[sIdx % PAYMENT_MODES.length];
      const cashier = CASHIERS[sIdx % CASHIERS.length];

      // Tuition Demand (APR)
      if (!isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'TUITION',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: tuitionMonthly,
          txn_date: aprDue,
          due_date: aprDue,
          payment_mode: null,
          receipt_no: null,
          cheque_no: null,
          txn_ref: null,
          concession_type: null,
          collected_by: null,
          approved_by: null,
          is_cancelled: false,
          created_at: '2026-04-01T09:00:00.000Z',
        });
        totalDemandRaised += tuitionMonthly;

        // Sibling Discount on Tuition
        if (siblingTier && siblingTier.tuitionDiscountPct > 0) {
          const discAmt = Math.round((tuitionMonthly * siblingTier.tuitionDiscountPct) / 100);
          batchLines.push({
            id: makeLineId('FLL-DISC'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'DISCOUNT',
            fee_head: 'TUITION',
            month: 'APR',
            slot_id: 'SLOT_1_APR',
            amount: discAmt,
            txn_date: aprDue,
            due_date: null,
            concession_type: 'SIBLING',
            approved_by: 'PRIN-AUTH',
            remarks: `Sibling Concession (${siblingTier.tuitionDiscountPct}% on tuition for child #${siblingTier.order})`,
            is_cancelled: false,
            created_at: '2026-04-01T09:05:00.000Z',
          });
          totalDiscount += discAmt;
        }
      }

      // Annual Fee Demand (APR)
      if (!isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'ANNUAL',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: annualFee,
          txn_date: aprDue,
          due_date: aprDue,
          is_cancelled: false,
          created_at: '2026-04-01T09:00:00.000Z',
        });
        totalDemandRaised += annualFee;
      }

      // New Admission Charges (Admission ₹5,000 + Prospectus ₹1,000)
      if (isNewAdmission && !isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'PROSPECTUS',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: 100000,
          txn_date: aprDue,
          due_date: aprDue,
          is_cancelled: false,
          created_at: '2026-04-01T09:00:00.000Z',
        });
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'ADMISSION',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: 500000,
          txn_date: aprDue,
          due_date: aprDue,
          is_cancelled: false,
          created_at: '2026-04-01T09:00:00.000Z',
        });
        totalDemandRaised += 600000;
      }

      // Transport Demand (APR)
      if (isTransport) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'TRANSPORT',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: transportMonthly,
          txn_date: aprDue,
          due_date: aprDue,
          is_cancelled: false,
          created_at: '2026-04-01T09:00:00.000Z',
        });
        totalDemandRaised += transportMonthly;

        if (siblingTier && siblingTier.freeTransport) {
          batchLines.push({
            id: makeLineId('FLL-WAIV'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'WAIVER',
            fee_head: 'TRANSPORT',
            month: 'APR',
            slot_id: 'SLOT_1_APR',
            amount: transportMonthly,
            txn_date: aprDue,
            concession_type: 'SIBLING',
            approved_by: 'PRIN-AUTH',
            remarks: 'Free Transport Concession (4th Child Policy)',
            is_cancelled: false,
            created_at: '2026-04-01T09:05:00.000Z',
          });
          totalDiscount += transportMonthly;
        }
      }

      // April Payment (Everyone except defaulters paid April)
      if (!isDefaulter && !isRte) {
        const netTuition = siblingTier ? Math.round((tuitionMonthly * (100 - siblingTier.tuitionDiscountPct)) / 100) : tuitionMonthly;
        batchLines.push({
          id: makeLineId('FLL-PAY'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: netTuition,
          txn_date: aprPayDate,
          payment_mode: payMode,
          receipt_no: aprReceiptNo,
          cheque_no: payMode === 'CHEQUE' ? `CHQ-${104000 + sIdx}` : null,
          txn_ref: payMode === 'UPI' ? `UPI-2604-${1000 + sIdx}` : null,
          collected_by: cashier,
          remarks: 'April Slot Fee Collection',
          is_cancelled: false,
          created_at: `${aprPayDate}T10:30:00.000Z`,
        });
        totalCollected += netTuition;

        // Pay Annual Fee
        batchLines.push({
          id: makeLineId('FLL-PAY'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'ANNUAL',
          month: 'APR',
          slot_id: 'SLOT_1_APR',
          amount: annualFee,
          txn_date: aprPayDate,
          payment_mode: payMode,
          receipt_no: aprReceiptNo,
          collected_by: cashier,
          remarks: 'Annual Development Fee',
          is_cancelled: false,
          created_at: `${aprPayDate}T10:30:00.000Z`,
        });
        totalCollected += annualFee;

        // Pay Admission/Prospectus if new
        if (isNewAdmission) {
          batchLines.push({
            id: makeLineId('FLL-PAY'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'PAYMENT',
            fee_head: 'PROSPECTUS',
            month: 'APR',
            slot_id: 'SLOT_1_APR',
            amount: 100000,
            txn_date: aprPayDate,
            payment_mode: payMode,
            receipt_no: aprReceiptNo,
            collected_by: cashier,
            is_cancelled: false,
            created_at: `${aprPayDate}T10:30:00.000Z`,
          });
          batchLines.push({
            id: makeLineId('FLL-PAY'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'PAYMENT',
            fee_head: 'ADMISSION',
            month: 'APR',
            slot_id: 'SLOT_1_APR',
            amount: 500000,
            txn_date: aprPayDate,
            payment_mode: payMode,
            receipt_no: aprReceiptNo,
            collected_by: cashier,
            is_cancelled: false,
            created_at: `${aprPayDate}T10:30:00.000Z`,
          });
          totalCollected += 600000;
        }

        if (isTransport && (!siblingTier || !siblingTier.freeTransport)) {
          batchLines.push({
            id: makeLineId('FLL-PAY'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'PAYMENT',
            fee_head: 'TRANSPORT',
            month: 'APR',
            slot_id: 'SLOT_1_APR',
            amount: transportMonthly,
            txn_date: aprPayDate,
            payment_mode: payMode,
            receipt_no: aprReceiptNo,
            collected_by: cashier,
            is_cancelled: false,
            created_at: `${aprPayDate}T10:30:00.000Z`,
          });
          totalCollected += transportMonthly;
        }
      }

      // ─── 2. SLOT 2: MAY + JUNE (Combined Slot) ───
      const mayDue = '2026-05-15';
      const mayPayDate = `2026-05-${String(5 + (sIdx % 8)).padStart(2, '0')}`;
      receiptSeq++;
      const mayReceiptNo = `${schoolId.slice(0, 4).toUpperCase()}-REC-2605-${String(receiptSeq).padStart(4, '0')}`;

      for (const m of ['MAY', 'JUN']) {
        if (!isRte) {
          batchLines.push({
            id: makeLineId('FLL-DMD'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'DEMAND',
            fee_head: 'TUITION',
            month: m,
            slot_id: 'SLOT_2_MAY_JUN',
            amount: tuitionMonthly,
            txn_date: mayDue,
            due_date: mayDue,
            is_cancelled: false,
            created_at: '2026-05-01T09:00:00.000Z',
          });
          totalDemandRaised += tuitionMonthly;

          if (siblingTier && siblingTier.tuitionDiscountPct > 0) {
            const discAmt = Math.round((tuitionMonthly * siblingTier.tuitionDiscountPct) / 100);
            batchLines.push({
              id: makeLineId('FLL-DISC'),
              school_id: schoolId,
              academic_session: SESSION,
              student_id: student.id,
              class_name: student.class_name,
              section: student.section || 'A',
              admission_no: student.admission_no || '',
              line_type: 'DISCOUNT',
              fee_head: 'TUITION',
              month: m,
              slot_id: 'SLOT_2_MAY_JUN',
              amount: discAmt,
              txn_date: mayDue,
              concession_type: 'SIBLING',
              approved_by: 'PRIN-AUTH',
              remarks: `Sibling Concession (${siblingTier.tuitionDiscountPct}%)`,
              is_cancelled: false,
              created_at: '2026-05-01T09:05:00.000Z',
            });
            totalDiscount += discAmt;
          }
        }

        if (isTransport) {
          batchLines.push({
            id: makeLineId('FLL-DMD'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'DEMAND',
            fee_head: 'TRANSPORT',
            month: m,
            slot_id: 'SLOT_2_MAY_JUN',
            amount: transportMonthly,
            txn_date: mayDue,
            due_date: mayDue,
            is_cancelled: false,
            created_at: '2026-05-01T09:00:00.000Z',
          });
          totalDemandRaised += transportMonthly;
        }
      }

      // May + June Payment: Paid by fully paid students and partial students
      if ((isFullyPaid || isPartial) && !isRte) {
        for (const m of ['MAY', 'JUN']) {
          const netTuition = siblingTier ? Math.round((tuitionMonthly * (100 - siblingTier.tuitionDiscountPct)) / 100) : tuitionMonthly;
          batchLines.push({
            id: makeLineId('FLL-PAY'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'PAYMENT',
            fee_head: 'TUITION',
            month: m,
            slot_id: 'SLOT_2_MAY_JUN',
            amount: netTuition,
            txn_date: mayPayDate,
            payment_mode: payMode,
            receipt_no: mayReceiptNo,
            collected_by: cashier,
            remarks: `May+June Combined Deposit (${m})`,
            is_cancelled: false,
            created_at: `${mayPayDate}T11:00:00.000Z`,
          });
          totalCollected += netTuition;

          if (isTransport && (!siblingTier || !siblingTier.freeTransport)) {
            batchLines.push({
              id: makeLineId('FLL-PAY'),
              school_id: schoolId,
              academic_session: SESSION,
              student_id: student.id,
              class_name: student.class_name,
              section: student.section || 'A',
              admission_no: student.admission_no || '',
              line_type: 'PAYMENT',
              fee_head: 'TRANSPORT',
              month: m,
              slot_id: 'SLOT_2_MAY_JUN',
              amount: transportMonthly,
              txn_date: mayPayDate,
              payment_mode: payMode,
              receipt_no: mayReceiptNo,
              collected_by: cashier,
              is_cancelled: false,
              created_at: `${mayPayDate}T11:00:00.000Z`,
            });
            totalCollected += transportMonthly;
          }
        }
      }

      // Bounced Cheque Case (2-3 per school)
      if (isBouncedStudent && !isRte) {
        const chqNo = `CHQ-${982000 + sIdx}`;
        const payLineId = makeLineId('FLL-PAY-CHQ');
        const netTuition = tuitionMonthly * 2; // May+Jun

        batchLines.push({
          id: payLineId,
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: 'MAY',
          slot_id: 'SLOT_2_MAY_JUN',
          amount: netTuition,
          txn_date: '2026-05-10',
          payment_mode: 'CHEQUE',
          receipt_no: `${schoolId.slice(0, 4).toUpperCase()}-REC-2605-BOUNCE-${sIdx}`,
          cheque_no: chqNo,
          collected_by: 'USR-ACC-01',
          remarks: `Cheque Deposit #${chqNo}`,
          is_cancelled: false,
          created_at: '2026-05-10T11:00:00.000Z',
        });
        totalCollected += netTuition;

        // Reversal Adjustment line 7 days later
        batchLines.push({
          id: makeLineId('FLL-ADJ-BOUNCE'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'ADJUSTMENT',
          adjustment_direction: 'DEBIT',
          fee_head: 'TUITION',
          month: 'MAY',
          slot_id: 'SLOT_2_MAY_JUN',
          amount: netTuition,
          txn_date: '2026-05-18',
          linked_line_id: payLineId,
          cheque_no: chqNo,
          approved_by: 'BANK-RETURN',
          remarks: `Cheque #${chqNo} Bounced - Return memo: Insufficient Funds (CTS-2010)`,
          is_cancelled: false,
          created_at: '2026-05-18T14:30:00.000Z',
        });
        totalDemandRaised += netTuition; // Restores outstanding balance
      }

      // ─── 3. SLOT 3: JULY (+ Unit Test Exam Fee) ───
      const julDue = '2026-07-15';
      const julPayDate = `2026-07-${String(6 + (sIdx % 7)).padStart(2, '0')}`;
      receiptSeq++;
      const julReceiptNo = `${schoolId.slice(0, 4).toUpperCase()}-REC-2607-${String(receiptSeq).padStart(4, '0')}`;

      if (!isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'TUITION',
          month: 'JUL',
          slot_id: 'SLOT_3_JUL',
          amount: tuitionMonthly,
          txn_date: julDue,
          due_date: julDue,
          is_cancelled: false,
          created_at: '2026-07-01T09:00:00.000Z',
        });
        totalDemandRaised += tuitionMonthly;

        // Unit Test Exam Fee Demand (₹500)
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'EXAM',
          month: 'JUL',
          slot_id: 'SLOT_3_JUL',
          amount: 50000, // ₹500
          txn_date: julDue,
          due_date: julDue,
          remarks: 'Unit Test I Exam Fee',
          is_cancelled: false,
          created_at: '2026-07-01T09:00:00.000Z',
        });
        totalDemandRaised += 50000;
      }

      // July Payment: Paid by fully paid students
      if (isFullyPaid && !isRte) {
        const netTuition = siblingTier ? Math.round((tuitionMonthly * (100 - siblingTier.tuitionDiscountPct)) / 100) : tuitionMonthly;
        batchLines.push({
          id: makeLineId('FLL-PAY'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: 'JUL',
          slot_id: 'SLOT_3_JUL',
          amount: netTuition,
          txn_date: julPayDate,
          payment_mode: payMode,
          receipt_no: julReceiptNo,
          collected_by: cashier,
          remarks: 'July Tuition Fee',
          is_cancelled: false,
          created_at: `${julPayDate}T11:15:00.000Z`,
        });
        totalCollected += netTuition;

        batchLines.push({
          id: makeLineId('FLL-PAY'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'EXAM',
          month: 'JUL',
          slot_id: 'SLOT_3_JUL',
          amount: 50000,
          txn_date: julPayDate,
          payment_mode: payMode,
          receipt_no: julReceiptNo,
          collected_by: cashier,
          remarks: 'Unit Test Exam Fee Collection',
          is_cancelled: false,
          created_at: `${julPayDate}T11:15:00.000Z`,
        });
        totalCollected += 50000;
      }

      // Partial Payment Example in July (Cohort 2: paid ₹1,000 out of tuition)
      if (isPartial && !isRte) {
        const partialAmt = Math.round(tuitionMonthly * 0.5); // 50% partial
        batchLines.push({
          id: makeLineId('FLL-PAY-PART'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: 'JUL',
          slot_id: 'SLOT_3_JUL',
          amount: partialAmt,
          txn_date: julPayDate,
          payment_mode: 'UPI',
          receipt_no: `${schoolId.slice(0, 4).toUpperCase()}-REC-2607-PART-${sIdx}`,
          collected_by: cashier,
          remarks: `Partial Payment of July Fee (₹${partialAmt / 100} of ₹${tuitionMonthly / 100})`,
          is_cancelled: false,
          created_at: `${julPayDate}T12:00:00.000Z`,
        });
        totalCollected += partialAmt;
      }

      // ─── 4. SLOT 4: AUGUST (Demands Raised) ───
      const augDue = '2026-08-15';
      const augPayDate = `2026-08-${String(5 + (sIdx % 7)).padStart(2, '0')}`;
      receiptSeq++;
      const augReceiptNo = `${schoolId.slice(0, 4).toUpperCase()}-REC-2608-${String(receiptSeq).padStart(4, '0')}`;

      if (!isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'TUITION',
          month: 'AUG',
          slot_id: 'SLOT_4_AUG',
          amount: tuitionMonthly,
          txn_date: augDue,
          due_date: augDue,
          is_cancelled: false,
          created_at: '2026-08-01T09:00:00.000Z',
        });
        totalDemandRaised += tuitionMonthly;
      }

      // August Payment for ~60% of students
      if (isFullyPaid && sIdx % 5 !== 0 && !isRte) {
        const netTuition = siblingTier ? Math.round((tuitionMonthly * (100 - siblingTier.tuitionDiscountPct)) / 100) : tuitionMonthly;
        batchLines.push({
          id: makeLineId('FLL-PAY'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'PAYMENT',
          fee_head: 'TUITION',
          month: 'AUG',
          slot_id: 'SLOT_4_AUG',
          amount: netTuition,
          txn_date: augPayDate,
          payment_mode: payMode,
          receipt_no: augReceiptNo,
          collected_by: cashier,
          remarks: 'August Tuition Fee',
          is_cancelled: false,
          created_at: `${augPayDate}T10:00:00.000Z`,
        });
        totalCollected += netTuition;
      }

      // Late Fee Fine on Overdue August (Defaulters past due date + 15 days grace)
      if (isDefaulter && !isRte) {
        batchLines.push({
          id: makeLineId('FLL-FINE'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'FINE',
          fee_head: 'LATE_FEE',
          month: 'AUG',
          slot_id: 'SLOT_4_AUG',
          amount: 20000, // ₹200 Late Fee Fine
          txn_date: '2026-09-01',
          due_date: '2026-09-01',
          remarks: 'Overdue Late Fee Fine (August crossed 15 days grace)',
          is_cancelled: false,
          created_at: '2026-09-01T00:01:00.000Z',
        });
        totalDemandRaised += 20000;
      }

      // ─── 5. SLOT 5: SEPTEMBER (+ February catch-up, Half-Yearly Exam, Lab, Ad-hoc Misc) ───
      const sepDue = '2026-09-15';
      const isSenior = ['6', '7', '8', '9', '10', '11', '12', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].some(k => (student.class_name || '').toUpperCase().includes(k));
      const isHighSchool = ['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII'].some(k => (student.class_name || '').toUpperCase().includes(k));

      for (const m of ['SEP', 'FEB']) {
        if (!isRte) {
          batchLines.push({
            id: makeLineId('FLL-DMD'),
            school_id: schoolId,
            academic_session: SESSION,
            student_id: student.id,
            class_name: student.class_name,
            section: student.section || 'A',
            admission_no: student.admission_no || '',
            line_type: 'DEMAND',
            fee_head: 'TUITION',
            month: m,
            slot_id: 'SLOT_5_SEP_FEB',
            amount: tuitionMonthly,
            txn_date: sepDue,
            due_date: sepDue,
            is_cancelled: false,
            created_at: '2026-09-01T09:00:00.000Z',
          });
          totalDemandRaised += tuitionMonthly;
        }
      }

      // Half-Yearly Exam Fee for classes 6-12 (₹1,000)
      if (isSenior && !isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'EXAM',
          month: 'SEP',
          slot_id: 'SLOT_5_SEP_FEB',
          amount: 100000, // ₹1,000
          txn_date: sepDue,
          due_date: sepDue,
          remarks: 'CBSE Half-Yearly Examination Charge',
          is_cancelled: false,
          created_at: '2026-09-01T09:00:00.000Z',
        });
        totalDemandRaised += 100000;
      }

      // Science/CS Lab Charges for Classes 9-12 (₹1,500/yr)
      if (isHighSchool && !isRte) {
        batchLines.push({
          id: makeLineId('FLL-DMD'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'LAB',
          month: 'SEP',
          slot_id: 'SLOT_5_SEP_FEB',
          amount: 150000, // ₹1,500
          txn_date: sepDue,
          due_date: sepDue,
          remarks: 'Annual Science & Computer Practical Lab Fee',
          is_cancelled: false,
          created_at: '2026-09-01T09:00:00.000Z',
        });
        totalDemandRaised += 150000;
      }

      // Ad-Hoc Miscellaneous Charges (FILE_MISC) for ~8% of students
      if (sIdx % 12 === 0 && !isRte) {
        const miscAmt = sIdx % 2 === 0 ? 15000 : 25000; // ₹150 or ₹250
        const reason = sIdx % 2 === 0 ? 'Duplicate Smart RFID Identity Card' : 'Lost Practical Log Book Replacement';
        batchLines.push({
          id: makeLineId('FLL-DMD-MISC'),
          school_id: schoolId,
          academic_session: SESSION,
          student_id: student.id,
          class_name: student.class_name,
          section: student.section || 'A',
          admission_no: student.admission_no || '',
          line_type: 'DEMAND',
          fee_head: 'FILE_MISC',
          month: 'SEP',
          slot_id: 'SLOT_5_SEP_FEB',
          amount: miscAmt,
          txn_date: '2026-09-05',
          due_date: '2026-09-15',
          remarks: reason,
          is_cancelled: false,
          created_at: '2026-09-05T10:00:00.000Z',
        });
        totalDemandRaised += miscAmt;
      }

      // Determine final student status
      if (isRte) {
        countPaid++;
      } else if (isFullyPaid) {
        countPaid++;
      } else if (isPartial) {
        countPartial++;
      } else if (isDefaulter || isBouncedStudent) {
        countOverdue++;
      } else {
        countPending++;
      }
    }

    // Bulk write ledger lines
    console.log(`💾 Inserting ${batchLines.length} ledger lines for ${schoolId}...`);
    if (batchLines.length > 0) {
      await ledgerCol.insertMany(batchLines, { ordered: true });
    }

    // Sync student collection fee_status with the newly seeded ledger
    console.log(`🔄 Syncing student profiles with ledger status for ${schoolId}...`);
    for (const student of sList) {
      const studentLines = batchLines.filter(l => l.student_id === student.id);
      let d = 0, p = 0, disc = 0, fine = 0;
      for (const l of studentLines) {
        if (l.line_type === 'DEMAND' || l.line_type === 'FINE') d += l.amount;
        else if (l.line_type === 'ADJUSTMENT' && l.adjustment_direction === 'DEBIT') d += l.amount;
        else if (l.line_type === 'PAYMENT') p += l.amount;
        else if (l.line_type === 'DISCOUNT' || l.line_type === 'WAIVER') disc += l.amount;
      }
      const bal = d - disc - p;
      let status = 'PENDING';
      if (d === 0 || bal <= 0) status = 'PAID';
      else if (p > 0 && bal > 0) status = 'PARTIAL';
      else status = 'OVERDUE';

      await studentsCol.updateOne(
        { id: student.id, school_id: schoolId },
        { $set: { fee_status: status } }
      );
    }

    const netOutstanding = totalDemandRaised - totalDiscount - totalCollected;

    schoolStats.push({
      schoolId,
      studentCount: sList.length,
      linesCount: batchLines.length,
      totalDemandRaised: totalDemandRaised / 100,
      totalCollected: totalCollected / 100,
      totalDiscount: totalDiscount / 100,
      netOutstanding: Math.max(0, netOutstanding) / 100,
      countPaid,
      countPartial,
      countPending,
      countOverdue,
      bouncedCheques: bouncedStudentsAssigned,
    });
  }

  // ─── PRINT SUMMARY TABLE ───
  console.log('\n' + '='.repeat(90));
  console.log('🎓 SEED SUMMARY — FINANCIAL LEDGER AUDIT REPORT (Session 2026-27)');
  console.log('='.repeat(90));
  console.table(schoolStats);

  let grandDemand = 0, grandCollected = 0, grandOutstanding = 0, grandPaid = 0, grandPartial = 0, grandOverdue = 0;
  for (const s of schoolStats) {
    grandDemand += s.totalDemandRaised;
    grandCollected += s.totalCollected;
    grandOutstanding += s.netOutstanding;
    grandPaid += s.countPaid;
    grandPartial += s.countPartial;
    grandOverdue += s.countOverdue;
  }

  console.log('='.repeat(90));
  console.log(`📊 GRAND TOTALS ACROSS ALL SCHOOLS:`);
  console.log(`   - Total Demand Raised:   ₹${grandDemand.toLocaleString('en-IN')}`);
  console.log(`   - Total Fees Collected:  ₹${grandCollected.toLocaleString('en-IN')}`);
  console.log(`   - Net Outstanding Dues:  ₹${grandOutstanding.toLocaleString('en-IN')}`);
  console.log(`   - Paid Scholars:         ${grandPaid}`);
  console.log(`   - Partially Paid:        ${grandPartial}`);
  console.log(`   - Overdue Defaulters:    ${grandOverdue}`);
  console.log('='.repeat(90) + '\n');

  await client.close();
  console.log('✅ Seeding completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seeder Error:', err);
  process.exit(1);
});
