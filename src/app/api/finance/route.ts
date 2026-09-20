/*! CBSE School ERP — Unified Finance & Fee Management API Core */
import { NextResponse } from 'next/server';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';
import { requireAuth, requireRole, resolveTenantSchoolId, ADMIN_ROLES } from '@/lib/auth-guard';
import {
  FeeHeadItem,
  ClassFeeStructure,
  StudentConcession,
  FeeReceipt,
  FinanceEntry,
  PayrollRecord
} from '@/lib/types';
import crypto from 'crypto';

// In-memory fallback stores
const memoryStore = {
  fee_heads: new Map<string, FeeHeadItem[]>(),
  class_structures: new Map<string, ClassFeeStructure[]>(),
  concessions: new Map<string, StudentConcession[]>(),
  receipts: new Map<string, FeeReceipt[]>(),
  finance_entries: new Map<string, FinanceEntry[]>(),
  payroll: new Map<string, PayrollRecord[]>()
};

// ─────────────────────────────────────────────────────────────
// OFFICIAL CBSE INSTITUTIONAL FEE STRUCTURE (SESSION 2026–27)
// ─────────────────────────────────────────────────────────────
function getDefaultFeeHeads(schoolId: string): FeeHeadItem[] {
  return [
    {
      id: `head-reg-${schoolId}`,
      school_id: schoolId,
      name: 'Prospectus + Registration Fees',
      code: 'REG',
      category: 'ACADEMIC',
      frequency: 'ONE_TIME',
      is_refundable: false,
      is_optional: false,
      default_amount: 1000,
      description: 'Prospectus, school kit, and registration charges (Non-refundable)',
      status: 'ACTIVE'
    },
    {
      id: `head-adm-${schoolId}`,
      school_id: schoolId,
      name: 'Admission Fee (Non-Refundable)',
      code: 'ADM',
      category: 'ACADEMIC',
      frequency: 'ONE_TIME',
      is_refundable: false,
      is_optional: false,
      default_amount: 5000,
      description: 'One-time admission charge upon enrollment (Non-refundable)',
      status: 'ACTIVE'
    },
    {
      id: `head-tui-${schoolId}`,
      school_id: schoolId,
      name: 'Tuition Fee (Quarterly Deposit)',
      code: 'TUI',
      category: 'ACADEMIC',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: false,
      default_amount: 1400,
      description: 'Academic tuition fee deposited quarterly (PG-UKG: ₹1000, I-II: ₹1400, III-V: ₹1600, VI-VIII: ₹1800, IX-X: ₹2000, XI-XII: ₹2400)',
      status: 'ACTIVE'
    },
    {
      id: `head-ann-${schoolId}`,
      school_id: schoolId,
      name: 'Annual Fee',
      code: 'ANN',
      category: 'ACADEMIC',
      frequency: 'ANNUALLY',
      is_refundable: false,
      is_optional: false,
      default_amount: 5000,
      description: 'Annual composite institutional fee (PG to VIII: ₹5,000/year | IX to XII: ₹6,000/year)',
      status: 'ACTIVE'
    },
    {
      id: `head-hst-sec-${schoolId}`,
      school_id: schoolId,
      name: 'Hostel Security Money (Refundable)',
      code: 'HST-SEC',
      category: 'SECURITY',
      frequency: 'ONE_TIME',
      is_refundable: true,
      is_optional: true,
      default_amount: 10000,
      description: 'Refundable security deposit for boarding scholars',
      status: 'ACTIVE'
    },
    {
      id: `head-tc-cc-${schoolId}`,
      school_id: schoolId,
      name: 'Transfer Certificate / Character Certificate',
      code: 'TC-CC',
      category: 'MISC',
      frequency: 'ONE_TIME',
      is_refundable: false,
      is_optional: true,
      default_amount: 1000,
      description: 'Transfer & Character certificate issuance processing fee',
      status: 'ACTIVE'
    },
    {
      id: `head-trn-1-3-${schoolId}`,
      school_id: schoolId,
      name: 'School Transport Fee (1 to 3 km)',
      code: 'TRN-1-3',
      category: 'TRANSPORT',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: true,
      default_amount: 800,
      description: 'Monthly school bus transport fee for 1 to 3 km distance slab (₹800/month)',
      status: 'ACTIVE'
    },
    {
      id: `head-trn-4-6-${schoolId}`,
      school_id: schoolId,
      name: 'School Transport Fee (4 to 6 km)',
      code: 'TRN-4-6',
      category: 'TRANSPORT',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: true,
      default_amount: 900,
      description: 'Monthly school bus transport fee for 4 to 6 km distance slab (₹900/month)',
      status: 'ACTIVE'
    },
    {
      id: `head-trn-7-12-${schoolId}`,
      school_id: schoolId,
      name: 'School Transport Fee (7 to 12 km)',
      code: 'TRN-7-12',
      category: 'TRANSPORT',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: true,
      default_amount: 1100,
      description: 'Monthly school bus transport fee for 7 to 12 km distance slab (₹1,100/month)',
      status: 'ACTIVE'
    },
    {
      id: `head-trn-13-16-${schoolId}`,
      school_id: schoolId,
      name: 'School Transport Fee (13 to 16 km)',
      code: 'TRN-13-16',
      category: 'TRANSPORT',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: true,
      default_amount: 1300,
      description: 'Monthly school bus transport fee for 13 to 16 km distance slab (₹1,300/month)',
      status: 'ACTIVE'
    },
    {
      id: `head-trn-16-20-${schoolId}`,
      school_id: schoolId,
      name: 'School Transport Fee (16 to 20 km)',
      code: 'TRN-16-20',
      category: 'TRANSPORT',
      frequency: 'MONTHLY',
      is_refundable: false,
      is_optional: true,
      default_amount: 1800,
      description: 'Monthly school bus transport fee for 16 to 20 km distance slab (₹1,800/month)',
      status: 'ACTIVE'
    }
  ];
}

// Helper to determine exact Tuition & Annual Fee for any standard
function getClassFeeRates(className: string): { tuitionMonthly: number; annualFee: number; isSenior: boolean } {
  const c = className.trim().toUpperCase();

  // PG, LKG, UKG, Nursery
  if (/PG|PLAY|NURSERY|LKG|UKG|KG|PRE/i.test(c)) {
    return { tuitionMonthly: 1000, annualFee: 5000, isSenior: false };
  }
  // Class I & II (1 & 2)
  if (/(CLASS\s*1\b|CLASS\s*2\b|CLASS\s*I\b|CLASS\s*II\b|^1$|^2$|^I$|^II$)/i.test(c)) {
    return { tuitionMonthly: 1400, annualFee: 5000, isSenior: false };
  }
  // Class III, IV, V (3, 4, 5)
  if (/(CLASS\s*3\b|CLASS\s*4\b|CLASS\s*5\b|CLASS\s*III\b|CLASS\s*IV\b|CLASS\s*V\b|^3$|^4$|^5$|^III$|^IV$|^V$)/i.test(c)) {
    return { tuitionMonthly: 1600, annualFee: 5000, isSenior: false };
  }
  // Class VI, VII, VIII (6, 7, 8)
  if (/(CLASS\s*6\b|CLASS\s*7\b|CLASS\s*8\b|CLASS\s*VI\b|CLASS\s*VII\b|CLASS\s*VIII\b|^6$|^7$|^8$|^VI$|^VII$|^VIII$)/i.test(c)) {
    return { tuitionMonthly: 1800, annualFee: 5000, isSenior: false };
  }
  // Class IX & X (9 & 10)
  if (/(CLASS\s*9\b|CLASS\s*10\b|CLASS\s*IX\b|CLASS\s*X\b|^9$|^10$|^IX$|^X$)/i.test(c)) {
    return { tuitionMonthly: 2000, annualFee: 6000, isSenior: true };
  }
  // Class XI & XII (XI A, XI B, XII A, XII B, 11, 12)
  if (/(CLASS\s*11|CLASS\s*12|CLASS\s*XI|CLASS\s*XII|\bXI\b|\bXII\b|^11|^12)/i.test(c)) {
    return { tuitionMonthly: 2400, annualFee: 6000, isSenior: true };
  }

  // Default fallback (Class I-II tier)
  return { tuitionMonthly: 1400, annualFee: 5000, isSenior: false };
}

// Generate complete class structures for all standard grades
function getDefaultClassStructures(schoolId: string, session: string): ClassFeeStructure[] {
  const standardClasses = [
    'PG', 'LKG', 'UKG',
    'Class I', 'Class II', 'Class III', 'Class IV', 'Class V',
    'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X',
    'XI A', 'XI B', 'XII A', 'XII B'
  ];

  const heads = getDefaultFeeHeads(schoolId);

  return standardClasses.map(cName => {
    const { tuitionMonthly, annualFee, isSenior } = getClassFeeRates(cName);
    const annualHeadCode = isSenior ? 'ANN-SR' : 'ANN-JR';

    const allocations = heads.map(h => {
      let amount = 0;
      if (h.code === 'TUI') amount = tuitionMonthly;
      else if (h.code === 'ANN' || h.code === annualHeadCode) amount = annualFee;
      else if (h.code === 'REG') amount = 1000;
      else if (h.code === 'ADM') amount = 5000;
      else amount = h.default_amount;

      return {
        head_id: h.id,
        head_name: h.name,
        head_code: h.code,
        category: h.category,
        frequency: h.frequency,
        amount
      };
    });

    return {
      id: `cfs-${cName.replace(/\s+/g, '-').toLowerCase()}-${schoolId}`,
      school_id: schoolId,
      academic_session: session,
      class_name: cName,
      stream: 'GENERAL',
      allocations,
      total_monthly_amount: tuitionMonthly,
      total_annual_amount: (tuitionMonthly * 12) + annualFee,
      updated_at: new Date().toISOString()
    };
  });
}

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const tenant = resolveTenantSchoolId(auth, searchParams.get('school_id') || searchParams.get('schoolId'));
    if (tenant instanceof NextResponse) return tenant;

    const session = searchParams.get('session') || '2026-2027';
    const db = await getDatabase();

    if (db) {
      const [heads, structures, concessions, receipts, entries, payroll] = await Promise.all([
        db.collection('fee_heads').find({ school_id: tenant }).toArray(),
        db.collection('class_fee_structures').find({ school_id: tenant, academic_session: session }).toArray(),
        db.collection('student_concessions').find({ school_id: tenant, academic_session: session }).toArray(),
        db.collection('fee_receipts').find({ school_id: tenant, academic_session: session }).sort({ created_at: -1 }).limit(500).toArray(),
        db.collection('finance_entries').find({ school_id: tenant, academic_session: session }).sort({ date: -1 }).limit(500).toArray(),
        db.collection('payroll_records').find({ school_id: tenant, academic_session: session }).sort({ month_year: -1 }).limit(500).toArray()
      ]);

      let finalHeads = heads.map(sanitizeDocNoBinary) as unknown as FeeHeadItem[];
      const hasLegacyHeads = finalHeads.some(h => h.code === 'ANN-JR' || h.code === 'ANN-SR' || h.name.includes('(PG to VIII)') || h.name.includes('(IX to XII)'));
      // Seed official 2026-27 Fee Heads if empty or contains obsolete split heads
      if (finalHeads.length === 0 || !finalHeads.some(h => h.code === 'REG') || hasLegacyHeads) {
        finalHeads = getDefaultFeeHeads(tenant);
        await db.collection('fee_heads').deleteMany({ school_id: tenant });
        await db.collection('fee_heads').insertMany(finalHeads);
      }

      let finalStructures = structures.map(sanitizeDocNoBinary) as unknown as ClassFeeStructure[];
      // Seed official 2026-27 Class Structures if empty or outdated
      if (finalStructures.length === 0 || hasLegacyHeads) {
        finalStructures = getDefaultClassStructures(tenant, session);
        await db.collection('class_fee_structures').deleteMany({ school_id: tenant, academic_session: session });
        for (const s of finalStructures) {
          await db.collection('class_fee_structures').updateOne(
            { school_id: tenant, academic_session: session, class_name: s.class_name },
            { $set: s },
            { upsert: true }
          );
        }
      }

      return NextResponse.json({
        success: true,
        fee_heads: finalHeads,
        class_structures: finalStructures,
        concessions: concessions.map(sanitizeDocNoBinary) as unknown as StudentConcession[],
        receipts: receipts.map(sanitizeDocNoBinary) as unknown as FeeReceipt[],
        finance_entries: entries.map(sanitizeDocNoBinary) as unknown as FinanceEntry[],
        payroll_records: payroll.map(sanitizeDocNoBinary) as unknown as PayrollRecord[]
      });
    }

    // Memory Store Fallback
    let memHeads = memoryStore.fee_heads.get(tenant);
    const hasLegacyMemHeads = memHeads?.some(h => h.code === 'ANN-JR' || h.code === 'ANN-SR' || h.name.includes('(PG to VIII)') || h.name.includes('(IX to XII)'));
    if (!memHeads || memHeads.length === 0 || !memHeads.some(h => h.code === 'REG') || hasLegacyMemHeads) {
      memHeads = getDefaultFeeHeads(tenant);
      memoryStore.fee_heads.set(tenant, memHeads);
    }

    const key = `${tenant}_${session}`;
    let memStructures = memoryStore.class_structures.get(key);
    if (!memStructures || memStructures.length === 0 || hasLegacyMemHeads) {
      memStructures = getDefaultClassStructures(tenant, session);
      memoryStore.class_structures.set(key, memStructures);
    }

    return NextResponse.json({
      success: true,
      fee_heads: memHeads || [],
      class_structures: memStructures || [],
      concessions: memoryStore.concessions.get(key) || [],
      receipts: memoryStore.receipts.get(key) || [],
      finance_entries: memoryStore.finance_entries.get(key) || [],
      payroll_records: memoryStore.payroll.get(key) || []
    });
  } catch (error: any) {
    console.error('[API_FINANCE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch finance records' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ADMIN_ROLES);
    if (auth instanceof NextResponse) return auth;

    const rawBody = await req.json();
    const action = rawBody.action;
    const tenant = resolveTenantSchoolId(auth, rawBody.school_id);
    if (tenant instanceof NextResponse) return tenant;

    const session = rawBody.academic_session || rawBody.session || '2026-2027';
    const db = await getDatabase();

    // ──────────────────────────────────────────
    // ACTION 1: SAVE / UPDATE FEE HEAD
    // ──────────────────────────────────────────
    if (action === 'save_fee_head') {
      const head: FeeHeadItem = {
        id: rawBody.id || `head-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        school_id: tenant,
        name: rawBody.name?.trim() || 'General Fee',
        code: rawBody.code?.trim().toUpperCase() || 'GEN',
        category: rawBody.category || 'ACADEMIC',
        frequency: rawBody.frequency || 'MONTHLY',
        is_refundable: Boolean(rawBody.is_refundable),
        is_optional: Boolean(rawBody.is_optional),
        default_amount: Number(rawBody.default_amount) || 0,
        description: rawBody.description || '',
        status: rawBody.status || 'ACTIVE',
        created_at: rawBody.created_at || new Date().toISOString()
      };

      if (db) {
        await db.collection('fee_heads').updateOne(
          { id: head.id, school_id: tenant },
          { $set: head },
          { upsert: true }
        );
      } else {
        const list = memoryStore.fee_heads.get(tenant) || [];
        const idx = list.findIndex(h => h.id === head.id);
        if (idx >= 0) list[idx] = head;
        else list.push(head);
        memoryStore.fee_heads.set(tenant, list);
      }

      return NextResponse.json({ success: true, message: 'Fee Head saved successfully', head });
    }

    // ──────────────────────────────────────────
    // ACTION 2: DELETE FEE HEAD
    // ──────────────────────────────────────────
    if (action === 'delete_fee_head') {
      const headId = rawBody.id;
      if (db) {
        await db.collection('fee_heads').deleteOne({ id: headId, school_id: tenant });
      } else {
        const list = (memoryStore.fee_heads.get(tenant) || []).filter(h => h.id !== headId);
        memoryStore.fee_heads.set(tenant, list);
      }
      return NextResponse.json({ success: true, message: 'Fee Head deleted' });
    }

    // ──────────────────────────────────────────
    // ACTION 3: SAVE / UPDATE CLASS FEE STRUCTURE
    // ──────────────────────────────────────────
    if (action === 'save_class_structure') {
      const structure: ClassFeeStructure = {
        id: rawBody.id || `cfs-${rawBody.class_name?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        school_id: tenant,
        academic_session: session,
        class_name: rawBody.class_name,
        stream: rawBody.stream || 'GENERAL',
        allocations: rawBody.allocations || [],
        total_monthly_amount: Number(rawBody.total_monthly_amount) || 0,
        total_annual_amount: Number(rawBody.total_annual_amount) || 0,
        updated_at: new Date().toISOString()
      };

      if (db) {
        await db.collection('class_fee_structures').updateOne(
          { school_id: tenant, academic_session: session, class_name: structure.class_name },
          { $set: structure },
          { upsert: true }
        );
      } else {
        const key = `${tenant}_${session}`;
        const list = memoryStore.class_structures.get(key) || [];
        const idx = list.findIndex(s => s.class_name === structure.class_name);
        if (idx >= 0) list[idx] = structure;
        else list.push(structure);
        memoryStore.class_structures.set(key, list);
      }

      return NextResponse.json({ success: true, message: 'Class Fee Structure saved', structure });
    }

    // ──────────────────────────────────────────
    // ACTION 4: SAVE STUDENT CONCESSION
    // ──────────────────────────────────────────
    if (action === 'save_concession') {
      const concession: StudentConcession = {
        id: rawBody.id || `cnc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        school_id: tenant,
        student_id: rawBody.student_id,
        student_name: rawBody.student_name,
        admission_no: rawBody.admission_no,
        class_name: rawBody.class_name,
        academic_session: session,
        concession_type: rawBody.concession_type || 'SPECIAL',
        discount_mode: rawBody.discount_mode || 'PERCENTAGE',
        discount_value: Number(rawBody.discount_value) || 0,
        applicable_heads: rawBody.applicable_heads || ['ALL'],
        approved_by: rawBody.approved_by || 'Principal',
        reason: rawBody.reason || '',
        created_at: new Date().toISOString()
      };

      if (db) {
        await db.collection('student_concessions').updateOne(
          { school_id: tenant, student_id: concession.student_id, academic_session: session },
          { $set: concession },
          { upsert: true }
        );
      } else {
        const key = `${tenant}_${session}`;
        const list = memoryStore.concessions.get(key) || [];
        const idx = list.findIndex(c => c.student_id === concession.student_id);
        if (idx >= 0) list[idx] = concession;
        else list.push(concession);
        memoryStore.concessions.set(key, list);
      }

      return NextResponse.json({ success: true, message: 'Concession saved', concession });
    }

    // ──────────────────────────────────────────
    // ACTION 5: DELETE CONCESSION
    // ──────────────────────────────────────────
    if (action === 'delete_concession') {
      const concessionId = rawBody.id;
      if (db) {
        await db.collection('student_concessions').deleteOne({ id: concessionId, school_id: tenant });
      } else {
        const key = `${tenant}_${session}`;
        const list = (memoryStore.concessions.get(key) || []).filter(c => c.id !== concessionId);
        memoryStore.concessions.set(key, list);
      }
      return NextResponse.json({ success: true, message: 'Concession removed' });
    }

    // ──────────────────────────────────────────
    // ACTION 6: COLLECT FEE & GENERATE RECEIPT
    // ──────────────────────────────────────────
    if (action === 'collect_fee') {
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const receipt: FeeReceipt = {
        id: `rcp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        receipt_no: receiptNo,
        school_id: tenant,
        academic_session: session,
        student_id: rawBody.student_id,
        student_name: rawBody.student_name,
        admission_no: rawBody.admission_no,
        roll_no: rawBody.roll_no,
        class_name: rawBody.class_name,
        section: rawBody.section || 'A',
        father_name: rawBody.father_name || '',
        phone: rawBody.phone || '',
        payment_date: rawBody.payment_date || new Date().toISOString().split('T')[0],
        months_covered: rawBody.months_covered || [],
        lines: rawBody.lines || [],
        subtotal: Number(rawBody.subtotal) || 0,
        discount_total: Number(rawBody.discount_total) || 0,
        late_fine: Number(rawBody.late_fine) || 0,
        total_paid: Number(rawBody.total_paid) || 0,
        payment_mode: rawBody.payment_mode || 'CASH',
        transaction_ref: rawBody.transaction_ref || '',
        bank_name: rawBody.bank_name || '',
        collected_by: rawBody.collected_by || 'Accounts Counter',
        remarks: rawBody.remarks || '',
        created_at: new Date().toISOString()
      };

      // Also create an auto-synced Finance Income Entry
      const incomeEntry: FinanceEntry = {
        id: `inc-fee-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        school_id: tenant,
        academic_session: session,
        entry_type: 'INCOME',
        category: 'FEE_COLLECTION',
        voucher_no: `VOU-${receiptNo}`,
        date: receipt.payment_date,
        amount: receipt.total_paid,
        payment_mode: receipt.payment_mode === 'UPI_QR' ? 'UPI' : (receipt.payment_mode as any),
        account_name: receipt.payment_mode === 'CASH' ? 'Cash Counter' : 'Fee Collection Bank A/c',
        party_name: `${receipt.student_name} (${receipt.class_name}-${receipt.section})`,
        description: `Fee Collection for ${receipt.months_covered.join(', ')} — Receipt #${receipt.receipt_no}`,
        reference_no: receipt.receipt_no,
        created_by: receipt.collected_by,
        created_at: new Date().toISOString()
      };

      if (db) {
        await db.collection('fee_receipts').insertOne(receipt);
        await db.collection('finance_entries').insertOne(incomeEntry);
      } else {
        const key = `${tenant}_${session}`;
        const rList = memoryStore.receipts.get(key) || [];
        rList.unshift(receipt);
        memoryStore.receipts.set(key, rList);

        const eList = memoryStore.finance_entries.get(key) || [];
        eList.unshift(incomeEntry);
        memoryStore.finance_entries.set(key, eList);
      }

      return NextResponse.json({ success: true, message: 'Fee collected successfully!', receipt });
    }

    // ──────────────────────────────────────────
    // ACTION 7: SAVE FINANCE ENTRY (INCOME/EXPENSE)
    // ──────────────────────────────────────────
    if (action === 'save_finance_entry') {
      const voucherNo = rawBody.voucher_no || `VOU-${Date.now().toString().slice(-6)}`;
      const entry: FinanceEntry = {
        id: rawBody.id || `ent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        school_id: tenant,
        academic_session: session,
        entry_type: rawBody.entry_type || 'EXPENSE',
        category: rawBody.category || 'MISC_EXPENSE',
        voucher_no: voucherNo,
        date: rawBody.date || new Date().toISOString().split('T')[0],
        amount: Number(rawBody.amount) || 0,
        payment_mode: rawBody.payment_mode || 'CASH',
        account_name: rawBody.account_name || 'Cash Counter',
        party_name: rawBody.party_name?.trim() || 'Counter Party',
        description: rawBody.description?.trim() || '',
        reference_no: rawBody.reference_no || '',
        approved_by: rawBody.approved_by || 'Principal',
        created_by: rawBody.created_by || 'Accountant',
        created_at: new Date().toISOString()
      };

      if (db) {
        await db.collection('finance_entries').updateOne(
          { id: entry.id, school_id: tenant },
          { $set: entry },
          { upsert: true }
        );
      } else {
        const key = `${tenant}_${session}`;
        const list = memoryStore.finance_entries.get(key) || [];
        const idx = list.findIndex(e => e.id === entry.id);
        if (idx >= 0) list[idx] = entry;
        else list.unshift(entry);
        memoryStore.finance_entries.set(key, list);
      }

      return NextResponse.json({ success: true, message: 'Finance entry recorded', entry });
    }

    // ──────────────────────────────────────────
    // ACTION 8: DELETE FINANCE ENTRY
    // ──────────────────────────────────────────
    if (action === 'delete_finance_entry') {
      const entryId = rawBody.id;
      if (db) {
        await db.collection('finance_entries').deleteOne({ id: entryId, school_id: tenant });
      } else {
        const key = `${tenant}_${session}`;
        const list = (memoryStore.finance_entries.get(key) || []).filter(e => e.id !== entryId);
        memoryStore.finance_entries.set(key, list);
      }
      return NextResponse.json({ success: true, message: 'Entry deleted' });
    }

    // ──────────────────────────────────────────
    // ACTION 9: GENERATE / UPDATE PAYROLL
    // ──────────────────────────────────────────
    if (action === 'save_payroll_record') {
      const record: PayrollRecord = {
        id: rawBody.id || `pay-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        school_id: tenant,
        academic_session: session,
        month_year: rawBody.month_year || 'APR_2026',
        teacher_id: rawBody.teacher_id,
        staff_name: rawBody.staff_name,
        designation: rawBody.designation || 'Faculty',
        department: rawBody.department || 'Academics',
        bank_account_no: rawBody.bank_account_no || '',
        bank_ifsc: rawBody.bank_ifsc || '',
        basic_pay: Number(rawBody.basic_pay) || 0,
        hra: Number(rawBody.hra) || 0,
        da: Number(rawBody.da) || 0,
        special_allowance: Number(rawBody.special_allowance) || 0,
        gross_salary: Number(rawBody.gross_salary) || 0,
        pf_deduction: Number(rawBody.pf_deduction) || 0,
        esi_deduction: Number(rawBody.esi_deduction) || 0,
        tds_deduction: Number(rawBody.tds_deduction) || 0,
        advance_deduction: Number(rawBody.advance_deduction) || 0,
        total_deductions: Number(rawBody.total_deductions) || 0,
        net_salary: Number(rawBody.net_salary) || 0,
        status: rawBody.status || 'GENERATED',
        disbursement_date: rawBody.disbursement_date,
        payment_mode: rawBody.payment_mode || 'BANK_TRANSFER',
        transaction_ref: rawBody.transaction_ref,
        created_at: new Date().toISOString()
      };

      if (db) {
        await db.collection('payroll_records').updateOne(
          { school_id: tenant, academic_session: session, teacher_id: record.teacher_id, month_year: record.month_year },
          { $set: record },
          { upsert: true }
        );
      } else {
        const key = `${tenant}_${session}`;
        const list = memoryStore.payroll.get(key) || [];
        const idx = list.findIndex(p => p.teacher_id === record.teacher_id && p.month_year === record.month_year);
        if (idx >= 0) list[idx] = record;
        else list.push(record);
        memoryStore.payroll.set(key, list);
      }

      return NextResponse.json({ success: true, message: 'Payroll record saved', record });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_FINANCE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error processing finance action' }, { status: 500 });
  }
}
