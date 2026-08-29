'use client';

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Printer,
  QrCode,
  Search,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardExamsProps {
  students: Student[];
  schoolName?: string;
}

export function DashboardExams({ students, schoolName = 'DPS International — CBSE' }: DashboardExamsProps) {
  const [selectedClass, setSelectedClass] = useState('Class 6');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 (Half Yearly 2026-27)');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportCardStudent, setReportCardStudent] = useState<any | null>(null);

  // Student Marks Matrix
  const [marksLedger, setMarksLedger] = useState<Record<string, { math: number; science: number; english: number; sst: number; hindi: number; it: number }>>({
    s1: { math: 98, science: 93, english: 95, sst: 87, hindi: 89, it: 100 },
    s2: { math: 88, science: 91, english: 84, sst: 90, hindi: 82, it: 95 },
    s3: { math: 92, science: 86, english: 89, sst: 82, hindi: 85, it: 94 },
    s4: { math: 74, science: 78, english: 81, sst: 76, hindi: 80, it: 88 },
  });

  const studentsList = [
    { id: 's1', rollNo: '01', admNo: 'DPS-2022-8491', name: 'Aarav Sharma', class: 'Class VI-A', avatar: '👦', house: 'Tagore (Green)' },
    { id: 's2', rollNo: '02', name: 'Aaradhya Kapoor', admNo: 'DPS-2022-8492', class: 'Class VI-A', avatar: '👧', house: 'Shivaji (Red)' },
    { id: 's3', rollNo: '03', name: 'Ayush Mehra', admNo: 'DPS-2022-8493', class: 'Class VI-A', avatar: '👦', house: 'Ashoka (Blue)' },
    { id: 's4', rollNo: '04', name: 'Ananya Singhania', admNo: 'DPS-2022-8494', class: 'Class VI-A', avatar: '👧', house: 'Raman (Yellow)' },
  ];

  const calculateTotalAndGrade = (marks: { math: number; science: number; english: number; sst: number; hindi: number; it: number }) => {
    const total = marks.math + marks.science + marks.english + marks.sst + marks.hindi + marks.it;
    const maxMarks = 600;
    const percentage = Number(((total / maxMarks) * 100).toFixed(1));
    let grade = 'A1';
    let gp = 10;
    if (percentage >= 91) { grade = 'A1'; gp = 10; }
    else if (percentage >= 81) { grade = 'A2'; gp = 9; }
    else if (percentage >= 71) { grade = 'B1'; gp = 8; }
    else if (percentage >= 61) { grade = 'B2'; gp = 7; }
    else if (percentage >= 51) { grade = 'C1'; gp = 6; }
    else { grade = 'C2'; gp = 5; }

    return { total, percentage, grade, gp };
  };

  const handlePrintReportCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                CBSE Examination &amp; Report Card Studio
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Marks entry ledger, auto-grade calculation, co-scholastic remarks &amp; printable CBSE digital marksheet
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3.5 py-2 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
          >
            <option>Term 1 (Half Yearly 2026-27)</option>
            <option>Periodic Test 1 (PT-1)</option>
            <option>Periodic Test 2 (PT-2)</option>
            <option>Annual Final Board Assessment</option>
          </select>
        </div>
      </div>

      {/* Class & Section Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class:</span>
          {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClass === cls ? 'bg-[#122A24] text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Section:</span>
          {['A', 'B', 'C'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                selectedSection === sec ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Marks Matrix & Ledger Table */}
      <div className="bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#122A24]">
              {selectedClass}-{selectedSection} Examination Matrix ({selectedTerm})
            </h3>
            <p className="text-xs text-slate-500">Enter marks out of 100 for each subject. Grades &amp; totals auto-compute.</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
            6 Core Subjects • Max: 600
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE8E0] text-[10.5px] uppercase font-bold text-slate-400">
                <th className="pb-2.5">Roll / Scholar</th>
                <th className="pb-2.5 text-center">Maths (100)</th>
                <th className="pb-2.5 text-center">Science (100)</th>
                <th className="pb-2.5 text-center">English (100)</th>
                <th className="pb-2.5 text-center">SST (100)</th>
                <th className="pb-2.5 text-center">Hindi (100)</th>
                <th className="pb-2.5 text-center">IT / AI (100)</th>
                <th className="pb-2.5 text-center">Total / %</th>
                <th className="pb-2.5 text-center">CBSE Grade</th>
                <th className="pb-2.5 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsList.map((st) => {
                const marks = marksLedger[st.id] || { math: 80, science: 80, english: 80, sst: 80, hindi: 80, it: 80 };
                const summary = calculateTotalAndGrade(marks);

                return (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-slate-400">#{st.rollNo}</span>
                        {st.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Adm: {st.admNo}</div>
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.math}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, math: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.science}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, science: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.english}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, english: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.sst}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, sst: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.hindi}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, hindi: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={marks.it}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksLedger((prev) => ({
                            ...prev,
                            [st.id]: { ...marks, it: val }
                          }));
                        }}
                        className="w-14 p-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </td>

                    <td className="py-3 text-center">
                      <div className="font-mono font-black text-[#122A24]">{summary.total}/600</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{summary.percentage}%</div>
                    </td>

                    <td className="py-3 text-center">
                      <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {summary.grade} ({summary.gp} GP)
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      <button
                        onClick={() => setReportCardStudent({ ...st, marks, summary })}
                        className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Marksheet
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official CBSE Report Card Voucher Modal */}
      {reportCardStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  🎓
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Official CBSE Digital Student Report Card
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">Affiliation No: CBSE-2130091 • Session 2026-27</div>
                </div>
              </div>

              <button
                onClick={() => setReportCardStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Marksheet Container */}
            <div className="p-6 bg-neutral-50 rounded-2xl border border-slate-300 space-y-4 font-sans text-xs">
              <div className="text-center border-b border-slate-300 pb-3">
                <h2 className="font-display font-extrabold text-lg text-[#122A24]">{schoolName}</h2>
                <p className="text-[11px] text-slate-600">Senior Secondary CBSE Affiliated Institution</p>
                <div className="inline-block mt-1 px-3 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-full text-[10.5px]">
                  ACADEMIC PERFORMANCE ASSESSMENT (TERM 1)
                </div>
              </div>

              {/* Student Vitals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs">
                <div>Scholar: <span className="font-bold text-slate-900">{reportCardStudent.name}</span></div>
                <div>Class: <span className="font-bold text-slate-900">{reportCardStudent.class}</span></div>
                <div>Admission No: <span className="font-bold font-mono text-slate-900">{reportCardStudent.admNo}</span></div>
                <div>Roll No: <span className="font-bold font-mono text-slate-900">#{reportCardStudent.rollNo}</span></div>
              </div>

              {/* Subject Breakdown Table */}
              <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-2">Subject</th>
                    <th className="p-2 text-center">Max Marks</th>
                    <th className="p-2 text-center">Marks Obtained</th>
                    <th className="p-2 text-right">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-2 font-semibold">Mathematics</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.math}</td><td className="p-2 text-right font-bold text-emerald-700">10 (A1)</td></tr>
                  <tr><td className="p-2 font-semibold">Science (Theory + Practical)</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.science}</td><td className="p-2 text-right font-bold text-emerald-700">10 (A1)</td></tr>
                  <tr><td className="p-2 font-semibold">English Core</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.english}</td><td className="p-2 text-right font-bold text-emerald-700">10 (A1)</td></tr>
                  <tr><td className="p-2 font-semibold">Social Science</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.sst}</td><td className="p-2 text-right font-bold text-emerald-700">9 (A2)</td></tr>
                  <tr><td className="p-2 font-semibold">Hindi Core</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.hindi}</td><td className="p-2 text-right font-bold text-emerald-700">9 (A2)</td></tr>
                  <tr><td className="p-2 font-semibold">Information Technology &amp; AI</td><td className="p-2 text-center font-mono">100</td><td className="p-2 text-center font-mono font-bold">{reportCardStudent.marks.it}</td><td className="p-2 text-right font-bold text-emerald-700">10 (A1)</td></tr>
                  <tr className="bg-emerald-50 font-bold">
                    <td className="p-2">Grand Total &amp; Overall Percentage</td>
                    <td className="p-2 text-center font-mono">600</td>
                    <td className="p-2 text-center font-mono text-emerald-950">{reportCardStudent.summary.total} ({reportCardStudent.summary.percentage}%)</td>
                    <td className="p-2 text-right text-emerald-800">Grade {reportCardStudent.summary.grade}</td>
                  </tr>
                </tbody>
              </table>

              {/* Remarks & QR Code Verification */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-xs text-slate-900">Class Teacher Remarks:</div>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    "Outstanding academic consistency and high analytical acumen. Keep it up!"
                  </p>
                </div>
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                  <QrCode className="w-10 h-10 text-slate-800" />
                  <div className="text-[9px] text-slate-400 font-mono">CBSE Verified<br />Digital Marksheet</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReportCardStudent(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handlePrintReportCard}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF Marksheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
