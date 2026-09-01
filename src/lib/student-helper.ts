import { Student, FeeInvoice, AttendanceRecord } from '@/lib/types';

export function normalizeName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|dr\.|prof\.|shri|smt|master)\s*/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

export function getCleanPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

/**
 * Returns all detected siblings for a given student in the school directory.
 * Matches when Father AND Mother name match, or normalized Father/Guardian name + Phone match.
 */
export function getStudentSiblings(targetStudent: Student, allStudents: Student[]): Student[] {
  if (!targetStudent || !Array.isArray(allStudents)) return [];

  const targetFather = normalizeName(targetStudent.father_name || targetStudent.guardian_name);
  const targetMother = normalizeName(targetStudent.mother_name);
  const targetPhone = getCleanPhone(targetStudent.guardian_phone || targetStudent.phone);

  return allStudents.filter(s => {
    if (s.id === targetStudent.id || s.admission_no === targetStudent.admission_no) return false;

    const sFather = normalizeName(s.father_name || s.guardian_name);
    const sMother = normalizeName(s.mother_name);
    const sPhone = getCleanPhone(s.guardian_phone || s.phone);

    // Rule 1: Father AND Mother match
    if (targetFather && sFather && targetFather === sFather) {
      if (targetMother && sMother && targetMother === sMother) return true;
      if (!targetMother || !sMother) return true;
      if (targetMother === sMother) return true;
    }

    // Rule 2: Father match AND phone match
    if (targetFather && sFather && targetFather === sFather) {
      if (targetPhone && sPhone && targetPhone === sPhone) return true;
    }

    // Rule 3: Mother match AND phone match
    if (targetMother && sMother && targetMother === sMother) {
      if (targetPhone && sPhone && targetPhone === sPhone) return true;
    }

    // Rule 4: Guardian phone matches and last name / surname matches
    if (targetPhone && sPhone && targetPhone === sPhone && targetPhone.length >= 10) {
      const targetLast = (targetStudent.full_name || '').trim().split(' ').pop()?.toLowerCase();
      const sLast = (s.full_name || '').trim().split(' ').pop()?.toLowerCase();
      if (targetLast && sLast && targetLast === sLast && targetLast.length > 2) {
        return true;
      }
    }

    // Rule 5: Same Father name + Same Surname
    if (targetFather && sFather && targetFather === sFather && targetFather.length > 3) {
      const targetLast = (targetStudent.full_name || '').trim().split(' ').pop()?.toLowerCase();
      const sLast = (s.full_name || '').trim().split(' ').pop()?.toLowerCase();
      if (targetLast && sLast && targetLast === sLast) {
        return true;
      }
    }

    return false;
  });
}

export interface SiblingGroup {
  id: string;
  familyName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
  students: Student[];
  totalDues: number;
  allFeesPaid: boolean;
}

/**
 * Clusters all students into Sibling / Family Groups
 */
export function getAllSiblingGroups(students: Student[], invoices: FeeInvoice[] = []): SiblingGroup[] {
  if (!Array.isArray(students)) return [];

  const visitedIds = new Set<string>();
  const groups: SiblingGroup[] = [];

  students.forEach(student => {
    if (visitedIds.has(student.id)) return;

    const siblings = getStudentSiblings(student, students);
    if (siblings.length > 0) {
      const cluster = [student, ...siblings];
      cluster.forEach(s => visitedIds.add(s.id));

      const father = student.father_name || student.guardian_name || 'Guardian';
      const mother = student.mother_name || '';
      const phone = student.guardian_phone || student.phone || 'N/A';
      const email = student.guardian_email || student.email || '';
      const address = student.residential_address || student.address || 'New Delhi';

      const familySurname = (student.full_name || '').trim().split(' ').pop() || 'Family';
      const familyName = `${familySurname} Household (${cluster.length} Scholars)`;

      // Calculate family fee dues
      let totalDues = 0;
      cluster.forEach(s => {
        const studentInvoices = invoices.filter(inv => inv.student_id === s.id || inv.admission_no === s.admission_no);
        const unpaid = studentInvoices.filter(inv => inv.status !== 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        totalDues += unpaid;
        if (s.fee_status !== 'PAID' && unpaid === 0) {
          totalDues += 12000;
        }
      });

      groups.push({
        id: `fam-${student.id}`,
        familyName,
        fatherName: father,
        motherName: mother,
        phone,
        email,
        address,
        students: cluster,
        totalDues,
        allFeesPaid: totalDues === 0
      });
    }
  });

  return groups;
}

export interface StudentAssessmentReport {
  term: string;
  subjects: {
    subject: string;
    maxMarks: number;
    obtainedMarks: number;
    grade: string;
  }[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  remarks: string;
}

/**
 * Generates realistic CBSE Assessment Report for a student based on admission number
 */
export function getStudentAssessmentReport(student: Student): StudentAssessmentReport {
  const seed = (student.admission_no || student.id || '101')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const isSenior = (student.class_name || '').includes('11') || (student.class_name || '').includes('12');
  const isMiddle = (student.class_name || '').includes('9') || (student.class_name || '').includes('10');

  const subjectList = isSenior
    ? ['Physics', 'Chemistry', 'Mathematics', 'English Core', 'Computer Science']
    : isMiddle
    ? ['Mathematics', 'Science & Tech', 'English Language', 'Social Science', 'Hindi Course-A', 'Artificial Intelligence']
    : ['Mathematics', 'Environmental Studies', 'English', 'Hindi', 'General Knowledge', 'Computer Science'];

  let totalMax = 0;
  let totalObtained = 0;

  const subjects = subjectList.map((subject, idx) => {
    const baseVal = 70 + ((seed + idx * 13) % 28);
    const marks = Math.min(99, Math.max(62, baseVal));
    totalMax += 100;
    totalObtained += marks;

    let grade = 'A1';
    if (marks < 91 && marks >= 81) grade = 'A2';
    else if (marks < 81 && marks >= 71) grade = 'B1';
    else if (marks < 71 && marks >= 61) grade = 'B2';
    else if (marks < 61) grade = 'C1';

    return {
      subject,
      maxMarks: 100,
      obtainedMarks: marks,
      grade
    };
  });

  const percentage = Math.round((totalObtained / totalMax) * 1000) / 10;
  let overallGrade = 'A1';
  if (percentage < 91 && percentage >= 81) overallGrade = 'A2';
  else if (percentage < 81 && percentage >= 71) overallGrade = 'B1';
  else if (percentage < 71) overallGrade = 'B2';

  let remarks = 'Outstanding academic performance with exceptional analytical mastery.';
  if (percentage < 85 && percentage >= 75) remarks = 'Consistently good academic discipline and active classroom participation.';
  else if (percentage < 75) remarks = 'Satisfactory progress. Recommended for additional guided practice in core numerical concepts.';

  return {
    term: 'Term-1 Summative Assessment (2026-27)',
    subjects,
    totalMax,
    totalObtained,
    percentage,
    grade: overallGrade,
    remarks
  };
}
