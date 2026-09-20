import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { requireAuth, resolveTenantSchoolId } from '@/lib/auth-guard';
import { getDatabase, sanitizeDocNoBinary } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim().toLowerCase();
    const tenantResult = resolveTenantSchoolId(auth, searchParams.get('schoolId') || searchParams.get('school_id'));
    if (tenantResult instanceof NextResponse) return tenantResult;
    const schoolId = tenantResult;

    if (!q) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    let students: any[] = [];

    // Try MongoDB Search
    const db = await getDatabase();
    if (db) {
      const regex = new RegExp(q, 'i');
      const docs = await db.collection('students').find({
        $and: [
          { $or: [{ school_id: schoolId }, { schoolId: schoolId }] },
          {
            $or: [
              { full_name: { $regex: regex } },
              { name: { $regex: regex } },
              { admission_no: { $regex: regex } },
              { admissionNo: { $regex: regex } },
              { roll_no: { $regex: regex } },
              { rollNo: { $regex: regex } },
              { class_name: { $regex: regex } },
              { className: { $regex: regex } }
            ]
          }
        ]
      }).limit(20).toArray();

      students = docs.map(sanitizeDocNoBinary).map((s: any) => ({
        _id: s._id || s.id,
        id: s.id || s._id,
        name: s.full_name || s.name || 'Student',
        admissionNo: s.admission_no || s.admissionNo || '',
        rollNo: s.roll_no || s.rollNo || '',
        class: s.class_name || s.className || '',
        className: s.class_name || s.className || '',
        section: s.section || 'A',
        schoolId: s.school_id || s.schoolId || schoolId,
        phone: s.guardian_phone || s.phone || '',
        fatherName: s.father_name || s.fatherName || ''
      }));
    }

    // Fallback in-memory database
    if (students.length === 0) {
      const allStudents = await Database.getStudents(schoolId);
      const filtered = allStudents.filter((s: any) => {
        const name = (s.full_name || s.name || '').toLowerCase();
        const adm = (s.admission_no || s.admissionNo || '').toLowerCase();
        const roll = String(s.roll_no || s.rollNo || '').toLowerCase();
        const cls = (s.class_name || s.className || '').toLowerCase();
        return name.includes(q) || adm.includes(q) || roll.includes(q) || cls.includes(q);
      });

      students = filtered.slice(0, 20).map((s: any) => ({
        _id: s.id || s._id,
        id: s.id || s._id,
        name: s.full_name || s.name || 'Student',
        admissionNo: s.admission_no || s.admissionNo || '',
        rollNo: s.roll_no || s.rollNo || '',
        class: s.class_name || s.className || '',
        className: s.class_name || s.className || '',
        section: s.section || 'A',
        schoolId: s.school_id || s.schoolId || schoolId,
        phone: s.guardian_phone || s.phone || '',
        fatherName: s.father_name || s.fatherName || ''
      }));
    }

    return NextResponse.json({ success: true, count: students.length, data: students });
  } catch (error: any) {
    console.error('[API Students Search Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
