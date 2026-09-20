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

const MONTH_SCHEDULE = [
  { key: 'APR', label: 'April 2026', due: '2026-04-15' },
  { key: 'MAY', label: 'May 2026', due: '2026-05-15' },
  { key: 'JUN', label: 'June 2026', due: '2026-05-15' },
  { key: 'JUL', label: 'July 2026', due: '2026-07-15' },
  { key: 'AUG', label: 'August 2026', due: '2026-08-15' },
  { key: 'SEP', label: 'September 2026', due: '2026-09-15' },
  { key: 'OCT', label: 'October 2026', due: '2026-10-15' },
  { key: 'NOV', label: 'November 2026', due: '2026-11-15' },
  { key: 'DEC', label: 'December 2026', due: '2026-12-15' },
  { key: 'JAN', label: 'January 2027', due: '2027-01-15' },
  { key: 'FEB', label: 'February 2027', due: '2027-02-15' },
  { key: 'MAR', label: 'March 2027', due: '2027-03-15' },
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
  // Only students explicitly marked with admission_type === 'NEW' or admission_no === 'ADM-0556' receive one-time admission/registration charges.
  const isNewAdmission = student.admission_type === 'NEW' || student.admission_no === 'ADM-0556';

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

  // 1. Annual Fee (Charged in April)
  if (!isRte) {
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

  // 2. One-Time Charges (Admission & Registration) — ONLY FOR NEW ADMISSIONS
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
      dueDate: '2026-04-01',
      createdAt: now,
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
      dueDate: '2026-04-01',
      createdAt: now,
    });
  }

  // 3. 12 Academic Months (Tuition, Transport, Hostel, Exams)
  for (const m of MONTH_SCHEDULE) {
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
        createdAt: now,
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
        createdAt: now,
      });
    }

    // Hostel Demand
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
    if (m.key === 'JUL' && !isRte) {
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
        createdAt: now,
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
          grossAmount: 150000,
          discountAmount: 0,
          discountReason: null,
          netAmount: 150000,
          dueDate: m.due,
          createdAt: now,
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
        dueDate: m.due,
        createdAt: now,
      });
    }
  }

  return demands;
}

const PAYMENT_MODES = ['UPI', 'CASH', 'UPI', 'ONLINE', 'CHEQUE', 'UPI', 'CASH'];

async function seedUnifiedFeeEngine() {
  console.log('⚡ Starting Enhanced Fee Seed (Realistic Allocations, Cancelled Receipts, Manual Concessions)...');
  const client = new MongoClient(envUri);
  await client.connect();
  const db = client.db('edugit');

  const session = '2026-27';
  const schoolId = 'DPS2026';

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

  // 5 Explicit Manual Concessions
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

    // 2. Realistic Cohort Distribution
    // 0 to 67   (~68%): Fully Paid Apr–Aug
    // 68 to 82  (~15%): Partially Paid
    // 83 to 89  (~7%) : Annual Fee Defaulters
    // 90 to 99  (~10%): Never Paid / Complete Defaulters (86 students)
    const cohortVal = (idx * 43 + 17) % 100;
    const isNeverPaid = cohortVal >= 90;
    const isAnnualDefaulter = cohortVal >= 83 && cohortVal < 90;
    const isPartial = cohortVal >= 68 && cohortVal < 83;
    const isAdvance = idx === 3 || idx === 7 || idx === 12; // 3 explicit advance payers
    const isRegularPaid = !isNeverPaid && !isAnnualDefaulter && !isPartial;

    // Payment 1: April Slot
    if (!isNeverPaid && !isAnnualDefaulter) {
      receiptCounter++;
      const aprRecNo = `DPS2-REC-2604-${String(receiptCounter).padStart(4, '0')}`;
      const aprDate = `2026-04-${String(5 + (idx % 8)).padStart(2, '0')}`;
      const mode = PAYMENT_MODES[idx % PAYMENT_MODES.length];

      const aprDemands = studentDemands.filter(d => 
        d.period === 'APR' || (d.period === 'ONE_TIME' && s.admission_type === 'NEW')
      );

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
          remarks: 'April Academic Fee & Annual Charges',
          cancelled: false,
          createdAt: `${aprDate}T10:00:00.000Z`,
        });
      }
    }

    // Payment 2: May - June Slot
    if (isRegularPaid || isAdvance || (isPartial && idx % 2 === 0)) {
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
    if (isRegularPaid || isAdvance) {
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
    if (isRegularPaid || isAdvance) {
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

    // Advance Payments: Future Slots (OCT, NOV, DEC) for Advance Cohort
    if (isAdvance) {
      receiptCounter++;
      const advRecNo = `DPS2-REC-2609-ADV-${String(receiptCounter).padStart(4, '0')}`;
      const advDate = `2026-09-${String(2 + (idx % 5)).padStart(2, '0')}`;
      const mode = 'ONLINE';

      const futureDemands = studentDemands.filter(d => d.period === 'OCT' || d.period === 'NOV');
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

  // Preserve Anand Shukla's explicit payments
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

    allPayments.push({
      id: `PAY-${anand.id}-TRANSPORT-JUL-REC483760`,
      receiptNo: 'DPS2-REC-483760-813',
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
        { feeHead: 'TRANSPORT', period: 'JUL', amountPaise: 80000 },
      ],
      amountPaid: 80000,
      mode: 'UPI',
      paidOn: '2026-09-20',
      collectedBy: 'admin',
      remarks: 'Fee payment for July 2026 (TRANSPORT)',
      cancelled: false,
      createdAt: '2026-09-20T10:51:24.136Z',
    });
  }

  // 5 Explicit CANCELLED Receipts for Testing Cancellation Workflows
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

  console.log('\n--- SEED COMPLETED SUCCESSFULLY ---');
  console.log(`Total Demands Seeded   : ${allDemands.length}`);
  console.log(`Total Receipts Issued  : ${allPayments.length} (including 5 cancelled)`);
  console.log(`Legacy Ledger Lines    : ${legacyLedgerLines.length}`);

  await client.close();
}

seedUnifiedFeeEngine().catch(console.error);
