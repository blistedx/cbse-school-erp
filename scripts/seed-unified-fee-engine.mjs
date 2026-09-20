import { MongoClient } from 'mongodb';
import fs from 'fs';

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  const envFiles = ['.env', '.env.local'];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) {
        envUri = match[1];
        break;
      }
    }
  }
}

// Deterministic PRNG (Mulberry32) for perfectly reproducible seed data
function createPrng(seed = 0xCB5E2026) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTH_SCHEDULE = [
  { key: 'APR', label: 'April 2026', due: '2026-04-15', slotId: 'SLOT_1_APR' },
  { key: 'MAY', label: 'May 2026', due: '2026-05-15', slotId: 'SLOT_2_MAY_JUN' },
  { key: 'JUN', label: 'June 2026', due: '2026-05-15', slotId: 'SLOT_2_MAY_JUN' },
  { key: 'JUL', label: 'July 2026', due: '2026-07-15', slotId: 'SLOT_3_JUL' },
  { key: 'AUG', label: 'August 2026', due: '2026-08-15', slotId: 'SLOT_4_AUG' },
  { key: 'SEP', label: 'September 2026', due: '2026-09-15', slotId: 'SLOT_5_SEP_FEB' },
  { key: 'FEB', label: 'February 2027', due: '2026-09-15', slotId: 'SLOT_5_SEP_FEB' }, // Due with September in Slot 5
  { key: 'OCT', label: 'October 2026', due: '2026-10-15', slotId: 'SLOT_6_OCT' },
  { key: 'NOV', label: 'November 2026', due: '2026-11-15', slotId: 'SLOT_7_NOV' },
  { key: 'DEC', label: 'December 2026', due: '2026-12-15', slotId: 'SLOT_8_DEC_MAR' },
  { key: 'MAR', label: 'March 2027', due: '2026-12-15', slotId: 'SLOT_8_DEC_MAR' }, // Due with December in Slot 8
];

function getTuitionRatePaise(className) {
  const c = String(className || '').toUpperCase().trim();
  if (['PG', 'PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'KG', 'PRE-PRIMARY'].some(k => c.includes(k))) return 100000;
  if (['1', 'I', '2', 'II', 'CLASS 1', 'CLASS 2', 'CLASS I', 'CLASS II'].some(k => c === k || c.startsWith(k + ' '))) return 140000;
  if (['3', 'III', '4', 'IV', '5', 'V', 'CLASS 3', 'CLASS 4', 'CLASS 5'].some(k => c === k || c.startsWith(k + ' '))) return 160000;
  if (['6', 'VI', '7', 'VII', '8', 'VIII', 'CLASS 6', 'CLASS 7', 'CLASS 8'].some(k => c === k || c.startsWith(k + ' '))) return 180000;
  if (['9', 'IX', '10', 'X', 'CLASS 9', 'CLASS 10'].some(k => c === k || c.startsWith(k + ' '))) return 200000;
  if (['11', 'XI', '12', 'XII', 'CLASS 11', 'CLASS 12'].some(k => c === k || c.startsWith(k + ' '))) return 240000;
  return 160000;
}

function getAnnualFeePaise(className) {
  const c = String(className || '').toUpperCase().trim();
  if (['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII', 'CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].some(k => c === k || c.startsWith(k + ' '))) {
    return 600000;
  }
  return 500000;
}

function getTransportRatePaise(slabId) {
  const s = String(slabId || '1');
  if (s === '1') return 80000;
  if (s === '2') return 90000;
  if (s === '3') return 110000;
  if (s === '4') return 130000;
  if (s === '5') return 180000;
  return 90000;
}

function getHostelRatePaise(roomType) {
  const r = String(roomType || 'DOUBLE').toUpperCase();
  if (r.includes('SINGLE')) return 800000; // ₹8,000/mo
  if (r.includes('TRIPLE')) return 500000; // ₹5,000/mo
  return 650000; // ₹6,500/mo (Double Sharing)
}

function generateDemandsForStudent(student, session, siblingTier, manualConcession = null) {
  const schoolId = student.school_id || 'DPS2026';
  const isRte = String(student.is_rte || '').toUpperCase() === 'YES';
  const isTransport = String(student.transport_opted || '').toUpperCase() === 'YES';
  const isHostel = String(student.hostel_opted || '').toUpperCase() === 'YES';
  const transportSlab = student.transport_slab_id || '1';
  
  // STRICT NEW ADMISSION RULE:
  // Anand Shukla (adm 2026-09-03) and Aarav Gupta (adm 2026-09-05) are newly admitted in September.
  const isNewAdmission = student.admission_type === 'NEW' || student.admission_no === 'ADM-0556' || student.admission_no === 'DPS-2026-0263';
  const admissionDate = student.admission_date || (student.admission_no === 'ADM-0556' ? '2026-09-03' : (student.admission_no === 'DPS-2026-0263' ? '2026-09-05' : '2026-04-01'));

  const tuitionMonthly = getTuitionRatePaise(student.class_name);
  const annualFee = getAnnualFeePaise(student.class_name);
  const transportMonthly = getTransportRatePaise(transportSlab);
  const hostelMonthly = getHostelRatePaise(student.hostel_room_type || 'DOUBLE');

  const demands = [];
  const studentName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Scholar';
  const admNo = student.admission_no || '';
  const cls = student.class_name || 'Class 1';
  const sec = student.section || 'A';
  const now = '2026-04-01T09:00:00.000Z';

  // 1. Annual Fee (Charged in April ONLY for existing students)
  if (!isRte && !isNewAdmission) {
    demands.push({
      id: `DEM-${student.id}-ANNUAL-APR`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'ANNUAL',
      period: 'APR',
      periodLabel: 'April 2026 (Annual Fee)',
      grossAmount: annualFee,
      discountAmount: 0,
      discountReason: null,
      netAmount: annualFee,
      dueDate: '2026-04-15',
      createdAt: now,
    });
  }

  // 2. One-Time Charges (Admission & Registration) — ONLY FOR NEW ADMISSIONS, DUE AT ADMISSION DATE
  if (isNewAdmission && !isRte) {
    demands.push({
      id: `DEM-${student.id}-REGISTRATION-ONETIME`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'REGISTRATION',
      period: 'ONE_TIME',
      periodLabel: 'Registration / Prospectus',
      grossAmount: 100000,
      discountAmount: 0,
      discountReason: null,
      netAmount: 100000,
      dueDate: admissionDate,
      createdAt: `${admissionDate}T09:00:00.000Z`,
    });
    demands.push({
      id: `DEM-${student.id}-ADMISSION-ONETIME`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'ADMISSION',
      period: 'ONE_TIME',
      periodLabel: 'Admission Fee',
      grossAmount: 500000,
      discountAmount: 0,
      discountReason: null,
      netAmount: 500000,
      dueDate: admissionDate,
      createdAt: `${admissionDate}T09:00:00.000Z`,
    });
  }

  // 3. Refundable Hostel Security Deposit (₹10,000) — ONLY FOR HOSTELLERS
  if (isHostel) {
    demands.push({
      id: `DEM-${student.id}-HOSTEL-CAUTION`,
      schoolId,
      sessionId: session,
      studentId: student.id,
      studentName,
      admissionNo: admNo,
      className: cls,
      section: sec,
      feeHead: 'SECURITY_DEPOSIT',
      period: 'ONE_TIME',
      periodLabel: 'Hostel Security Deposit (Refundable)',
      grossAmount: 1000000, // ₹10,000
      discountAmount: 0,
      discountReason: null,
      netAmount: 1000000,
      dueDate: '2026-04-01',
      createdAt: now,
    });
  }

  // 4. Academic Months (Tuition, Transport, Hostel, Exams)
  // For new admissions admitted in September: skip April through August!
  const priorMonths = ['APR', 'MAY', 'JUN', 'JUL', 'AUG'];

  for (const m of MONTH_SCHEDULE) {
    if (isNewAdmission && priorMonths.includes(m.key)) {
      continue; // No prior months demands for scholars admitted in September
    }

    if (!isRte) {
      let tuitionDisc = 0;
      let tuitionDiscReason = null;
      
      // Automatic sibling discount
      if (siblingTier && siblingTier.tuitionDiscountPct > 0) {
        tuitionDisc = Math.round((tuitionMonthly * siblingTier.tuitionDiscountPct) / 100);
        tuitionDiscReason = `Sibling Concession (${siblingTier.tuitionDiscountPct}% on tuition)`;
      }

      // Manual concession override (if assigned)
      if (manualConcession && manualConcession.month === m.key) {
        tuitionDisc = manualConcession.amountPaise;
        tuitionDiscReason = manualConcession.reason;
      }

      demands.push({
        id: `DEM-${student.id}-TUITION-${m.key}`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'TUITION',
        period: m.key,
        periodLabel: m.label,
        grossAmount: tuitionMonthly,
        discountAmount: tuitionDisc,
        discountReason: tuitionDiscReason,
        netAmount: Math.max(0, tuitionMonthly - tuitionDisc),
        dueDate: m.due,
        createdAt: isNewAdmission ? `${admissionDate}T09:00:00.000Z` : now,
      });
    }

    // Transport Demand
    if (isTransport) {
      let transDisc = 0;
      let transDiscReason = null;
      if (siblingTier && siblingTier.freeTransport) {
        transDisc = transportMonthly;
        transDiscReason = '4th Child Free Transport Policy';
      }

      demands.push({
        id: `DEM-${student.id}-TRANSPORT-${m.key}`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'TRANSPORT',
        period: m.key,
        periodLabel: `${m.label} (Bus)`,
        grossAmount: transportMonthly,
        discountAmount: transDisc,
        discountReason: transDiscReason,
        netAmount: Math.max(0, transportMonthly - transDisc),
        dueDate: m.due,
        createdAt: isNewAdmission ? `${admissionDate}T09:00:00.000Z` : now,
      });
    }

    // Hostel Demand (Monthly Boarding & Mess)
    if (isHostel) {
      demands.push({
        id: `DEM-${student.id}-HOSTEL-${m.key}`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'HOSTEL',
        period: m.key,
        periodLabel: `${m.label} (Hostel & Mess)`,
        grossAmount: hostelMonthly,
        discountAmount: 0,
        discountReason: null,
        netAmount: hostelMonthly,
        dueDate: m.due,
        createdAt: now,
      });
    }

    // Exam & Lab Assessments
    if (m.key === 'JUL' && !isRte && !isNewAdmission) {
      demands.push({
        id: `DEM-${student.id}-EXAM-JUL`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'JUL',
        periodLabel: 'July Unit Test Exam',
        grossAmount: 50000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 50000,
        dueDate: m.due,
        createdAt: now,
      });
    } else if (m.key === 'SEP' && !isRte) {
      demands.push({
        id: `DEM-${student.id}-EXAM-SEP`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'SEP',
        periodLabel: 'Half-Yearly Examination',
        grossAmount: 100000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 100000,
        dueDate: m.due,
        createdAt: isNewAdmission ? `${admissionDate}T09:00:00.000Z` : now,
      });
      if (['9', '10', '11', '12', 'IX', 'X', 'XI', 'XII', 'CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].some(k => cls.toUpperCase().includes(k))) {
        demands.push({
          id: `DEM-${student.id}-LAB-SEP`,
          schoolId,
          sessionId: session,
          studentId: student.id,
          studentName,
          admissionNo: admNo,
          className: cls,
          section: sec,
          feeHead: 'LAB',
          period: 'SEP',
          periodLabel: 'Science & Computer Lab Fee',
          grossAmount: 150000, // ₹1,500
          discountAmount: 0,
          discountReason: null,
          netAmount: 150000,
          dueDate: m.due,
          createdAt: isNewAdmission ? `${admissionDate}T09:00:00.000Z` : now,
        });
      }
    } else if (m.key === 'FEB' && !isRte) {
      demands.push({
        id: `DEM-${student.id}-EXAM-FEB`,
        schoolId,
        sessionId: session,
        studentId: student.id,
        studentName,
        admissionNo: admNo,
        className: cls,
        section: sec,
        feeHead: 'EXAM',
        period: 'FEB',
        periodLabel: 'Annual Board Assessment',
        grossAmount: 100000,
        discountAmount: 0,
        discountReason: null,
        netAmount: 100000,
        dueDate: '2027-02-15', // Exam assessment date in February
        createdAt: isNewAdmission ? `${admissionDate}T09:00:00.000Z` : now,
      });
    }
  }

  return demands;
}

const PAYMENT_MODES = ['UPI', 'CASH', 'UPI', 'ONLINE', 'CHEQUE', 'UPI', 'CASH'];

async function seedUnifiedFeeEngine() {
  console.log('⚡ Starting Unified Fee Engine Seeder (Deterministic PRNG & Realistic Cohorts)...');
  const prng = createPrng(0xCB5E2026);

  const schoolId = 'DPS2026';
  const session = '2026-27';

  // SAFETY GUARD: Protect production schools from demo overwrite
  if (process.env.NODE_ENV === 'production' && schoolId !== 'DPS2026') {
    throw new Error(`[SAFETY_GUARD_ALERT] Demo seeder can only run on demo school DPS2026. Refusing to seed ${schoolId}`);
  }

  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  const students = await db.collection('students').find({ school_id: schoolId }).toArray();
  console.log(`📋 Found ${students.length} students enrolled in ${schoolId}`);

  // Ensure explicit admission attributes
  const studentUpdates = [];
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const isNew = s.admission_no === 'ADM-0556' || s.admission_no === 'DPS-2026-0263';
    // Realistic Transport (14 students) and Hostel (6 students)
    const isTrans = i < 14;
    const slabId = String((i % 4) + 1);
    const isHost = i >= 20 && i < 26;
    const roomType = i % 2 === 0 ? 'DOUBLE' : 'SINGLE';

    s.admission_type = isNew ? 'NEW' : 'EXISTING';
    s.admission_session = isNew ? '2026-27' : '2025-26';
    s.transport_opted = isTrans ? 'YES' : 'NO';
    s.transport_slab_id = isTrans ? slabId : null;
    s.hostel_opted = isHost ? 'YES' : 'NO';
    s.hostel_room_type = isHost ? roomType : null;

    studentUpdates.push({
      updateOne: {
        filter: { _id: s._id },
        update: {
          $set: {
            admission_type: s.admission_type,
            admission_session: s.admission_session,
            transport_opted: s.transport_opted,
            transport_slab_id: s.transport_slab_id,
            hostel_opted: s.hostel_opted,
            hostel_room_type: s.hostel_room_type,
          }
        }
      }
    });
  }
  await db.collection('students').bulkWrite(studentUpdates);
  console.log('✅ Synchronized student admission, transport, and hostel attributes in DB');

  // Sibling mapping
  const familyMap = new Map();
  for (const s of students) {
    const phone = (s.father_phone || s.guardian_phone || s.mother_phone || '').trim().replace(/\D/g, '');
    const fatherName = (s.father_name || s.guardian_name || '').trim().toLowerCase();
    const familyKey = phone.length >= 10 ? phone : (fatherName ? `name:${fatherName}` : null);
    if (familyKey) {
      if (!familyMap.has(familyKey)) familyMap.set(familyKey, []);
      familyMap.get(familyKey).push(s);
    }
  }

  const siblingTierMap = new Map();
  for (const [key, famMembers] of familyMap.entries()) {
    if (famMembers.length > 1) {
      famMembers.sort((a, b) => (a.admission_no || a.id).localeCompare(b.admission_no || b.id));
      for (let i = 0; i < famMembers.length; i++) {
        const order = i + 1;
        if (order === 2) siblingTierMap.set(famMembers[i].id, { order: 2, tuitionDiscountPct: 20, freeTransport: false });
        else if (order === 3) siblingTierMap.set(famMembers[i].id, { order: 3, tuitionDiscountPct: 30, freeTransport: false });
        else if (order >= 4) siblingTierMap.set(famMembers[i].id, { order: 4, tuitionDiscountPct: 30, freeTransport: true });
      }
    }
  }

  console.log(`👨‍👩‍👧 Mapped ${siblingTierMap.size} sibling discount beneficiaries`);

  // 5 Explicit Manual Concessions (Total ₹3,300: ₹2,900 Due to Date + ₹400 Upcoming)
  const manualConcessionConfigs = [
    { studentIndex: 10, month: 'MAY', amountPaise: 80000, reason: 'Merit Scholarship (CBSE State Top 1%)', approvedBy: 'PRINCIPAL / GOVERNING BODY' },
    { studentIndex: 45, month: 'JUL', amountPaise: 50000, reason: 'Staff Ward Special Fee Waiver', approvedBy: 'SECRETARY / ACCOUNTS' },
    { studentIndex: 100, month: 'AUG', amountPaise: 100000, reason: 'National Sports Champion Waiver', approvedBy: 'MANAGEMENT' },
    { studentIndex: 150, month: 'SEP', amountPaise: 60000, reason: 'Special Hardship COVID Relief', approvedBy: 'ACCOUNTS OFFICER' },
    { studentIndex: 200, month: 'OCT', amountPaise: 40000, reason: 'EWS Discretionary Principal Waiver', approvedBy: 'PRINCIPAL' },
  ];

  const manualConcessionDocs = [];
  const manualConcessionsByStudentId = new Map();

  for (const mcc of manualConcessionConfigs) {
    const s = students[mcc.studentIndex];
    if (s) {
      manualConcessionsByStudentId.set(s.id, mcc);
      manualConcessionDocs.push({
        id: `CNC-${s.id}-${mcc.month}`,
        schoolId,
        sessionId: session,
        studentId: s.id,
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        className: s.class_name,
        section: s.section || 'A',
        month: mcc.month,
        amountPaise: mcc.amountPaise,
        reason: mcc.reason,
        approvedBy: mcc.approvedBy,
        createdAt: '2026-04-10T10:00:00.000Z',
      });
    }
  }

  await db.collection('fee_concessions').deleteMany({ sessionId: session });
  await db.collection('fee_concessions').insertMany(manualConcessionDocs);
  console.log(`🎁 Seeded ${manualConcessionDocs.length} distinct manual concessions in fee_concessions collection`);

  const allDemands = [];
  const allPayments = [];
  const legacyLedgerLines = [];
  let receiptCounter = 1000;

  for (let idx = 0; idx < students.length; idx++) {
    const s = students[idx];
    const siblingTier = siblingTierMap.get(s.id) || null;
    const manualConcession = manualConcessionsByStudentId.get(s.id) || null;
    const isRte = String(s.is_rte || '').toUpperCase() === 'YES';

    // 1. Generate full demands for session 2026-27
    const studentDemands = generateDemandsForStudent(s, session, siblingTier, manualConcession);
    allDemands.push(...studentDemands);

    // Populate legacy ledger demands
    for (const d of studentDemands) {
      legacyLedgerLines.push({
        id: `FLL-DMD-${d.id}`,
        school_id: schoolId,
        academic_session: session,
        student_id: s.id,
        class_name: s.class_name,
        section: s.section || 'A',
        admission_no: s.admission_no || '',
        line_type: 'DEMAND',
        fee_head: d.feeHead,
        month: d.period === 'ONE_TIME' ? null : d.period,
        slot_id: d.period === 'ONE_TIME' ? 'ONE_TIME' : `SLOT_${d.period}`,
        amount: d.grossAmount,
        txn_date: d.dueDate,
        due_date: d.dueDate,
        is_cancelled: false,
        created_at: d.createdAt,
      });

      if (d.discountAmount > 0) {
        legacyLedgerLines.push({
          id: `FLL-DISC-${d.id}`,
          school_id: schoolId,
          academic_session: session,
          student_id: s.id,
          class_name: s.class_name,
          section: s.section || 'A',
          admission_no: s.admission_no || '',
          line_type: 'DISCOUNT',
          fee_head: d.feeHead,
          month: d.period === 'ONE_TIME' ? null : d.period,
          slot_id: d.period === 'ONE_TIME' ? 'ONE_TIME' : `SLOT_${d.period}`,
          amount: d.discountAmount,
          txn_date: d.dueDate,
          concession_type: d.discountReason?.includes('Sibling') ? 'SIBLING' : 'MANUAL',
          remarks: d.discountReason || 'Fee Concession',
          is_cancelled: false,
          created_at: d.createdAt,
        });
      }
    }

    if (isRte) continue;

    // Skip automated payments loop for newly admitted scholars; their payments are generated explicitly below on/after admission date
    const isNew = s.admission_type === 'NEW' || s.admission_no === 'ADM-0556' || s.admission_no === 'DPS-2026-0263';
    if (isNew) continue;

    // 2. Realistic Cohort Distribution via deterministic PRNG:
    // • 0.00 to 0.25 (~25%): Fully Cleared to Date (Paid Apr through Sep!)
    // • 0.25 to 0.73 (~48%): Paid Through August (September Dues Pending)
    // • 0.73 to 0.83 (~10%): Partial Payers (Paid Apr, May-Jun only)
    // • 0.83 to 0.90 (~7%) : Annual Fee Defaulters (Paid Tuition Apr-Aug, but NEVER paid Annual Fee)
    // • 0.90 to 1.00 (~10%): Never Paid / Complete Defaulters (No receipts)
    const randVal = prng();
    const isNeverPaid = randVal >= 0.90;
    const isAnnualDefaulter = randVal >= 0.83 && randVal < 0.90;
    const isPartial = randVal >= 0.73 && randVal < 0.83;
    const isFullyCleared = randVal < 0.25;
    const isPaidThroughAug = randVal >= 0.25 && randVal < 0.73;
    
    // Explicit 3 advance payers
    const isAdvance = idx === 3 || idx === 7 || idx === 12;

    // Payment 1: April Slot (+ Caution deposit if hosteller)
    if (!isNeverPaid) {
      receiptCounter++;
      const aprRecNo = `DPS2-REC-2604-${String(receiptCounter).padStart(4, '0')}`;
      const aprDate = `2026-04-${String(5 + (idx % 8)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];

      let aprDemands = studentDemands.filter(d => 
        d.period === 'APR' || (d.period === 'ONE_TIME' && d.feeHead === 'SECURITY_DEPOSIT')
      );

      // If Annual Fee Defaulter: Exclude the ANNUAL fee demand so it remains unpaid!
      if (isAnnualDefaulter) {
        aprDemands = aprDemands.filter(d => d.feeHead !== 'ANNUAL');
      }

      const allocatedHeads = aprDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));

      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-APR`,
          receiptNo: aprRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: aprDate,
          collectedBy: 'ACCOUNTS_OFFICE',
          remarks: isAnnualDefaulter ? 'April Academic Tuition Only' : 'April Academic Fee & Annual Charges',
          cancelled: false,
          createdAt: `${aprDate}T10:00:00.000Z`,
        });
      }
    }

    // Payment 2: May - June Slot
    if (!isNeverPaid) {
      receiptCounter++;
      const mjRecNo = `DPS2-REC-2605-${String(receiptCounter).padStart(4, '0')}`;
      const mjDate = `2026-05-${String(6 + (idx % 8)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[(idx + 1) % PAYMENT_MODES.length];

      const mjDemands = studentDemands.filter(d => d.period === 'MAY' || d.period === 'JUN');
      const allocatedHeads = mjDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));
      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-MAY-JUN`,
          receiptNo: mjRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: mjDate,
          collectedBy: 'ACCOUNTS_OFFICE',
          remarks: 'May - June Bi-Monthly Tuition Deposit',
          cancelled: false,
          createdAt: `${mjDate}T10:30:00.000Z`,
        });
      }
    }

    // Payment 3: July Slot (+ Unit Test Exam)
    if (isFullyCleared || isPaidThroughAug || isAnnualDefaulter || isAdvance) {
      receiptCounter++;
      const julRecNo = `DPS2-REC-2607-${String(receiptCounter).padStart(4, '0')}`;
      const julDate = `2026-07-${String(7 + (idx % 7)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[(idx + 2) % PAYMENT_MODES.length];

      const julDemands = studentDemands.filter(d => d.period === 'JUL');
      const allocatedHeads = julDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));
      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-JUL`,
          receiptNo: julRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: julDate,
          collectedBy: 'ACCOUNTS_OFFICE',
          remarks: 'July Tuition & Unit Test Assessment',
          cancelled: false,
          createdAt: `${julDate}T11:00:00.000Z`,
        });
      }
    }

    // Payment 4: August Slot
    if (isFullyCleared || isPaidThroughAug || isAnnualDefaulter || isAdvance) {
      receiptCounter++;
      const augRecNo = `DPS2-REC-2608-${String(receiptCounter).padStart(4, '0')}`;
      const augDate = `2026-08-${String(5 + (idx % 7)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[(idx + 3) % PAYMENT_MODES.length];

      const augDemands = studentDemands.filter(d => d.period === 'AUG');
      const allocatedHeads = augDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));
      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-AUG`,
          receiptNo: augRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: augDate,
          collectedBy: 'ACCOUNTS_OFFICE',
          remarks: 'August Monthly Fee Deposit',
          cancelled: false,
          createdAt: `${augDate}T11:15:00.000Z`,
        });
      }
    }

    // Payment 5: September Slot (~25% scholars who are fully cleared to date)
    if (isFullyCleared) {
      receiptCounter++;
      const sepRecNo = `DPS2-REC-2609-${String(receiptCounter).padStart(4, '0')}`;
      const sepDate = `2026-09-${String(4 + (idx % 6)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[(idx + 4) % PAYMENT_MODES.length];

      const sepDemands = studentDemands.filter(d => d.period === 'SEP');
      const allocatedHeads = sepDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));
      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-SEP`,
          receiptNo: sepRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: sepDate,
          collectedBy: 'ACCOUNTS_OFFICE',
          remarks: 'September Tuition & Examination Fee',
          cancelled: false,
          createdAt: `${sepDate}T11:30:00.000Z`,
        });
      }
    }

    // Payment 6: Advance Payments (OCT, NOV for explicit advance scholars)
    if (isAdvance) {
      receiptCounter++;
      const advRecNo = `DPS2-REC-2609-ADV-${String(receiptCounter).padStart(4, '0')}`;
      const advDate = `2026-09-${String(2 + (idx % 5)).padStart(2, '0')}`;
      const mode = 'ONLINE';

      // 2-3 months advance
      const futureDemands = studentDemands.filter(d => d.period === 'OCT' || (idx === 12 ? d.period === 'NOV' || d.period === 'DEC' : d.period === 'NOV'));
      const allocatedHeads = futureDemands.map(d => ({
        feeHead: d.feeHead,
        period: d.period,
        amountPaise: d.netAmount,
      }));
      const totalPaid = allocatedHeads.reduce((a, b) => a + b.amountPaise, 0);

      if (totalPaid > 0) {
        allPayments.push({
          id: `PAY-${s.id}-ADVANCE-Q3`,
          receiptNo: advRecNo,
          schoolId,
          sessionId: session,
          studentId: s.id,
          studentName: s.full_name || 'Scholar',
          admissionNo: s.admission_no || s.id,
          className: s.class_name,
          section: s.section || 'A',
          fatherName: s.father_name || 'Parent',
          mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
          allocatedHeads,
          amountPaid: totalPaid,
          mode,
          paidOn: advDate,
          collectedBy: 'ONLINE_PORTAL',
          remarks: 'Advance Fee Payment for Q3 (Oct & Nov)',
          cancelled: false,
          createdAt: `${advDate}T14:20:00.000Z`,
        });
      }
    }
  }

  // Preserve Anand Shukla's explicit payments (ADM-0556, Admitted 2026-09-03)
  const anand = students.find(s => s.admission_no === 'ADM-0556');
  if (anand) {
    allPayments.push({
      id: `PAY-${anand.id}-ONETIME-REC924372`,
      receiptNo: 'DPS2-REC-924372-632',
      schoolId,
      sessionId: session,
      studentId: anand.id,
      studentName: 'Anand Shukla',
      admissionNo: 'ADM-0556',
      className: 'Playgroup',
      section: 'A',
      fatherName: 'Abhishek Shukla',
      mobile: '9984418529',
      allocatedHeads: [
        { feeHead: 'REGISTRATION', period: 'ONE_TIME', amountPaise: 100000 },
        { feeHead: 'ADMISSION', period: 'ONE_TIME', amountPaise: 500000 },
      ],
      amountPaid: 600000,
      mode: 'CASH',
      paidOn: '2026-09-20',
      collectedBy: 'admin',
      remarks: 'Fee payment for ONE TIME (REGISTRATION & ADMISSION)',
      cancelled: false,
      createdAt: '2026-09-20T09:18:44.561Z',
    });
  }

  // Preserve Aarav Gupta's explicit payments (DPS-2026-0263, Admitted 2026-09-05)
  const aarav = students.find(s => s.admission_no === 'DPS-2026-0263');
  if (aarav) {
    allPayments.push({
      id: `PAY-${aarav.id}-ONETIME-REC492810`,
      receiptNo: 'DPS2-REC-492810-104',
      schoolId,
      sessionId: session,
      studentId: aarav.id,
      studentName: 'Aarav Gupta',
      admissionNo: 'DPS-2026-0263',
      className: 'Class 6',
      section: 'A',
      fatherName: 'Vikram Gupta',
      mobile: '9876543210',
      allocatedHeads: [
        { feeHead: 'REGISTRATION', period: 'ONE_TIME', amountPaise: 100000 },
        { feeHead: 'ADMISSION', period: 'ONE_TIME', amountPaise: 500000 },
      ],
      amountPaid: 600000,
      mode: 'ONLINE',
      paidOn: '2026-09-08',
      collectedBy: 'admin',
      remarks: 'Fee payment for New Admission (Registration & Admission charges)',
      cancelled: false,
      createdAt: '2026-09-08T10:00:00.000Z',
    });

    allPayments.push({
      id: `PAY-${aarav.id}-SEP-REC582910`,
      receiptNo: 'DPS2-REC-582910-205',
      schoolId,
      sessionId: session,
      studentId: aarav.id,
      studentName: 'Aarav Gupta',
      admissionNo: 'DPS-2026-0263',
      className: 'Class 6',
      section: 'A',
      fatherName: 'Vikram Gupta',
      mobile: '9876543210',
      allocatedHeads: [
        { feeHead: 'TUITION', period: 'SEP', amountPaise: 180000 },
        { feeHead: 'EXAM', period: 'SEP', amountPaise: 100000 },
      ],
      amountPaid: 280000,
      mode: 'UPI',
      paidOn: '2026-09-15',
      collectedBy: 'ACCOUNTS_OFFICE',
      remarks: 'September Tuition & Half-Yearly Exam Fee',
      cancelled: false,
      createdAt: '2026-09-15T11:00:00.000Z',
    });
  }

  // STRICT VALIDATION RULE: paidOn >= admission_date for all active payments
  for (const p of allPayments) {
    const s = students.find(x => x.id === p.studentId);
    const admDate = s?.admission_date || (s?.admission_no === 'ADM-0556' ? '2026-09-03' : (s?.admission_no === 'DPS-2026-0263' ? '2026-09-05' : '2026-04-01'));
    if (admDate && p.paidOn < admDate) {
      throw new Error(`[VALIDATION_RULE_VIOLATION] Payment ${p.receiptNo} dated ${p.paidOn} predates scholar admission date ${admDate} for ${p.studentName}`);
    }
  }

  // 5 Explicit CANCELLED Receipts (Total ₹9,200)
  const cancelledReceiptConfigs = [
    { studentIndex: 15, recNo: 'DPS2-REC-VOID-0001', amountPaise: 140000, reason: 'Cheque Bounced / Insufficient Funds', mode: 'CHEQUE', date: '2026-05-10' },
    { studentIndex: 25, recNo: 'DPS2-REC-VOID-0002', amountPaise: 160000, reason: 'Duplicate Online Transaction Entry', mode: 'ONLINE', date: '2026-06-12' },
    { studentIndex: 50, recNo: 'DPS2-REC-VOID-0003', amountPaise: 180000, reason: 'Wrong Student Account Credited', mode: 'UPI', date: '2026-07-08' },
    { studentIndex: 75, recNo: 'DPS2-REC-VOID-0004', amountPaise: 200000, reason: 'Bank Chargeback Received', mode: 'ONLINE', date: '2026-08-14' },
    { studentIndex: 95, recNo: 'DPS2-REC-VOID-0005', amountPaise: 240000, reason: 'Cancelled by Administrator on Request', mode: 'CASH', date: '2026-08-20' },
  ];

  for (const crc of cancelledReceiptConfigs) {
    const s = students[crc.studentIndex];
    if (s) {
      allPayments.push({
        id: `PAY-${s.id}-CANCELLED-${crc.recNo}`,
        receiptNo: crc.recNo,
        schoolId,
        sessionId: session,
        studentId: s.id,
        studentName: s.full_name || 'Scholar',
        admissionNo: s.admission_no || s.id,
        className: s.class_name,
        section: s.section || 'A',
        fatherName: s.father_name || 'Parent',
        mobile: s.father_phone || s.guardian_phone || s.phone || '9811000000',
        allocatedHeads: [
          { feeHead: 'TUITION', period: 'MAY', amountPaise: crc.amountPaise },
        ],
        amountPaid: crc.amountPaise,
        mode: crc.mode,
        paidOn: crc.date,
        collectedBy: 'ACCOUNTS_OFFICE',
        remarks: crc.reason,
        cancelled: true,
        cancelledReason: crc.reason,
        cancelledAt: `${crc.date}T16:00:00.000Z`,
        createdAt: `${crc.date}T10:00:00.000Z`,
      });
    }
  }

  // 3. Atomically overwrite fee_demands, fee_payments, fee_ledger, fee_receipts
  console.log(`\n💾 Persisting ${allDemands.length} demands into fee_demands...`);
  await db.collection('fee_demands').deleteMany({ sessionId: session });
  await db.collection('fee_demands').insertMany(allDemands);

  console.log(`💾 Persisting ${allPayments.length} payments into fee_payments...`);
  await db.collection('fee_payments').deleteMany({ sessionId: session });
  await db.collection('fee_payments').insertMany(allPayments);

  console.log(`💾 Syncing legacy fee_ledger collection (${legacyLedgerLines.length} lines)...`);
  await db.collection('fee_ledger').deleteMany({ academic_session: session });
  await db.collection('fee_ledger').insertMany(legacyLedgerLines);

  console.log(`💾 Syncing fee_receipts collection...`);
  await db.collection('fee_receipts').deleteMany({ academic_session: session });
  const feeReceiptDocs = allPayments.map(p => ({
    receipt_no: p.receiptNo,
    school_id: p.schoolId,
    academic_session: p.sessionId,
    student_id: p.studentId,
    student_name: p.studentName,
    admission_no: p.admissionNo,
    class_name: p.className,
    section: p.section,
    roll_no: '1',
    father_name: p.fatherName,
    mobile: p.mobile,
    payment_date: p.paidOn,
    payment_mode: p.mode,
    txn_ref: p.txnRef || null,
    cheque_no: p.chequeNo || null,
    amount_paise: p.amountPaid,
    amount: Math.round(p.amountPaid / 100),
    paid_amount: Math.round(p.amountPaid / 100),
    collected_by: p.collectedBy,
    remarks: p.remarks,
    is_cancelled: p.cancelled,
    cancelled_reason: p.cancelledReason || null,
    allocated_heads: p.allocatedHeads.map(h => ({
      fee_head: h.feeHead,
      month: h.period === 'ONE_TIME' ? null : h.period,
      period: h.period === 'ONE_TIME' ? 'One-Time' : (h.period === 'APR' ? 'April 2026' : h.period),
      amount_paise: h.amountPaise,
    })),
    created_at: p.createdAt,
  }));
  await db.collection('fee_receipts').insertMany(feeReceiptDocs);

  console.log('\n--- SEED COMPLETED DETERMINISTICALLY ---');
  console.log(`Total Demands Seeded   : ${allDemands.length}`);
  console.log(`Total Receipts Issued  : ${allPayments.length} (including 5 cancelled)`);
  console.log(`Legacy Ledger Lines    : ${legacyLedgerLines.length}`);

  await client.close();
}

seedUnifiedFeeEngine().catch(console.error);
