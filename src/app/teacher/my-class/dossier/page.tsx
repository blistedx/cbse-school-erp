'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Printer, 
  RefreshCw, 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  BadgeAlert
} from 'lucide-react';

interface StudentRosterItem {
  id: string;
  admission_no: string;
  full_name: string;
  roll_no: string;
  gender: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  attendance_percent: number;
  fee_status: string;
  fee_pending_amount: number;
}

interface StudentDossierDetail {
  id: string;
  admission_no: string;
  full_name: string;
  roll_no: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  attendance_percent: number;
  attendance_summary?: {
    attendancePercent: number;
    presentDays: number;
    absentDays: number;
    totalWorkingDays: number;
  };
  fee_summary?: {
    total_receivable: number;
    total_collected: number;
    total_pending: number;
    fee_status: string;
  };
  marks?: Array<{
    exam_id: string;
    subject_name: string;
    total_marks: number;
    max_marks: number;
    grade?: string;
  }>;
  remarks?: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    date: string;
  }>;
}

export default function ClassStudentDossierPage() {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student for 360 Dossier Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<StudentDossierDetail | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  useEffect(() => {
    fetchClassStudents();
  }, []);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/class/students');
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students roster', err);
    } finally {
      setLoading(false);
    }
  };

  const openDossier = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setDossier(null);
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/teacher/class/students?student_id=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setDossier(data.student);
      }
    } catch (err) {
      console.error('Failed to load student dossier', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ['Roll No', 'Adm No', 'Student Name', 'Gender', 'Guardian', 'Phone', 'Attendance %', 'Fee Status', 'Pending Due'];
    const rows = students.map(s => [
      `"${s.roll_no || ''}"`,
      `"${s.admission_no}"`,
      `"${s.full_name}"`,
      `"${s.gender}"`,
      `"${s.guardian_name}"`,
      `"${s.guardian_phone}"`,
      `${s.attendance_percent}%`,
      `"${s.fee_status}"`,
      s.fee_pending_amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Dossier_Roster_${className}_${section}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.guardian_name && s.guardian_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-[#122A24]">
              Class Teacher Desk
            </span>
            {className && (
              <span className="text-emerald-300 text-xs font-bold">
                Class {className}-{section}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Roster &amp; 360° Dossier</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Complete academic profile, attendance standing, fee clearance, and behaviour history.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Roster
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, roll no, adm no or parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
          <span>Total: <strong className="text-gray-900">{students.length}</strong></span>
          <span>Defaulters: <strong className="text-rose-600">{students.filter(s => s.attendance_percent < 75).length}</strong></span>
          <span>Fee Dues: <strong className="text-amber-600">{students.filter(s => s.fee_pending_amount > 0).length}</strong></span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading class scholars...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Parent Contact</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Fee Clearance</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-gray-700">{s.roll_no || '-'}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{s.full_name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{s.gender}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{s.guardian_name || '-'}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{s.guardian_phone || 'NA'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${s.attendance_percent < 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {s.attendance_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.fee_pending_amount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Due: ₹{s.fee_pending_amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openDossier(s.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#122A24] text-white hover:bg-emerald-900 transition"
                      >
                        360° Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 360 Dossier Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#122A24] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base border border-emerald-500/30">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {dossier?.full_name || 'Scholar Profile'}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Roll No: {dossier?.roll_no || 'NA'} | Adm No: {dossier?.admission_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="text-gray-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loadingDossier ? (
                <div className="text-center py-12 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                  Compiling 360° student dossier...
                </div>
              ) : dossier ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase">Attendance Standing</p>
                      <p className={`text-xl font-bold mt-1 ${
                        dossier.attendance_percent < 75 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {dossier.attendance_percent}%
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {dossier.attendance_summary?.presentDays || 0} / {dossier.attendance_summary?.totalWorkingDays || 0} days present
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase">Fee Status</p>
                      <p className={`text-xl font-bold mt-1 ${
                        (dossier.fee_summary?.total_pending || 0) > 0 ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {(dossier.fee_summary?.total_pending || 0) > 0 
                          ? `₹${(dossier.fee_summary?.total_pending || 0).toLocaleString()} Due`
                          : 'Paid Full'
                        }
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Collected: ₹{(dossier.fee_summary?.total_collected || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase">Behaviour Log</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {dossier.remarks?.length || 0} Remarks
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Discipline &amp; Achievements</p>
                    </div>
                  </div>

                  {/* Guardian & Contact Information */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      Guardian Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Father/Guardian:</span>
                        <p className="font-semibold text-gray-800">{dossier.guardian_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Mobile Phone:</span>
                        <p className="font-semibold text-gray-800 font-mono">{dossier.guardian_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Email Address:</span>
                        <p className="font-semibold text-gray-800">{dossier.guardian_email || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Residential Address:</span>
                        <p className="font-semibold text-gray-800">{dossier.address || 'On school record'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Performance Snapshot */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-700" />
                      Marks Snapshot
                    </h4>
                    {!dossier.marks || dossier.marks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No examination marks recorded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {dossier.marks.map((m, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                            <p className="font-semibold text-gray-900 truncate">{m.subject_name}</p>
                            <p className="text-emerald-700 font-bold mt-0.5">
                              {m.total_marks} / {m.max_marks} ({m.grade || 'NA'})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Behaviour & Discipline Remarks */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      Teacher &amp; Conduct Remarks
                    </h4>
                    {!dossier.remarks || dossier.remarks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No discipline or achievement remarks recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.remarks.map((r) => (
                          <div key={r.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-gray-900">{r.title}</span>
                              <span className="text-gray-400 font-mono text-[10px]">{r.date}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
