/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { NextResponse } from 'next/server';
import { checkMongoStatus, getDatabase } from '@/lib/mongodb';
import { Database } from '@/lib/db';
import { requireAuth, requireRole, AGENCY_ONLY } from '@/lib/auth-guard';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const status = await checkMongoStatus();
    let cloudCounts = { schools: 0, students: 0, teachers: 0, classes: 0, attendance: 0, fee_invoices: 0, notices: 0 };
    
    if (status.connected) {
      try {
        const db = await getDatabase();
        if (db) {
          const [schools, students, teachers, classes, attendance, fee_invoices, notices] = await Promise.all([
            db.collection('schools').countDocuments(),
            db.collection('students').countDocuments(),
            db.collection('teachers').countDocuments(),
            db.collection('classes').countDocuments(),
            db.collection('attendance').countDocuments(),
            db.collection('fee_invoices').countDocuments(),
            db.collection('notices').countDocuments()
          ]);
          cloudCounts = { schools, students, teachers, classes, attendance, fee_invoices, notices };
        }
      } catch (e) {}
    }

    const localStudents = await Database.getStudents('DPS2026');
    const localTeachers = await Database.getTeachers('DPS2026');
    const localClasses = await Database.getClasses('DPS2026');
    const localAttendance = await Database.getAttendance('DPS2026');
    const localInvoices = await Database.getFeeInvoices('DPS2026');
    const localNotices = await Database.getNotices('DPS2026');

    return NextResponse.json({
      success: true,
      mongoStatus: status,
      cloudCounts,
      localCounts: {
        students: localStudents.length,
        teachers: localTeachers.length,
        classes: localClasses.length,
        attendance: localAttendance.length,
        fee_invoices: localInvoices.length,
        notices: localNotices.length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload / Sync all Local Data to MongoDB Atlas
export async function POST(req: Request) {
  try {
    const auth = requireRole(req, AGENCY_ONLY);
    if (auth instanceof NextResponse) return auth;
    const db = await getDatabase();
    if (!db) {
      const status = await checkMongoStatus();
      return NextResponse.json({
        success: false,
        error: status.error || 'Cannot connect to MongoDB Atlas. Check your Network Access whitelist in MongoDB Atlas console.'
      }, { status: 503 });
    }

    const schools = await Database.getSchools();
    const students = await Database.getStudents();
    const teachers = await Database.getTeachers();
    const classes = await Database.getClasses();
    const attendance = await Database.getAttendance();
    const fee_invoices = await Database.getFeeInvoices();
    const notices = await Database.getNotices();

    function cleanDoc(doc: any) {
      if (!doc) return doc;
      const { _id, ...rest } = doc;
      if (!rest.academic_session) {
        rest.academic_session = '2026-27';
      }
      return rest;
    }

    const results: any = {};

    // Upload Schools
    if (schools.length > 0) {
      const ops = schools.map(s => ({
        updateOne: { filter: { id: s.id }, update: { $set: cleanDoc(s) }, upsert: true }
      }));
      const res = await db.collection('schools').bulkWrite(ops);
      results.schools = res.upsertedCount + res.modifiedCount;
    }

    // Upload Students
    if (students.length > 0) {
      const ops = students.map(s => ({
        updateOne: { filter: { id: s.id }, update: { $set: cleanDoc(s) }, upsert: true }
      }));
      const res = await db.collection('students').bulkWrite(ops);
      results.students = res.upsertedCount + res.modifiedCount;
    }

    // Upload Teachers
    if (teachers.length > 0) {
      const ops = teachers.map(t => ({
        updateOne: { filter: { id: t.id }, update: { $set: cleanDoc(t) }, upsert: true }
      }));
      const res = await db.collection('teachers').bulkWrite(ops);
      results.teachers = res.upsertedCount + res.modifiedCount;
    }

    // Upload Classes
    if (classes.length > 0) {
      const ops = classes.map(c => ({
        updateOne: { filter: { id: c.id }, update: { $set: cleanDoc(c) }, upsert: true }
      }));
      const res = await db.collection('classes').bulkWrite(ops);
      results.classes = res.upsertedCount + res.modifiedCount;
    }

    // Upload Attendance
    if (attendance.length > 0) {
      const ops = attendance.map(a => ({
        updateOne: { filter: { id: a.id }, update: { $set: cleanDoc(a) }, upsert: true }
      }));
      const res = await db.collection('attendance').bulkWrite(ops);
      results.attendance = res.upsertedCount + res.modifiedCount;
    }

    // Upload Invoices
    if (fee_invoices.length > 0) {
      const ops = fee_invoices.map(f => ({
        updateOne: { filter: { id: f.id }, update: { $set: cleanDoc(f) }, upsert: true }
      }));
      const res = await db.collection('fee_invoices').bulkWrite(ops);
      results.fee_invoices = res.upsertedCount + res.modifiedCount;
    }

    // Upload Notices
    if (notices.length > 0) {
      const ops = notices.map(n => ({
        updateOne: { filter: { id: n.id }, update: { $set: cleanDoc(n) }, upsert: true }
      }));
      const res = await db.collection('notices').bulkWrite(ops);
      results.notices = res.upsertedCount + res.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${students.length} students, ${teachers.length} teachers, ${classes.length} classes to MongoDB Atlas!`,
      results
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
