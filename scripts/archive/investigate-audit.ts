import { getDatabase } from '../src/lib/mongodb';

async function investigate() {
  const db = await getDatabase();
  
  // 1. Inspect Student Schema & Admission Dates
  const students = await db.collection('students').find({}).toArray();
  console.log(`Total students: ${students.length}`);
  
  const admDateFields: Record<string, number> = {};
  const sessions: Record<string, number> = {};
  const admissionYears: Record<string, number> = {};
  
  for (const s of students) {
    const sDoc = s as any;
    if (sDoc.admissionDate) {
      const yr = new Date(sDoc.admissionDate).getFullYear();
      admissionYears[yr] = (admissionYears[yr] || 0) + 1;
    } else {
      admissionYears['none'] = (admissionYears['none'] || 0) + 1;
    }
    
    if (sDoc.session) sessions[sDoc.session] = (sessions[sDoc.session] || 0) + 1;
    if (sDoc.joinedSession) sessions['joined_' + sDoc.joinedSession] = (sessions['joined_' + sDoc.joinedSession] || 0) + 1;
  }
  
  console.log('Admission years breakdown:', admissionYears);
  console.log('Sessions breakdown:', sessions);
  console.log('Sample student keys:', Object.keys(students[0] || {}));
  console.log('Sample student:', {
    name: students[0].name,
    admissionNo: students[0].admissionNo,
    admissionDate: students[0].admissionDate,
    createdAt: (students[0] as any).createdAt,
    session: (students[0] as any).session,
    enrollmentStatus: (students[0] as any).enrollmentStatus || (students[0] as any).status
  });

  // 2. Check Admission & Registration fee demands
  const admDemands = await db.collection('fee_demands').find({
    feeHeadCode: { $in: ['ADMISSION', 'REGISTRATION', 'ADMISSION_FEE'] }
  }).toArray();
  console.log(`Admission/Registration demands count: ${admDemands.length}`);
  const admTotalBilled = admDemands.reduce((sum, d: any) => sum + (d.netAmount || 0), 0);
  const admTotalPaid = admDemands.reduce((sum, d: any) => sum + (d.paidAmount || 0), 0);
  console.log(`Admission Demands Billed: ₹${admTotalBilled / 100}, Paid: ₹${admTotalPaid / 100}, Pending: ₹${(admTotalBilled - admTotalPaid) / 100}`);

  // 3. Check Advance / Overpayment: find students where paid > due to date
  const now = new Date('2026-09-20T23:59:59.999Z');
  const allDemands = await db.collection('fee_demands').find({ session: '2026-2027' }).toArray();
  const allReceipts = await db.collection('fee_receipts').find({
    session: '2026-2027',
    status: { $ne: 'CANCELLED' }
  }).toArray();
  
  const studentMap: Record<string, { name: string; admNo: string; demandsDue: number; demandsPaid: number; totalReceipts: number; demands: any[] }> = {};
  for (const s of students) {
    studentMap[s._id.toString()] = {
      name: s.name,
      admNo: s.admissionNo,
      demandsDue: 0,
      demandsPaid: 0,
      totalReceipts: 0,
      demands: []
    };
  }
  
  for (const d of allDemands as any[]) {
    const sId = d.studentId?.toString();
    if (!studentMap[sId]) continue;
    const isDue = new Date(d.dueDate) <= now;
    if (isDue) {
      studentMap[sId].demandsDue += d.netAmount || 0;
      studentMap[sId].demandsPaid += d.paidAmount || 0;
    }
    studentMap[sId].demands.push(d);
  }
  
  for (const r of allReceipts as any[]) {
    const sId = r.studentId?.toString();
    if (!studentMap[sId]) continue;
    studentMap[sId].totalReceipts += r.paidAmount || r.amount || 0;
  }
  
  const creditStudents: any[] = [];
  for (const [sId, data] of Object.entries(studentMap)) {
    const diff = data.totalReceipts - data.demandsDue;
    if (diff > 0) {
      creditStudents.push({ sId, ...data, diff });
    }
  }
  console.log(`Found ${creditStudents.length} students with credit / advance:`);
  for (const cs of creditStudents) {
    console.log(` - ${cs.name} (${cs.admNo}): Receipts=₹${cs.totalReceipts/100}, DueToDate=₹${cs.demandsDue/100}, Credit=₹${cs.diff/100}`);
  }

  // 4. Inspect Month-wise Class-wise Collection 18 rows
  const monthClassAgg = await db.collection('fee_demands').aggregate([
    { $match: { session: '2026-2027' } },
    { $group: { _id: { className: '$className', classSection: '$classSection' }, count: { $sum: 1 } } },
    { $sort: { '_id.className': 1, '_id.classSection': 1 } }
  ]).toArray();
  console.log(`Month-class distinct classes in fee_demands: ${monthClassAgg.length}`);
  console.log(monthClassAgg);
  
  // 5. Check Concessions
  const concessions = await db.collection('fee_concessions').find({ session: '2026-2027' }).toArray();
  console.log(`Fee concessions in DB: ${concessions.length}`);
  if (concessions.length > 0) {
    console.log('Sample concession:', concessions[0]);
  }
  
  // 6. Check Transport and Hostel
  const transportAlloc = await db.collection('transport_allocations').find({}).toArray();
  const hostelAlloc = await db.collection('hostel_allocations').find({}).toArray();
  console.log(`Transport allocations: ${transportAlloc.length}, Hostel allocations: ${hostelAlloc.length}`);
}

investigate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
