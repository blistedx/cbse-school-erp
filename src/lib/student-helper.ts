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
 * Strict CBSE matching criteria:
 * 1. Both Father AND Mother match (and both are non-empty)
 * 2. Primary 10-digit Guardian Mobile match + (Father match OR Mother match)
 * 3. Primary 10-digit Guardian Mobile match + Residential Address match
 */
export function getStudentSiblings(targetStudent: Student, allStudents: Student[]): Student[] {
  if (!targetStudent || !Array.isArray(allStudents)) return [];

  const targetFather = normalizeName(targetStudent.father_name || targetStudent.guardian_name);
  const targetMother = normalizeName(targetStudent.mother_name);
  const targetPhone = getCleanPhone(targetStudent.guardian_phone || targetStudent.phone);
  const targetAddress = (targetStudent.residential_address || targetStudent.address || '').toLowerCase().trim();

  return allStudents.filter(s => {
    // Exclude self by ID and admission number
    if (s.id === targetStudent.id || s.admission_no === targetStudent.admission_no) return false;

    const sFather = normalizeName(s.father_name || s.guardian_name);
    const sMother = normalizeName(s.mother_name);
    const sPhone = getCleanPhone(s.guardian_phone || s.phone);
    const sAddress = (s.residential_address || s.address || '').toLowerCase().trim();

    // Rule 1: Strict match of BOTH Father AND Mother (both must be non-empty and at least 3 chars)
    if (
      targetFather && sFather && targetFather.length >= 3 && targetFather === sFather &&
      targetMother && sMother && targetMother.length >= 3 && targetMother === sMother
    ) {
      return true;
    }

    // Rule 2: Primary 10-digit Guardian Phone matches AND (Father matches OR Mother matches)
    if (targetPhone && sPhone && targetPhone.length >= 10 && targetPhone === sPhone) {
      if (targetFather && sFather && targetFather.length >= 3 && targetFather === sFather) return true;
      if (targetMother && sMother && targetMother.length >= 3 && targetMother === sMother) return true;

      // Rule 3: 10-digit Phone match + Residential Address match (address > 5 chars)
      if (targetAddress && sAddress && targetAddress.length >= 5 && targetAddress === sAddress) {
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
      // Deduplicate cluster by student.id and admission_no
      const clusterMap = new Map<string, Student>();
      clusterMap.set(student.id, student);
      siblings.forEach(s => {
        if (!clusterMap.has(s.id)) {
          clusterMap.set(s.id, s);
        }
      });
      const cluster = Array.from(clusterMap.values());

      // Only clusters of 2 or more scholars are sibling groups
      if (cluster.length < 2) return;

      cluster.forEach(s => visitedIds.add(s.id));

      const father = student.father_name || student.guardian_name || 'Guardian';
      const mother = student.mother_name || '';
      const phone = student.guardian_phone || student.phone || 'N/A';
      const email = student.guardian_email || student.email || '';
      const address = student.residential_address || student.address || 'New Delhi';

      const familySurname = (student.full_name || '').trim().split(' ').pop() || 'Family';
      const familyName = `${familySurname} Household (${cluster.length} Scholars)`;

      // Calculate family fee dues from invoices if available
      let totalDues = 0;
      let allSiblingsPaid = true;
      if (Array.isArray(invoices) && invoices.length > 0) {
        cluster.forEach(s => {
          const sInvoices = invoices.filter(inv => inv.student_id === s.id || inv.admission_no === s.admission_no);
          const studentDue = sInvoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? ((Number(inv.amount) || 0) - (Number(inv.paid_amount) || 0)) : 0), 0);
          totalDues += studentDue;
          if (studentDue > 0) allSiblingsPaid = false;
        });
      }

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
        allFeesPaid: totalDues === 0 && allSiblingsPaid
      });
    }
  });

  return groups;
}

export interface AvailableExamOption {
  id: string;
  name: string;
  shortName: string;
  cycle: string;
  month: string;
  maxMarksPerSubject: number;
  isSummative: boolean;
}

export const AVAILABLE_EXAMS: AvailableExamOption[] = [
  { id: 'PT1', name: 'Periodic Test 1 (PT-1 / Unit Test 1)', shortName: 'PT-1', cycle: 'Cycle 1 Formative Assessment', month: 'July 2026', maxMarksPerSubject: 25, isSummative: false },
  { id: 'TERM1', name: 'Term-1 Summative Assessment (Half-Yearly)', shortName: 'Term-1 Exam', cycle: 'Mid-Term Summative Evaluation', month: 'September 2026', maxMarksPerSubject: 100, isSummative: true },
  { id: 'PT2', name: 'Periodic Test 2 (PT-2 / Pre-Mid Term)', shortName: 'PT-2', cycle: 'Cycle 2 Formative Assessment', month: 'November 2026', maxMarksPerSubject: 25, isSummative: false },
  { id: 'PT3', name: 'Periodic Test 3 (PT-3 / Post-Mid Term)', shortName: 'PT-3', cycle: 'Cycle 3 Formative Assessment', month: 'January 2027', maxMarksPerSubject: 25, isSummative: false },
  { id: 'TERM2', name: 'Term-2 Final Annual Board Examination', shortName: 'Term-2 Final', cycle: 'Annual Summative Evaluation', month: 'March 2027', maxMarksPerSubject: 100, isSummative: true },
  { id: 'CUMULATIVE', name: 'Annual Consolidated Academic Transcript (Full Session)', shortName: 'Cumulative', cycle: 'Full Session 2026-27 Consolidated', month: 'Session 2026-27', maxMarksPerSubject: 100, isSummative: true },
];

export interface SubjectAssessmentItem {
  code: string;
  subject: string;
  theoryMarks?: number;
  practicalMarks?: number;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  gp: number;
  remark: string;
}

export interface StudentAssessmentReport {
  examId: string;
  term: string;
  shortName: string;
  cycle: string;
  month: string;
  examDate: string;
  subjects: SubjectAssessmentItem[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  cgpa: number;
  classRank: number;
  percentile: number;
  status: 'PASSED' | 'PASSED_DISTINCTION' | 'NEEDS_IMPROVEMENT';
  remarks: string;
  coScholastic: {
    skill: string;
    grade: string;
  }[];
}

/**
 * Generates realistic CBSE Assessment Report for a student based on admission number and exam choice
 */
export function getStudentAssessmentReport(student: Student, examId: string = 'TERM1'): StudentAssessmentReport {
  const seed = (student.admission_no || student.id || '101')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const selectedExam = AVAILABLE_EXAMS.find(e => e.id === examId) || AVAILABLE_EXAMS[1];

  const isSenior = (student.class_name || '').includes('11') || (student.class_name || '').includes('12');
  const isMiddle = (student.class_name || '').includes('9') || (student.class_name || '').includes('10');

  const subjectMeta = isSenior
    ? [
        { code: '042', subject: 'Physics (Theory + Practical)' },
        { code: '043', subject: 'Chemistry (Theory + Practical)' },
        { code: '041', subject: 'Mathematics Core' },
        { code: '301', subject: 'English Core' },
        { code: '083', subject: 'Computer Science (Python & SQL)' }
      ]
    : isMiddle
    ? [
        { code: '041', subject: 'Mathematics' },
        { code: '086', subject: 'Science & Technology' },
        { code: '184', subject: 'English Language & Literature' },
        { code: '087', subject: 'Social Science' },
        { code: '002', subject: 'Hindi Course-A' },
        { code: '417', subject: 'Artificial Intelligence' }
      ]
    : [
        { code: '101', subject: 'English Language' },
        { code: '002', subject: 'Hindi Literature' },
        { code: '041', subject: 'Mathematics' },
        { code: '086', subject: 'Environmental Studies (EVS)' },
        { code: '501', subject: 'General Knowledge & Values' },
        { code: '165', subject: 'Computer Coding & Digital Skills' }
      ];

  const maxPerSub = selectedExam.maxMarksPerSubject;
  let totalMax = 0;
  let totalObtained = 0;
  let totalGp = 0;

  // Modifiers based on exam type
  const examOffset = examId === 'PT1' ? 3 : examId === 'PT2' ? 5 : examId === 'PT3' ? 2 : examId === 'TERM2' ? 4 : 0;

  const subjects: SubjectAssessmentItem[] = subjectMeta.map(({ code, subject }, idx) => {
    totalMax += maxPerSub;

    // Relative percentage 68% to 98%
    const basePct = 72 + ((seed + idx * 11 + examOffset * 7) % 25);
    const scaledMarks = Math.round((basePct / 100) * maxPerSub);
    const obtainedMarks = Math.min(maxPerSub, Math.max(Math.round(maxPerSub * 0.6), scaledMarks));
    totalObtained += obtainedMarks;

    const subPct = (obtainedMarks / maxPerSub) * 100;

    let grade = 'A1';
    let gp = 10.0;
    if (subPct >= 91) { grade = 'A1'; gp = 10.0; }
    else if (subPct >= 81) { grade = 'A2'; gp = 9.0; }
    else if (subPct >= 71) { grade = 'B1'; gp = 8.0; }
    else if (subPct >= 61) { grade = 'B2'; gp = 7.0; }
    else if (subPct >= 51) { grade = 'C1'; gp = 6.0; }
    else { grade = 'C2'; gp = 5.0; }

    totalGp += gp;

    let remark = 'Excellent conceptual understanding and regular class performance.';
    if (subPct >= 90) remark = 'Outstanding analytical grasp and problem-solving velocity.';
    else if (subPct >= 80) remark = 'Very good retention and active classroom participation.';
    else if (subPct >= 70) remark = 'Good proficiency. Recommended to focus on written structured responses.';

    let theoryMarks: number | undefined;
    let practicalMarks: number | undefined;

    if (selectedExam.isSummative) {
      theoryMarks = Math.round(obtainedMarks * 0.8);
      practicalMarks = obtainedMarks - theoryMarks;
    }

    return {
      code,
      subject,
      theoryMarks,
      practicalMarks,
      maxMarks: maxPerSub,
      obtainedMarks,
      grade,
      gp,
      remark
    };
  });

  const percentage = Math.round((totalObtained / totalMax) * 1000) / 10;
  const cgpa = Number((totalGp / subjects.length).toFixed(1));

  let overallGrade = 'A1';
  if (percentage >= 91) overallGrade = 'A1';
  else if (percentage >= 81) overallGrade = 'A2';
  else if (percentage >= 71) overallGrade = 'B1';
  else if (percentage >= 61) overallGrade = 'B2';
  else overallGrade = 'C1';

  // Seeded deterministic rank & percentile
  const classRank = Math.max(1, ((seed + examOffset * 3) % 18) + 1);
  const percentile = Math.min(99.4, Math.max(78.0, Number((100 - (classRank * 1.5)).toFixed(1))));

  const status: 'PASSED_DISTINCTION' | 'PASSED' | 'NEEDS_IMPROVEMENT' =
    percentage >= 85 ? 'PASSED_DISTINCTION' : percentage >= 50 ? 'PASSED' : 'NEEDS_IMPROVEMENT';

  let remarks = 'Outstanding academic performance with exceptional analytical mastery across subjects.';
  if (percentage < 85 && percentage >= 75) remarks = 'Consistently good academic discipline, steady homework turnout, and active classroom participation.';
  else if (percentage < 75) remarks = 'Satisfactory progress. Recommended for additional guided practice in numerical and core conceptual subjects.';

  const examDates: Record<string, string> = {
    PT1: '2026-07-28',
    TERM1: '2026-09-24',
    PT2: '2026-11-20',
    PT3: '2027-01-22',
    TERM2: '2027-03-26',
    CUMULATIVE: '2027-03-31'
  };

  const coScholastic = [
    { skill: 'Work Education & Computer Coding', grade: percentage >= 80 ? 'A' : 'B' },
    { skill: 'Art & Aesthetic Education', grade: 'A' },
    { skill: 'Health & Physical Fitness / Sports', grade: 'A' },
    { skill: 'Discipline, Punctuality & Values', grade: percentage >= 75 ? 'A' : 'B' }
  ];

  return {
    examId: selectedExam.id,
    term: selectedExam.name,
    shortName: selectedExam.shortName,
    cycle: selectedExam.cycle,
    month: selectedExam.month,
    examDate: examDates[selectedExam.id] || '2026-09-24',
    subjects,
    totalMax,
    totalObtained,
    percentage,
    grade: overallGrade,
    cgpa,
    classRank,
    percentile,
    status,
    remarks,
    coScholastic
  };
}
