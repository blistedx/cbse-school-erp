/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Download, 
  Sparkles, 
  User, 
  Users, 
  Calendar, 
  School as SchoolIcon, 
  ShieldCheck, 
  FileCheck, 
  QrCode, 
  Search,
  ChevronRight,
  Filter,
  Layers,
  Check,
  X,
  Eye,
  RefreshCw,
  ScanLine,
  Phone,
  Droplet,
  MapPin,
  Building2,
  BadgeCheck,
  Barcode,
  IdCard,
  Palette,
  GraduationCap
} from 'lucide-react';
import { School, Student, Teacher, ClassRoom } from '@/lib/types';
import { sortClassesChronologically } from '@/lib/cbse-subjects';

interface DashboardCertificatesProps {
  selectedSchool: School | null;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  selectedSession: string;
  isSuperAdmin?: boolean;
}

type TargetType = 'STUDENT' | 'EMPLOYEE';
type GenMode = 'SINGLE' | 'BULK';

export interface IDTemplate {
  id: string;
  code: string;
  name: string;
  theme: string;
  desc: string;
  primaryColor: string;
  accentColor: string;
  headerBg: string;
  cardBg: string;
  borderStyle: string;
  tagline: string;
}

const ID_TEMPLATES: IDTemplate[] = [
  {
    id: 'T-EMERALD',
    code: 'T-01',
    name: 'Modern Emerald Executive',
    theme: 'emerald',
    desc: 'Deep forest green header, crisp white body, gold accents and QR auto-attendance corner',
    primaryColor: '#122A24',
    accentColor: '#10B981',
    headerBg: 'bg-[#122A24] text-white',
    cardBg: 'bg-white',
    borderStyle: 'border-2 border-[#122A24]',
    tagline: 'CBSE Standard Institutional Identity'
  },
  {
    id: 'T-NAVY',
    code: 'T-02',
    name: 'Royal CBSE Classic Navy',
    theme: 'navy',
    desc: 'Regal navy blue with gold foil trim, circular portrait framing and high-security QR block',
    primaryColor: '#0F2942',
    accentColor: '#F59E0B',
    headerBg: 'bg-[#0F2942] text-white',
    cardBg: 'bg-white',
    borderStyle: 'border-2 border-[#0F2942]',
    tagline: 'Excellence In Education & Character'
  },
  {
    id: 'T-CYBER',
    code: 'T-03',
    name: 'Tech Cyber Carbon Dark',
    theme: 'cyber',
    desc: 'High-tech dark slate carbon finish with emerald neon accents, holographic chip pattern & barcode',
    primaryColor: '#18181B',
    accentColor: '#34D399',
    headerBg: 'bg-[#18181B] text-emerald-300',
    cardBg: 'bg-[#27272A] text-white',
    borderStyle: 'border-2 border-emerald-500/40',
    tagline: 'Next-Gen Smart Campus Identity'
  },
  {
    id: 'T-CRIMSON',
    code: 'T-04',
    name: 'Crimson & Gold Academic',
    theme: 'crimson',
    desc: 'Prestigious burgundy crimson with gold crest borders and dual-sided QR attendance verification',
    primaryColor: '#881337',
    accentColor: '#D97706',
    headerBg: 'bg-[#881337] text-white',
    cardBg: 'bg-[#FFFDF9]',
    borderStyle: 'border-2 border-[#881337]',
    tagline: 'Academic Scholar & Scholar Council'
  },
  {
    id: 'T-PASTEL',
    code: 'T-05',
    name: 'Vibrant Primary Pastel',
    theme: 'pastel',
    desc: 'Playful sky-blue & sunny amber playful geometry with high-visibility emergency contacts & QR',
    primaryColor: '#0284C7',
    accentColor: '#F59E0B',
    headerBg: 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white',
    cardBg: 'bg-white',
    borderStyle: 'border-2 border-sky-500',
    tagline: 'Foundational & Primary Wing'
  }
];

const STUDENT_DOC_TYPES = [
  { id: 'ID_CARD', label: 'ID Card (Portrait)', title: 'Student Identity Card', badge: 'Vertical Portrait CR80 with QR' },
  { id: 'TRANSFER_CERTIFICATE', label: 'Transfer (TC)', title: 'Transfer & School Leaving Certificate', badge: 'CBSE Official' },
  { id: 'BONAFIDE', label: 'Bonafide', title: 'Bonafide Student Certificate', badge: 'Enrollment Proof' },
  { id: 'CHARACTER_CERTIFICATE', label: 'Character (CC)', title: 'Character & Conduct Certificate', badge: 'Official Endorsement' },
  { id: 'MERIT_CERTIFICATE', label: 'Certificate of Merit', title: 'Certificate of Academic Merit', badge: 'Academic Excellence' },
  { id: 'ACHIEVEMENT_AWARD', label: 'Achievement Award', title: 'Certificate of Outstanding Achievement', badge: 'Co-Curricular' },
  { id: 'SUSPENSION_LETTER', label: 'Disciplinary Notice', title: 'Official Disciplinary Action Notice', badge: 'Strict Record' }
];

const EMPLOYEE_DOC_TYPES = [
  { id: 'STAFF_ID', label: 'Staff ID (Portrait)', title: 'Faculty & Employee Identity Card', badge: 'Vertical Portrait CR80 with QR' },
  { id: 'EXPERIENCE_CERTIFICATE', label: 'Experience Certificate', title: 'Teaching Experience Certificate', badge: 'Service Verification' },
  { id: 'PAYSLIP', label: 'Salary Slip / Payslip', title: 'Monthly Salary Disbursement Slip', badge: 'Payroll Docket' },
  { id: 'APPOINTMENT_LETTER', label: 'Appointment Letter', title: 'Faculty Appointment & Joining Letter', badge: 'HR Docket' },
  { id: 'RELIEVING_LETTER', label: 'Relieving Letter', title: 'Official Relieving & Clearance Certificate', badge: 'HR Clearance' },
  { id: 'BEST_TEACHER', label: 'Best Teacher Award', title: 'Teacher Excellence & Citation Award', badge: 'Honor Roll' }
];

const formatDateWithWords = (dobString?: string) => {
  if (!dobString) return '15-Aug-2011 (Fifteenth of August Two Thousand Eleven)';
  const d = new Date(dobString);
  if (isNaN(d.getTime())) return dobString;
  const dayNames = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year} (${dayNames[day] || day} of ${month} ${year})`;
};

interface FormalCertificateProps {
  selectedSchool: School | null;
  activeStudent: Student | null;
  activeTeacher: Teacher | null;
  targetType: TargetType;
  docTypeId: string;
  selectedDocMeta: { id: string; label: string; title: string; badge: string };
  selectedSession: string;
  certRefPrefix: string;
  issueDate: string;
  signatoryTitle: string;
  customRemarks?: string;
}

const FormalCertificateDocument: React.FC<FormalCertificateProps> = ({
  selectedSchool,
  activeStudent,
  activeTeacher,
  targetType,
  docTypeId,
  selectedDocMeta,
  selectedSession,
  certRefPrefix,
  issueDate,
  signatoryTitle,
  customRemarks
}) => {
  if (targetType === 'STUDENT' && !activeStudent) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs font-mono">
        Please select a student to preview this certificate.
      </div>
    );
  }

  if (targetType === 'EMPLOYEE' && !activeTeacher) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs font-mono">
        Please select a faculty member to preview this document.
      </div>
    );
  }

  const s = activeStudent;
  const t = activeTeacher;

  const fatherName = s?.father_name || s?.guardian_name || 'Mr. Rajesh Sharma';
  const motherName = s?.mother_name || '';
  const salutation = s?.gender === 'Female' ? 'Miss' : 'Master';
  const pronoun = s?.gender === 'Female' ? 'her' : 'his';
  const subjectPronoun = s?.gender === 'Female' ? 'She' : 'He';
  const relation = s?.gender === 'Female' ? 'Daughter' : 'Son';
  const studentAddress = s?.residential_address || (s?.city ? `${s.city}, ${s.state || 'Delhi'}` : 'Dwarka, New Delhi, India');

  return (
    <div className="w-full max-w-2xl bg-white p-6 sm:p-9 rounded-2xl shadow-lg border-4 border-[#122A24] text-slate-800 relative select-text">
      {/* Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <Award className="w-80 h-80 text-[#122A24]" />
      </div>

      {/* Institutional Letterhead */}
      <div className="text-center border-b-2 border-[#122A24] pb-4 mb-5">
        {selectedSchool?.logo && (
          <div className="flex justify-center mb-2">
            <img
              src={selectedSchool.logo}
              alt="School Crest"
              className="w-14 h-14 object-contain rounded-full border border-slate-200 p-0.5 bg-white shadow-xs"
            />
          </div>
        )}
        <h2 className="font-display font-black text-2xl text-[#122A24] uppercase tracking-tight leading-tight">
          {selectedSchool?.school_name || 'Delhi Public School'}
        </h2>
        <div className="text-xs text-slate-600 font-medium mt-0.5">
          {selectedSchool?.address || 'Sector 12, Dwarka, New Delhi'} • Phone: {selectedSchool?.phone || '+91 11 2789 0000'}
        </div>
        <div className="text-[11px] font-mono text-emerald-800 font-bold mt-0.5 flex items-center justify-center gap-3">
          <span>CBSE Affiliation No: {selectedSchool?.affiliation_no || '2130042'}</span>
          <span>•</span>
          <span>School Code: {selectedSchool?.oasis_code || '84001'}</span>
          <span>•</span>
          <span>UDISE: {selectedSchool?.udise_code || '07010100101'}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. BONAFIDE CERTIFICATE (AUTHENTIC CBSE FORMAT)
          ───────────────────────────────────────────────────────────── */}
      {docTypeId === 'BONAFIDE' && s && (
        <div className="space-y-5">
          {/* Certificate Title Badge */}
          <div className="text-center">
            <div className="inline-block px-7 py-1.5 bg-[#122A24] text-white font-display font-black text-sm tracking-widest uppercase rounded-full shadow-xs">
              BONAFIDE CERTIFICATE
            </div>
            <div className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider mt-1">
              TO WHOMSOEVER IT MAY CONCERN
            </div>
          </div>

          {/* Reference No & Issue Date */}
          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-200 pb-2">
            <span>Ref. No: <strong className="text-[#122A24] font-bold">{certRefPrefix}/BONA</strong></span>
            <span>Date of Issue: <strong className="text-[#122A24] font-bold">{issueDate}</strong></span>
          </div>

          {/* Main Certification Paragraphs */}
          <div className="space-y-3.5 text-[13.5px] leading-relaxed text-slate-800 text-justify font-sans">
            <p>
              This is to certify that {salutation} <strong className="text-[#122A24] text-base font-bold underline decoration-emerald-600 decoration-2">{s.full_name}</strong>, 
              {relation} of <strong className="text-[#122A24] font-bold">{fatherName}</strong>
              {motherName ? <span> and Mrs. <strong className="text-[#122A24] font-bold">{motherName}</strong></span> : ''}, 
              is a <strong>bona fide student</strong> of this school, currently studying in <strong className="text-[#122A24] font-bold">{s.class_name} ({s.section ? `Section ${s.section}` : 'Sec A'})</strong> during the Academic Session <strong className="font-mono font-bold text-[#122A24]">{selectedSession}</strong>.
            </p>

            {/* Verified Student Details Grid */}
            <div className="bg-[#F8FAF9] p-3.5 rounded-xl border border-[#DCE8E0] grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
              <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0 border-slate-200">
                <span className="text-slate-500">Admission / Scholar No:</span>
                <strong className="text-[#122A24]">{s.admission_no || s.id}</strong>
              </div>
              <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0 border-slate-200">
                <span className="text-slate-500">Class Roll Number:</span>
                <strong className="text-[#122A24]">{s.roll_no || '12'}</strong>
              </div>
              <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0 border-slate-200">
                <span className="text-slate-500">Date of Birth (Records):</span>
                <strong className="text-[#122A24]">{s.dob || '15-Aug-2011'}</strong>
              </div>
              <div className="flex justify-between border-b sm:border-b-0 pb-1 sm:pb-0 border-slate-200">
                <span className="text-slate-500">National PEN / APAAR:</span>
                <strong className="text-[#122A24]">{s.apaar_id || '2026-9812-4410'}</strong>
              </div>
              <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-200 flex flex-col sm:flex-row justify-between">
                <span className="text-slate-500">Residential Address:</span>
                <strong className="text-[#122A24] text-right truncate max-w-sm">{studentAddress}</strong>
              </div>
            </div>

            <p>
              As per the institutional admission and attendance registers, {pronoun} general conduct and moral behavior during the academic tenure have been found to be <strong className="text-emerald-800 font-bold">Good &amp; Exemplary</strong>.
            </p>

            {customRemarks ? (
              <div className="bg-[#EBF5EF] p-3 rounded-xl border border-[#C5E2CF] font-sans text-xs italic text-emerald-950">
                <strong>Special Endorsement:</strong> "{customRemarks}"
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">
                This certificate is issued upon the formal request of the parents / legal guardian for the purpose of <strong>Passport Application / Visa Verification / Bank Account Opening / Concession / Higher Education Admission</strong> without any financial liability on this institution.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. TRANSFER & SCHOOL LEAVING CERTIFICATE (CBSE SARAS 14-POINT)
          ───────────────────────────────────────────────────────────── */}
      {docTypeId === 'TRANSFER_CERTIFICATE' && s && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-block px-7 py-1.5 bg-[#122A24] text-white font-display font-black text-sm tracking-widest uppercase rounded-full shadow-xs">
              TRANSFER &amp; SCHOOL LEAVING CERTIFICATE
            </div>
            <div className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider mt-1">
              CBSE SARAS Form 16 / Official Clearance Docket
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-200 pb-2">
            <span>T.C. Serial No: <strong className="text-[#122A24] font-bold">{certRefPrefix}/TC</strong></span>
            <span>Admission No: <strong className="text-[#122A24] font-bold">{s.admission_no || s.id}</strong></span>
            <span>Date of Issue: <strong className="text-[#122A24] font-bold">{issueDate}</strong></span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs font-mono">
            {[
              { no: '1.', label: 'Name of the Pupil', val: s.full_name },
              { no: '2.', label: "Mother's Name", val: motherName || 'Mrs. Sunita Sharma' },
              { no: '3.', label: "Father's / Guardian's Name", val: fatherName },
              { no: '4.', label: 'Nationality & Religion', val: `${s.nationality || 'Indian'} / ${s.religion || 'Hindu'}` },
              { no: '5.', label: 'Category (SC / ST / OBC / GEN)', val: s.category || 'GENERAL' },
              { no: '6.', label: 'Date of first admission in school with class', val: `${s.admission_date || '01-Apr-2022'} (${s.class_name})` },
              { no: '7.', label: 'Date of Birth (in figures & words)', val: `${s.dob || '15-Aug-2011'} (${formatDateWithWords(s.dob)})` },
              { no: '8.', label: 'Class in which pupil last studied', val: `${s.class_name} (Section ${s.section || 'A'})` },
              { no: '9.', label: 'School / Board Annual Examination last taken', val: `${s.class_name} CBSE Annual Assessment - PASSED` },
              { no: '10.', label: 'Whether qualified for promotion to higher class', val: 'YES, Promoted to next higher grade' },
              { no: '11.', label: 'Month up to which school dues / fees have been paid', val: 'March 2026 (No Dues Outstanding)' },
              { no: '12.', label: 'Total Working Days & Total Days Present', val: '220 Days / 208 Days Present (94.5%)' },
              { no: '13.', label: 'General Conduct & Character', val: 'Exemplary & Diligent' },
              { no: '14.', label: 'Reason for leaving the school', val: customRemarks || 'Parent Relocation / Higher Studies' }
            ].map((item, idx) => (
              <div key={item.no} className={`flex items-center justify-between p-2 ${idx % 2 === 0 ? 'bg-[#F9FCFA]' : 'bg-white'} border-b border-slate-200 last:border-b-0`}>
                <span className="text-slate-600 font-sans w-2/5 flex gap-1">
                  <strong className="font-mono text-[#122A24]">{item.no}</strong> {item.label}
                </span>
                <strong className="text-[#122A24] w-3/5 text-right font-mono truncate">{item.val}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. CHARACTER & CONDUCT CERTIFICATE
          ───────────────────────────────────────────────────────────── */}
      {docTypeId === 'CHARACTER_CERTIFICATE' && s && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="inline-block px-7 py-1.5 bg-[#122A24] text-white font-display font-black text-sm tracking-widest uppercase rounded-full shadow-xs">
              CHARACTER &amp; CONDUCT CERTIFICATE
            </div>
            <div className="text-xs font-mono text-emerald-800 font-bold uppercase tracking-wider mt-1">
              Official Institutional Endorsement
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-200 pb-2">
            <span>Ref. No: <strong className="text-[#122A24] font-bold">{certRefPrefix}/CC</strong></span>
            <span>Date: <strong className="text-[#122A24] font-bold">{issueDate}</strong></span>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-800 text-justify font-sans">
            <p>
              This is to certify that {salutation} <strong className="text-[#122A24] text-base font-bold underline decoration-emerald-600 decoration-2">{s.full_name}</strong>, 
              {relation} of <strong className="text-[#122A24] font-bold">{fatherName}</strong>, 
              bearing Admission No. <strong className="font-mono font-bold text-[#122A24]">{s.admission_no || s.id}</strong>, 
              is / was a regular student of this institution studying in <strong className="text-[#122A24] font-bold">{s.class_name} - {s.section || 'A'}</strong> during Academic Session <strong className="font-mono font-bold text-[#122A24]">{selectedSession}</strong>.
            </p>

            <p>
              To the best of our knowledge and school institutional records, {subjectPronoun} bears an <strong>impeccable moral character</strong>, upright conduct, and disciplined demeanor. {subjectPronoun} has actively participated in academic curriculums and co-curricular programs of the school and has not been involved in any disciplinary infraction.
            </p>

            {customRemarks && (
              <div className="bg-[#EBF5EF] p-3 rounded-xl border border-[#C5E2CF] text-xs italic text-emerald-950">
                <strong>Citation:</strong> "{customRemarks}"
              </div>
            )}

            <p>
              We commend {pronoun} character and extend our highest wishes for {pronoun} bright career and future academic accomplishments.
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. CERTIFICATE OF MERIT & ACHIEVEMENT AWARD
          ───────────────────────────────────────────────────────────── */}
      {(docTypeId === 'MERIT_CERTIFICATE' || docTypeId === 'ACHIEVEMENT_AWARD') && s && (
        <div className="space-y-5 text-center py-2">
          <div className="inline-block p-2 rounded-full bg-amber-50 border-2 border-amber-400 mb-1">
            <Award className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700">
              {docTypeId === 'MERIT_CERTIFICATE' ? 'ACADEMIC DISTINCTION ROLL' : 'CO-CURRICULAR EXCELLENCE'}
            </div>
            <h2 className="font-display font-black text-2xl text-[#122A24] uppercase tracking-wider">
              {docTypeId === 'MERIT_CERTIFICATE' ? 'CERTIFICATE OF ACADEMIC MERIT' : 'OUTSTANDING ACHIEVEMENT AWARD'}
            </h2>
          </div>

          <div className="py-2 text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
            This Certificate of Honor is proudly presented to
            <div className="font-display font-black text-2xl text-[#122A24] my-2 text-emerald-800 underline decoration-amber-400 decoration-2">
              {s.full_name}
            </div>
            of <strong className="text-[#122A24] font-bold">{s.class_name} (Section {s.section || 'A'})</strong>, 
            Admission No: <strong className="font-mono font-bold text-[#122A24]">{s.admission_no || s.id}</strong>, 
            in recognition of {pronoun} outstanding performance, stellar dedication, and academic brilliance during the Academic Session <strong>{selectedSession}</strong>.
          </div>

          {customRemarks && (
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 font-sans text-xs italic text-amber-950 max-w-md mx-auto">
              "{customRemarks}"
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. DISCIPLINARY NOTICE / SUSPENSION LETTER
          ───────────────────────────────────────────────────────────── */}
      {docTypeId === 'SUSPENSION_LETTER' && s && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-block px-7 py-1.5 bg-rose-900 text-white font-display font-black text-sm tracking-widest uppercase rounded-full shadow-xs">
              OFFICIAL DISCIPLINARY ACTION NOTICE
            </div>
            <div className="text-xs font-mono text-rose-800 font-bold uppercase tracking-wider mt-1">
              Confidential Administrative Communication
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-200 pb-2">
            <span>Notice Ref: <strong className="text-rose-900 font-bold">{certRefPrefix}/DISC</strong></span>
            <span>Date: <strong className="text-[#122A24] font-bold">{issueDate}</strong></span>
          </div>

          <div className="space-y-3.5 text-sm leading-relaxed text-slate-800 text-justify font-sans">
            <p>
              To the Parents / Guardian of <strong>{s.full_name}</strong> (Class {s.class_name} {s.section || 'A'}, Adm No: {s.admission_no}):
            </p>
            <p>
              This is to bring to your urgent attention that {s.full_name} has been placed under administrative review regarding campus conduct and compliance with institutional CBSE discipline guidelines.
            </p>
            {customRemarks && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-mono text-xs">
                <strong>Matter Summary:</strong> {customRemarks}
              </div>
            )}
            <p>
              You are hereby requested to meet the Principal and Disciplinary Committee at the school administrative block.
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. FACULTY & EMPLOYEE CERTIFICATES (AUTHENTIC CBSE FORMATS)
          ───────────────────────────────────────────────────────────── */}
      {targetType === 'EMPLOYEE' && t && (
        <div className="space-y-5">
          {/* Certificate Title Badge */}
          <div className="text-center">
            <div className="inline-block px-7 py-1.5 bg-[#122A24] text-white font-display font-black text-sm tracking-widest uppercase rounded-full shadow-xs">
              {selectedDocMeta.title}
            </div>
            <div className="text-xs font-mono text-emerald-800 font-bold uppercase tracking-wider mt-1">
              Faculty &amp; Staff Service Record • Academic Session {selectedSession}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono border-b border-slate-200 pb-2">
            <span>Ref. No: <strong className="text-[#122A24] font-bold">{certRefPrefix}/FAC</strong></span>
            <span>Date: <strong className="text-[#122A24] font-bold">{issueDate}</strong></span>
          </div>

          {/* 6.1 EXPERIENCE CERTIFICATE */}
          {docTypeId === 'EXPERIENCE_CERTIFICATE' && (
            <div className="space-y-4 text-sm leading-relaxed text-slate-800 text-justify font-sans">
              <p>
                This is to certify that <strong>{t.full_name}</strong> (Employee Code: <strong>{t.employee_code || t.id}</strong>) has been actively serving as a full-time <strong className="text-[#122A24] font-bold">{t.designation || 'Post Graduate Teacher (PGT)'}</strong> in the Department of <strong className="text-[#122A24] font-bold">{t.department || 'Academic Faculty'}</strong> from <strong className="font-mono font-bold text-[#122A24]">{t.date_of_joining || '01-Jul-2021'}</strong> to present.
              </p>

              <p>
                During {t.gender === 'Female' ? 'her' : 'his'} tenure at this institution, {t.gender === 'Female' ? 'she' : 'he'} has exhibited high pedagogical proficiency, exemplary classroom discipline, subject expertise, and dedicated commitment to student welfare and CBSE statutory norms.
              </p>

              {customRemarks && (
                <div className="bg-[#EBF5EF] p-3.5 rounded-xl border border-[#C5E2CF] text-xs text-emerald-950 font-sans">
                  <strong>Appraisal &amp; Citation Remarks:</strong> "{customRemarks}"
                </div>
              )}

              <p>
                We appreciate {t.gender === 'Female' ? 'her' : 'his'} valuable services and wish {t.gender === 'Female' ? 'her' : 'him'} all the very best in all future academic, professional, and career endeavors.
              </p>
            </div>
          )}

          {/* 6.2 MONTHLY SALARY DISBURSEMENT SLIP / PAYSLIP */}
          {docTypeId === 'PAYSLIP' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                <div><span className="text-slate-500 block text-[10px]">Faculty Member:</span><strong className="text-[#122A24]">{t.full_name}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Employee Code:</span><strong>{t.employee_code || t.id}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Designation:</span><strong>{t.designation || 'Teacher'}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Department:</span><strong>{t.department || 'Academics'}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">PAN Number:</span><strong>{t.pan_no || 'ABCDE1234F'}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Bank A/C:</span><strong>•••• 8921</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Joining Date:</span><strong>{t.date_of_joining || '01-Jul-2021'}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Payment Mode:</span><strong>Direct Bank ECS</strong></div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs">
                <div className="grid grid-cols-2 bg-[#122A24] text-white p-2.5 font-bold font-mono text-xs">
                  <div>EARNINGS &amp; ALLOWANCES (₹)</div>
                  <div>STATUTORY DEDUCTIONS (₹)</div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200 p-4 text-xs font-mono bg-white">
                  <div className="space-y-2 pr-4">
                    <div className="flex justify-between"><span>Basic Pay</span><strong>₹32,000.00</strong></div>
                    <div className="flex justify-between"><span>Dearness Allowance (DA)</span><strong>₹12,800.00</strong></div>
                    <div className="flex justify-between"><span>House Rent Allowance (HRA)</span><strong>₹7,700.00</strong></div>
                    <div className="flex justify-between"><span>Special Academic Allowance</span><strong>₹4,500.00</strong></div>
                    <div className="border-t-2 border-slate-300 pt-1.5 flex justify-between font-bold text-[#122A24]">
                      <span>GROSS EARNINGS</span><span>₹57,000.00</span>
                    </div>
                  </div>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Provident Fund (EPF)</span><strong>₹1,800.00</strong></div>
                    <div className="flex justify-between"><span>TDS / Income Tax</span><strong>₹500.00</strong></div>
                    <div className="flex justify-between"><span>Professional Tax (PT)</span><strong>₹200.00</strong></div>
                    <div className="flex justify-between"><span>Group Insurance</span><strong>₹0.00</strong></div>
                    <div className="border-t-2 border-slate-300 pt-1.5 flex justify-between font-bold text-rose-700">
                      <span>TOTAL DEDUCTIONS</span><span>₹2,500.00</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#EBF5EF] p-4 border-t-2 border-[#C5E2CF] flex items-center justify-between flex-wrap gap-2">
                  <div className="font-mono">
                    <span className="text-emerald-800 font-bold block text-xs">NET SALARY DISBURSED:</span>
                    <strong className="text-lg text-[#122A24]">₹54,500.00</strong>
                    <span className="text-[10px] text-slate-600 block">(Rupees Fifty-Four Thousand Five Hundred Only)</span>
                  </div>
                  <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-mono font-bold text-xs border border-emerald-300">
                    ✓ 100% Disbursed to Bank A/C
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6.3 APPOINTMENT & JOINING LETTER */}
          {docTypeId === 'APPOINTMENT_LETTER' && (
            <div className="space-y-4 text-sm leading-relaxed text-slate-800 text-justify font-sans">
              <p>
                Dear <strong>{t.full_name}</strong>,
              </p>
              <p>
                With reference to your application and subsequent interview, the Institutional Management is pleased to offer you the appointment as <strong className="text-[#122A24] font-bold">{t.designation || 'Post Graduate Teacher'}</strong> in the Department of <strong className="text-[#122A24] font-bold">{t.department || 'Academics'}</strong> at <strong>{selectedSchool?.school_name || 'Delhi Public School'}</strong>, with effect from <strong className="font-mono font-bold text-[#122A24]">{t.date_of_joining || issueDate}</strong>.
              </p>
              <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] space-y-2 text-xs text-slate-700 font-sans">
                <div className="font-bold text-[#122A24]">Key Terms &amp; Conditions of Service:</div>
                <p>1. <strong>Probation:</strong> You will be on statutory probation for an initial period of one academic year.</p>
                <p>2. <strong>Curriculum Compliance:</strong> You will strictly uphold CBSE Affiliation Bye-Laws and institutional pedagogical ethics.</p>
                <p>3. <strong>Remuneration:</strong> Your compensation will be disbursed on the 1st of every month as per 7th Pay Commission norms.</p>
              </div>
              {customRemarks && (
                <div className="bg-[#EBF5EF] p-3 rounded-xl border border-[#C5E2CF] text-xs text-emerald-950">
                  <strong>Special Directives:</strong> "{customRemarks}"
                </div>
              )}
              <p>
                Please sign and return the duplicate copy of this letter in confirmation of your acceptance.
              </p>
            </div>
          )}

          {/* 6.4 RELIEVING & CLEARANCE LETTER */}
          {docTypeId === 'RELIEVING_LETTER' && (
            <div className="space-y-4 text-sm leading-relaxed text-slate-800 text-justify font-sans">
              <p>
                This is to certify that <strong>{t.full_name}</strong> (Employee ID: <strong>{t.employee_code || t.id}</strong>), who served as <strong className="text-[#122A24] font-bold">{t.designation || 'Teacher'}</strong> in the Department of <strong className="text-[#122A24] font-bold">{t.department || 'Academics'}</strong>, has been formally relieved from {t.gender === 'Female' ? 'her' : 'his'} duties with effect from the close of working hours on <strong className="font-mono font-bold text-[#122A24]">{issueDate}</strong>.
              </p>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold text-sm text-emerald-900">Institutional Clearance &amp; Handover Status:</div>
                <p>● Comprehensive syllabus handovers and mark registers submitted to Examination Cell.</p>
                <p>● Institutional laboratory, library books, and electronic assets accounted for in full.</p>
                <p>● Accounts &amp; Finance Department "NO DUES" certificate verified and archived.</p>
              </div>
              <p>
                We place on record our appreciation of {t.gender === 'Female' ? 'her' : 'his'} dedicated services and wish {t.gender === 'Female' ? 'her' : 'him'} success in all future professional endeavors.
              </p>
            </div>
          )}

          {/* 6.5 BEST TEACHER & CITATION AWARD */}
          {docTypeId === 'BEST_TEACHER' && (
            <div className="space-y-5 text-center font-sans">
              <div className="p-7 rounded-3xl bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold text-2xl shadow-xs">
                  🏆
                </div>
                <h3 className="font-display font-black text-xl text-amber-950 uppercase tracking-tight">
                  Excellence In Teaching &amp; Mentorship Citation
                </h3>
                <div className="text-xs font-mono font-bold text-amber-800">
                  Presented by the Governing Academic Council
                </div>
                <p className="text-sm text-slate-800 max-w-lg mx-auto leading-relaxed pt-2">
                  Awarded to <strong className="text-xl text-[#122A24] block mt-1">{t.full_name}</strong>
                  <span className="text-xs text-slate-600 font-mono block mt-0.5">{t.designation || 'Faculty Member'} • Department of {t.department}</span>
                </p>
                <p className="text-xs text-slate-600 italic max-w-md mx-auto pt-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  "{customRemarks || 'In recognition of outstanding pedagogical dedication, exceptional student engagement, and highest standards of academic integrity.'}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL SIGNATURES & INSTITUTIONAL EMBOSSED SEAL
          ───────────────────────────────────────────────────────────── */}
      <div className="mt-10 pt-6 border-t border-slate-200 flex items-end justify-between font-mono text-xs text-slate-600">
        <div className="text-center">
          <div className="w-32 border-b-2 border-slate-700 pb-1 mb-1 font-bold text-slate-800">
            {targetType === 'STUDENT' ? 'Class Teacher' : 'HR Officer'}
          </div>
          <span className="block text-[10px] text-slate-500">Prepared &amp; Verified</span>
        </div>

        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-700 flex flex-col items-center justify-center text-[8.5px] font-bold uppercase text-emerald-800 bg-emerald-50/40">
            <span>OFFICIAL</span>
            <span className="font-black text-[10px]">SEAL</span>
            <span>{selectedSchool?.school_code || 'DPS'}</span>
          </div>
          <span className="block mt-1 text-[9px] text-slate-400">Institutional Seal</span>
        </div>

        <div className="text-center">
          <div className="w-40 border-b-2 border-slate-800 pb-1 mb-1 font-bold text-[#122A24]">
            {selectedSchool?.principal_name || 'Dr. Rajesh Sharma'}
          </div>
          <span className="block text-[11px] font-bold text-[#122A24]">{signatoryTitle}</span>
        </div>
      </div>
    </div>
  );
};

export const DashboardCertificates: React.FC<DashboardCertificatesProps> = ({
  selectedSchool,
  students,
  teachers,
  classes,
  selectedSession
}) => {
  const [targetType, setTargetType] = useState<TargetType>('STUDENT');
  const [genMode, setGenMode] = useState<GenMode>('SINGLE');
  
  // Student Filters
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Employee Filters
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Document Config
  const [docTypeId, setDocTypeId] = useState<string>('ID_CARD');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('T-EMERALD');
  const [showIdBackSide, setShowIdBackSide] = useState<boolean>(false);
  
  // Custom Parameters
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [certRefPrefix, setCertRefPrefix] = useState<string>(`CERT-${selectedSession.replace(/[^0-9]/g, '').slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [signatoryTitle, setSignatoryTitle] = useState<string>('Principal / Head of School');
  const [customRemarks, setCustomRemarks] = useState<string>('');

  // Modals & QR Scan Simulator
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [qrScanModalStudent, setQrScanModalStudent] = useState<Student | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string>('');

  // Unique Chronologically Sorted Class Names
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(c => {
      const name = c.class_name || c.name;
      if (name) set.add(name);
    });
    students.forEach(s => {
      if (s.class_name) set.add(s.class_name);
    });
    const list = Array.from(set).map(name => ({ class_name: name }));
    return sortClassesChronologically(list).map(item => item.class_name || '').filter(Boolean);
  }, [classes, students]);

  // Student Search Query
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (filterClass !== 'ALL') {
        const target = filterClass.toLowerCase().replace(/^class\s*/i, '').trim();
        const sc = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
        if (target !== sc && s.class_name?.toLowerCase() !== filterClass.toLowerCase()) return false;
      }
      if (filterSection !== 'ALL' && (s.section || 'A').toUpperCase() !== filterSection.toUpperCase()) return false;
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const name = (s.full_name || '').toLowerCase();
        const admNo = (s.admission_no || s.id || '').toLowerCase();
        const roll = String(s.roll_no || '').toLowerCase();
        const phone = (s.guardian_phone || s.phone || '').toLowerCase();
        const guardian = (s.guardian_name || '').toLowerCase();
        if (!name.includes(q) && !admNo.includes(q) && !roll.includes(q) && !phone.includes(q) && !guardian.includes(q)) return false;
      }
      return true;
    });
  }, [students, filterClass, filterSection, studentSearchQuery]);

  // Set default student if none selected
  React.useEffect(() => {
    if (filteredStudents.length > 0 && (!selectedStudentId || !filteredStudents.some(s => s.id === selectedStudentId))) {
      setSelectedStudentId(filteredStudents[0].id);
    } else if (filteredStudents.length === 0) {
      setSelectedStudentId('');
    }
  }, [filteredStudents, selectedStudentId]);

  // Filtered Teachers & Departments
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach(t => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (filterDept !== 'ALL' && t.department !== filterDept) return false;
      if (teacherSearchQuery.trim()) {
        const q = teacherSearchQuery.toLowerCase().trim();
        const name = (t.full_name || '').toLowerCase();
        const desig = (t.designation || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        const code = (t.employee_code || t.id || '').toLowerCase();
        const phone = (t.phone || '').toLowerCase();
        if (!name.includes(q) && !desig.includes(q) && !dept.includes(q) && !code.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [teachers, filterDept, teacherSearchQuery]);

  // Set default teacher
  React.useEffect(() => {
    if (filteredTeachers.length > 0 && (!selectedTeacherId || !filteredTeachers.some(t => t.id === selectedTeacherId))) {
      setSelectedTeacherId(filteredTeachers[0].id);
    } else if (filteredTeachers.length === 0) {
      setSelectedTeacherId('');
    }
  }, [filteredTeachers, selectedTeacherId]);

  // Selected Student & Teacher Objects
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0] || null;
  }, [students, selectedStudentId, filteredStudents]);

  const activeTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0] || null;
  }, [teachers, selectedTeacherId, filteredTeachers]);

  const selectedTemplate = useMemo(() => {
    return ID_TEMPLATES.find(t => t.id === selectedTemplateId) || ID_TEMPLATES[0];
  }, [selectedTemplateId]);

  const selectedDocMeta = useMemo(() => {
    const list = targetType === 'STUDENT' ? STUDENT_DOC_TYPES : EMPLOYEE_DOC_TYPES;
    return list.find(d => d.id === docTypeId) || list[0];
  }, [targetType, docTypeId]);

  // Precise ID Card determination (prevents 'BONAFIDE' from matching .includes('ID'))
  const isIdCard = docTypeId === 'ID_CARD' || docTypeId === 'STAFF_ID';
  const isIdCardDoc = (id: string) => id === 'ID_CARD' || id === 'STAFF_ID';

  const handlePrint = () => {
    window.print();
  };

  // Simulate auto-attendance QR scan
  const handleTestScanAttendance = (student: Student) => {
    setQrScanModalStudent(student);
    setScanSuccessMessage(`✅ Attendance Marked Successfully!\nStudent: ${student.full_name} (${student.admission_no})\nClass: ${student.class_name}-${student.section || 'A'}\nTime: ${new Date().toLocaleTimeString()} • Mode: QR Auto-Scanner`);
  };

  // Helper to generate the exact attendance payload URL
  const getAttendancePayload = (s: Student) => {
    return `giterp://attend?school=${encodeURIComponent(selectedSchool?.school_code || 'DPS2026')}&student_id=${s.id}&adm_no=${encodeURIComponent(s.admission_no || s.id)}&name=${encodeURIComponent(s.full_name)}&action=MARK_PRESENT`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & PRIMARY WORKSPACE CARD (MATCHING ERP DESIGN SYSTEM)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          CREDENTIALS
        </div>
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
              <Award className="h-7 w-7 text-emerald-700 shrink-0" />
              <span>Certificate Studio &amp; Smart Portrait ID Hub</span>
            </h1>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              High-definition vertical portrait ID cards with automated QR attendance scanning, CBSE TCs, Bonafides &amp; Staff dockets
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
              Session {selectedSession || '2026-27'}
            </span>
          </div>
        </div>

        {/* Target Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs max-w-md">
          <button
            type="button"
            onClick={() => {
              setTargetType('STUDENT');
              setDocTypeId('ID_CARD');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              targetType === 'STUDENT'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Student Documents ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetType('EMPLOYEE');
              setDocTypeId('STAFF_ID');
            }}
            className={`py-2.5 px-4 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              targetType === 'EMPLOYEE'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Staff &amp; Faculty ({teachers.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN 2-COLUMN STUDIO WORKBENCH
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: CONTROLS, FILTERS & TEMPLATE PICKER (5 COLS)
            ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Select Document Type & Mode */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#E8F0EA] flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>1. Select Document &amp; Mode</span>
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                CR80 Portrait
              </span>
            </div>

            {/* Mode (Single vs Bulk) */}
            <div>
              <label className="block text-xs font-bold text-[#122A24] mb-1.5">Generation Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenMode('SINGLE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    genMode === 'SINGLE'
                      ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                      : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{targetType === 'STUDENT' ? 'Individual Student' : 'Individual Staff'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenMode('BULK')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    genMode === 'BULK'
                      ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                      : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{targetType === 'STUDENT' ? 'Bulk Class Pass' : 'Bulk Department'}</span>
                </button>
              </div>
            </div>

            {/* Document Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#122A24] mb-1.5">Document Type</label>
              <div className="space-y-1.5">
                {(targetType === 'STUDENT' ? STUDENT_DOC_TYPES : EMPLOYEE_DOC_TYPES).map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDocTypeId(doc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      docTypeId === doc.id
                        ? 'bg-[#EBF5EF] border-[#122A24] text-[#122A24] shadow-xs font-bold'
                        : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isIdCardDoc(doc.id) ? (
                        <IdCard className={`w-4 h-4 ${docTypeId === doc.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                      ) : (
                        <Award className={`w-4 h-4 ${docTypeId === doc.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                      )}
                      <span className="text-xs">{doc.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {doc.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters based on target */}
            {targetType === 'STUDENT' ? (
              <div className="space-y-3 pt-2 border-t border-[#E8F0EA]">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Select Class</label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Classes</option>
                      {uniqueClasses.map(clsName => (
                        <option key={clsName} value={clsName}>{clsName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Section</label>
                    <select
                      value={filterSection}
                      onChange={(e) => setFilterSection(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5 relative">
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Search Student</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search name, adm no, roll..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:bg-white"
                      />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {genMode === 'SINGLE' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#122A24]">Choose Student *</label>
                      <span className="text-[10px] font-mono font-bold text-emerald-800">
                        {filteredStudents.length} Matching
                      </span>
                    </div>

                    {filteredStudents.length > 0 ? (
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#C5E2CF] rounded-xl text-xs font-bold text-[#122A24] cursor-pointer"
                      >
                        {filteredStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.admission_no || s.id}) — {s.class_name} {s.section || 'A'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                        <span>No students match selected class/section or search.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterClass('ALL');
                            setFilterSection('ALL');
                            setStudentSearchQuery('');
                          }}
                          className="text-xs font-bold text-amber-900 underline border-none bg-transparent cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-[#E8F0EA]">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Department</label>
                    <select
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Departments</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-7 relative">
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Search Faculty</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search name, code, dept..."
                        value={teacherSearchQuery}
                        onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:bg-white"
                      />
                      {teacherSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTeacherSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {genMode === 'SINGLE' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#122A24]">Choose Faculty Member *</label>
                      <span className="text-[10px] font-mono font-bold text-emerald-800">
                        {filteredTeachers.length} Matching
                      </span>
                    </div>

                    {filteredTeachers.length > 0 ? (
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#C5E2CF] rounded-xl text-xs font-bold text-[#122A24] cursor-pointer"
                      >
                        {filteredTeachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} ({t.designation || 'Teacher'}) — {t.department}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                        <span>No faculty match selected department or search.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDept('ALL');
                            setTeacherSearchQuery('');
                          }}
                          className="text-xs font-bold text-amber-900 underline border-none bg-transparent cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: 5 Distinct Portrait ID Templates ("har template alag hona chahiye") */}
          {isIdCard && (
            <div className="bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E8F0EA] flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-700" />
                  <span>2. Portrait ID Card Templates</span>
                </h2>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {ID_TEMPLATES.length} Unique Designs
                </span>
              </div>

              <div className="space-y-2.5">
                {ID_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#EBF5EF] border-[#122A24] shadow-sm ring-2 ring-[#122A24]'
                          : 'bg-[#F9FCFA] border-[#DCE8E0] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: tmpl.primaryColor }} />
                          <h3 className="font-display font-bold text-xs text-[#122A24]">
                            {tmpl.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {tmpl.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {tmpl.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card 3: Metadata / Date parameters */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-[#122A24] pb-2 border-b border-[#E8F0EA]">
              3. Document Parameters
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">Signatory Title</label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#122A24] mb-1">Certificate Citation / Remarks</label>
              <input
                type="text"
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="e.g. Awarded 1st Rank with 98.4% in CBSE Annual Assessment"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24]"
              />
            </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Generate &amp; Print Portrait {isIdCard ? 'ID Card' : 'Certificate'} →</span>
            </button>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: LIVE HIGH-DEF PREVIEW STUDIO (7 COLS)
            ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
            
            {/* Studio Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8F0EA]">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-800">
                  Live Studio Preview
                </span>
                <h2 className="font-display font-bold text-lg text-[#122A24]">
                  {selectedDocMeta.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {isIdCard && (
                  <button
                    type="button"
                    onClick={() => setShowIdBackSide(!showIdBackSide)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#122A24] font-bold text-xs border-none cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{showIdBackSide ? 'View Front' : 'View Back'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs border-none cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Live Document Canvas */}
            <div className="p-4 sm:p-8 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] flex flex-col items-center justify-center min-h-[480px]">
              
              {/* ─────────────────────────────────────────────────────────────
                  A. PORTRAIT SMART ID CARD WITH AUTO-ATTENDANCE QR
                  ───────────────────────────────────────────────────────────── */}
              {isIdCard && (targetType === 'STUDENT' ? activeStudent : activeTeacher) && (
                <div className="flex flex-col items-center space-y-4">
                  
                  {/* Portrait Card Container (Standard 54mm x 86mm Ratio) */}
                  <div
                    className={`w-[300px] h-[480px] rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between transition-all ${selectedTemplate.borderStyle} ${selectedTemplate.cardBg}`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    
                    {/* FRONT SIDE */}
                    {!showIdBackSide ? (
                      <div className="h-full flex flex-col justify-between p-4 relative z-10 text-slate-800">
                        
                        {/* Lanyard Slot Punch hole visual */}
                        <div className="w-10 h-2 bg-slate-300 rounded-full mx-auto mb-2 opacity-60" />

                        {/* School Header */}
                        <div className="text-center pb-2 border-b border-slate-200">
                          <div className="font-display font-black text-sm text-[#122A24] uppercase tracking-tight leading-tight">
                            {selectedSchool?.school_name || 'Delhi Public School'}
                          </div>
                          <div className="text-[9px] font-mono text-emerald-800 font-bold">
                            CBSE Affil No: {selectedSchool?.affiliation_no || '2130042'} • Session {selectedSession}
                          </div>
                          <div className="text-[8px] text-slate-500 font-sans">
                            {selectedSchool?.address || 'Dwarka, New Delhi'}
                          </div>
                        </div>

                        {/* Photo & Badge */}
                        <div className="flex flex-col items-center my-2">
                          <div className="relative">
                            <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-[#122A24] shadow-sm flex flex-col items-center justify-center text-slate-400 font-mono font-bold text-xs overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
                              <User className="w-12 h-12 text-slate-400" />
                              <span className="text-[9px] text-slate-500 mt-1">PHOTO</span>
                            </div>
                            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-700 text-white text-[9px] font-mono font-bold rounded-full shadow-xs">
                              {targetType === 'STUDENT' ? (activeStudent?.blood_group || 'O+') : (activeTeacher?.blood_group || 'B+')}
                            </span>
                          </div>

                          <h3 className="font-display font-black text-base text-[#122A24] mt-2 tracking-tight">
                            {targetType === 'STUDENT' ? activeStudent?.full_name : activeTeacher?.full_name}
                          </h3>
                          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#122A24] text-white text-[10px] font-mono font-bold uppercase tracking-wider mt-0.5">
                            {targetType === 'STUDENT' ? `${activeStudent?.class_name} - ${activeStudent?.section || 'A'}` : `${activeTeacher?.designation || 'Faculty'} • ${activeTeacher?.department}`}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-1 text-[11px] font-mono border-t border-b border-slate-200 py-2">
                          {targetType === 'STUDENT' && activeStudent ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Adm No:</span>
                                <strong className="text-[#122A24]">{activeStudent.admission_no || activeStudent.id}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Roll No:</span>
                                <strong>{activeStudent.roll_no || '12'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Guardian:</span>
                                <strong className="truncate max-w-[140px]">{activeStudent.guardian_name || 'Mr. Sharma'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Contact:</span>
                                <strong>{activeStudent.guardian_phone || activeStudent.phone || '+91 98110 00000'}</strong>
                              </div>
                            </>
                          ) : activeTeacher ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Emp Code:</span>
                                <strong className="text-[#122A24]">{activeTeacher.employee_code || activeTeacher.id}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Department:</span>
                                <strong className="truncate max-w-[140px]">{activeTeacher.department}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Phone:</span>
                                <strong>{activeTeacher.phone || '+91 98765 00000'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Joining Date:</span>
                                <strong>{activeTeacher.date_of_joining || '01-Jul-2021'}</strong>
                              </div>
                            </>
                          ) : null}
                        </div>

                        {/* Bottom QR & Auto-Attendance Section */}
                        <div className="pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Scannable Attendance QR */}
                            <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-center shrink-0 group relative">
                              <QrCode className="w-12 h-12 text-[#122A24]" />
                            </div>
                            <div className="text-left leading-tight">
                              <span className="text-[9px] font-mono font-bold text-emerald-800 flex items-center gap-0.5">
                                <ScanLine className="w-2.5 h-2.5" /> SMART QR
                              </span>
                              <div className="text-[8.5px] text-slate-500 font-sans">
                                {targetType === 'STUDENT' ? 'Student Auto-Attendance' : 'Faculty Access Badge'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="border-t border-slate-400 pt-0.5 text-[9px] font-mono font-bold text-[#122A24]">
                              Principal Signature
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* BACK SIDE */
                      <div className="h-full flex flex-col justify-between p-4 text-slate-800 bg-slate-50 text-xs">
                        {/* Lanyard Slot Punch hole */}
                        <div className="w-10 h-2 bg-slate-300 rounded-full mx-auto mb-2 opacity-60" />

                        <div className="text-center border-b border-slate-200 pb-2">
                          <div className="font-display font-bold text-xs uppercase text-[#122A24]">
                            {targetType === 'STUDENT' ? 'Student Safety Instructions' : 'Faculty Campus Guidelines'}
                          </div>
                          <div className="text-[9px] text-slate-500">Valid Academic Session {selectedSession}</div>
                        </div>

                        <div className="space-y-2 text-[10px] text-slate-600 leading-relaxed">
                          <p>1. This card is non-transferable and remains institutional property.</p>
                          <p>2. Mandatory to display during campus hours, transit &amp; examinations.</p>
                          <p>3. In case of loss, report immediately to the administrative office.</p>
                          <p>4. <strong>Auto-Attendance:</strong> Present QR at kiosk gate for automatic biometric attendance marking.</p>
                        </div>

                        {/* Barcode Strip */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                          <div className="font-mono text-[10px] font-bold tracking-widest text-[#122A24]">
                            ||||| |||| |||||| |||| ||||| |||
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {targetType === 'STUDENT' ? (activeStudent?.admission_no || activeStudent?.id) : (activeTeacher?.employee_code || activeTeacher?.id)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 text-center text-[9px] font-mono text-slate-500">
                          Emergency Helpline: {selectedSchool?.phone || '+91 11 2789 0000'}
                          <br />
                          {selectedSchool?.email || 'contact@school.edu'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Scan Simulator Test Button */}
                  {targetType === 'STUDENT' && activeStudent && (
                    <button
                      type="button"
                      onClick={() => handleTestScanAttendance(activeStudent)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm border-none cursor-pointer flex items-center gap-2 animate-bounce-subtle"
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>⚡ Test Scan QR (Auto-Mark Attendance)</span>
                    </button>
                  )}

                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  B. FORMAL CERTIFICATES (BONAFIDE, TC, CHARACTER, MERIT, STAFF)
                  ───────────────────────────────────────────────────────────── */}
              {!isIdCard && (
                <FormalCertificateDocument
                  selectedSchool={selectedSchool}
                  activeStudent={activeStudent}
                  activeTeacher={activeTeacher}
                  targetType={targetType}
                  docTypeId={docTypeId}
                  selectedDocMeta={selectedDocMeta}
                  selectedSession={selectedSession}
                  certRefPrefix={certRefPrefix}
                  issueDate={issueDate}
                  signatoryTitle={signatoryTitle}
                  customRemarks={customRemarks}
                />
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. QR AUTO-ATTENDANCE SCAN MODAL SIMULATOR
          ───────────────────────────────────────────────────────────── */}
      {qrScanModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-[#122A24]">QR Attendance Scan Result</h3>
              </div>
              <button
                onClick={() => setQrScanModalStudent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Attendance Logged in Database</span>
              </div>
              <pre className="text-xs font-mono text-emerald-950 whitespace-pre-wrap leading-relaxed">
                {scanSuccessMessage}
              </pre>
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 break-all select-all">
              Payload: {getAttendancePayload(qrScanModalStudent)}
            </div>

            <button
              onClick={() => setQrScanModalStudent(null)}
              className="w-full py-2.5 rounded-xl bg-[#122A24] text-white font-bold text-xs border-none cursor-pointer hover:bg-[#1C443A]"
            >
              Done / Close Scanner
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. BULK & SINGLE PRINT MODAL (OPTIMIZED FOR CLEAN A4 PRINTING)
          ───────────────────────────────────────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#122A24] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white">
                    {selectedDocMeta.title} • Print Docket
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-300">
                    Template: {selectedTemplate.name} • {genMode === 'BULK' ? `Bulk Mode (${filteredStudents.length} Students)` : 'Single Mode'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Body Content */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              
              {genMode === 'SINGLE' ? (
                isIdCard ? (
                  /* Single Portrait ID Card (Student or Faculty) */
                  <div className={`w-[320px] h-[500px] rounded-2xl shadow-xl overflow-hidden p-5 flex flex-col justify-between ${selectedTemplate.borderStyle} ${selectedTemplate.cardBg} bg-white text-slate-800`}>
                    <div className="text-center pb-2 border-b border-slate-200">
                      <div className="font-display font-black text-sm text-[#122A24] uppercase">
                        {selectedSchool?.school_name || 'Delhi Public School'}
                      </div>
                      <div className="text-[9px] font-mono text-emerald-800 font-bold">
                        CBSE Affil No: {selectedSchool?.affiliation_no || '2130042'} • Session {selectedSession}
                      </div>
                    </div>

                    <div className="flex flex-col items-center my-2">
                      <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-[#122A24] flex flex-col items-center justify-center text-slate-400 font-mono font-bold text-xs">
                        <User className="w-10 h-10 text-slate-400" />
                        <span>PHOTO</span>
                      </div>
                      <h3 className="font-display font-black text-base text-[#122A24] mt-2">
                        {targetType === 'STUDENT' ? activeStudent?.full_name : activeTeacher?.full_name}
                      </h3>
                      <div className="px-2.5 py-0.5 rounded-full bg-[#122A24] text-white text-[10px] font-mono font-bold uppercase mt-0.5">
                        {targetType === 'STUDENT' ? `${activeStudent?.class_name} - ${activeStudent?.section || 'A'}` : `${activeTeacher?.designation || 'Faculty'} • ${activeTeacher?.department}`}
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono border-t border-b border-slate-200 py-2">
                      {targetType === 'STUDENT' && activeStudent ? (
                        <>
                          <div className="flex justify-between"><span>Adm No:</span><strong>{activeStudent.admission_no}</strong></div>
                          <div className="flex justify-between"><span>Roll No:</span><strong>{activeStudent.roll_no || '12'}</strong></div>
                          <div className="flex justify-between"><span>Contact:</span><strong>{activeStudent.guardian_phone || '+91 98110 00000'}</strong></div>
                        </>
                      ) : activeTeacher ? (
                        <>
                          <div className="flex justify-between"><span>Emp Code:</span><strong>{activeTeacher.employee_code || activeTeacher.id}</strong></div>
                          <div className="flex justify-between"><span>Department:</span><strong>{activeTeacher.department}</strong></div>
                          <div className="flex justify-between"><span>Phone:</span><strong>{activeTeacher.phone || '+91 98765 00000'}</strong></div>
                        </>
                      ) : null}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-[#122A24]" />
                        </div>
                        <div className="text-[8.5px] font-mono font-bold text-emerald-800">
                          {targetType === 'STUDENT' ? 'AUTO-ATTENDANCE QR' : 'SMART STAFF PASS'}
                        </div>
                      </div>
                      <div className="text-right text-[9px] font-mono font-bold text-[#122A24]">
                        Principal Signature
                      </div>
                    </div>
                  </div>
                ) : (
                  <FormalCertificateDocument
                    selectedSchool={selectedSchool}
                    activeStudent={activeStudent}
                    activeTeacher={activeTeacher}
                    targetType={targetType}
                    docTypeId={docTypeId}
                    selectedDocMeta={selectedDocMeta}
                    selectedSession={selectedSession}
                    certRefPrefix={certRefPrefix}
                    issueDate={issueDate}
                    signatoryTitle={signatoryTitle}
                    customRemarks={customRemarks}
                  />
                )
              ) : (
                /* Bulk Grid (Multiple Portrait Cards for Students or Faculty) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {targetType === 'STUDENT' ? (
                    filteredStudents.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border-2 border-[#122A24] shadow-sm flex flex-col justify-between space-y-3">
                        <div className="text-center pb-1 border-b border-slate-200">
                          <div className="font-bold text-xs text-[#122A24] truncate">{selectedSchool?.school_name}</div>
                          <div className="text-[9px] font-mono text-emerald-800">Session {selectedSession}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-sm text-[#122A24] truncate">{s.full_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">Adm: {s.admission_no} • {s.class_name} {s.section}</div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <QrCode className="w-8 h-8 text-[#122A24]" />
                          <span className="text-[9px] font-mono font-bold text-emerald-800">SCAN ATTENDANCE</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredTeachers.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-2xl border-2 border-[#122A24] shadow-sm flex flex-col justify-between space-y-3">
                        <div className="text-center pb-1 border-b border-slate-200">
                          <div className="font-bold text-xs text-[#122A24] truncate">{selectedSchool?.school_name}</div>
                          <div className="text-[9px] font-mono text-emerald-800">Session {selectedSession} • Faculty</div>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-sm text-[#122A24] truncate">{t.full_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{t.designation || 'Teacher'} • {t.department}</div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <QrCode className="w-8 h-8 text-[#122A24]" />
                          <span className="text-[9px] font-mono font-bold text-emerald-800">FACULTY BADGE</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

