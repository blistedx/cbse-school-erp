/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Paperclip,
  Send,
  Users,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Upload
} from 'lucide-react';
import { Student } from '@/lib/types';

export interface DashboardHomeworkProps {
  students?: Student[];
  schoolName?: string;
  userRole?: string;
  currentUser?: any;
}

export function DashboardHomework({
  students = [],
  schoolName = 'DPS International — CBSE',
  userRole = 'PRINCIPAL',
  currentUser
}: DashboardHomeworkProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Class 6 - A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [hwTitle, setHwTitle] = useState('Chapter 7: Fractions & Decimal Arithmetic');
  const [hwDesc, setHwDesc] = useState('Solve Exercise 7.4 (Questions 1 through 8) in the homework register. Show step-by-step number line solutions.');
  const [hwDueDate, setHwDueDate] = useState('Tomorrow, 08:00 AM');
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [viewSubmissionModal, setViewSubmissionModal] = useState<any | null>(null);
  const [studentSubmitModal, setStudentSubmitModal] = useState<any | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [studentSubmittedMap, setStudentSubmittedMap] = useState<Record<string, boolean>>({
    hw1: true
  });

  const [assignments, setAssignments] = useState([
    {
      id: 'hw1',
      title: 'Chapter 7: Fractions & Decimal Arithmetic',
      class: 'Class VI-A',
      subject: 'Mathematics',
      teacher: 'Mrs. Anjali Gupta',
      dueDate: '30 Aug 2026, 08:00 AM',
      submittedCount: 28,
      totalCount: 34,
      status: 'ACTIVE',
      color: 'border-blue-300 bg-blue-50/40 text-blue-900',
      attachment: 'Worksheet_Fractions_Ex7.pdf (1.4 MB)'
    },
    {
      id: 'hw2',
      title: 'Lab Manual: Separation of Substances & Sedimentation',
      class: 'Class VI-A',
      subject: 'Science (Physics/Chem)',
      teacher: 'Mr. R. K. Nair',
      dueDate: '31 Aug 2026, 08:00 AM',
      submittedCount: 32,
      totalCount: 34,
      status: 'ACTIVE',
      color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
      attachment: 'Sedimentation_Flowchart.pdf (2.1 MB)'
    },
    {
      id: 'hw3',
      title: 'Map Work: Major Harappan Civilisation Sites',
      class: 'Class VI-A',
      subject: 'Social Science',
      teacher: 'Mr. Vikram Singh',
      dueDate: '02 Sep 2026, 08:00 AM',
      submittedCount: 14,
      totalCount: 34,
      status: 'ACTIVE',
      color: 'border-amber-300 bg-amber-50/40 text-amber-900',
      attachment: 'India_Outline_Map.pdf (800 KB)'
    },
  ]);

  const handlePublishHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const newHw = {
      id: `hw-${Date.now()}`,
      title: hwTitle,
      class: selectedClass,
      subject: selectedSubject,
      teacher: 'Mrs. Anjali Gupta',
      dueDate: hwDueDate,
      submittedCount: 0,
      totalCount: 34,
      status: 'ACTIVE',
      color: 'border-purple-300 bg-purple-50/40 text-purple-900',
      attachment: 'Assignment_Notes.pdf (1.2 MB)'
    };
    setAssignments([newHw, ...assignments]);
    setPublishedSuccess(true);
    setTimeout(() => {
      setPublishedSuccess(false);
      setShowCreateModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE8E0] shadow-xs relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          HOMEWORK
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Homework &amp; Daily Class Diary Dispatcher
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Assign curriculum homework, manage PDF attachments &amp; track student submission progress
              </p>
            </div>
          </div>
        </div>

        {userRole !== 'STUDENT' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Dispatch New Homework
          </button>
        )}
      </div>

      {/* Homework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((hw) => (
          <div
            key={hw.id}
            className={`p-5 rounded-2xl border ${hw.color} bg-white shadow-xs flex flex-col justify-between space-y-4`}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {hw.subject} • {hw.class}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {hw.status}
                </span>
              </div>

              <h3 className="font-display font-bold text-base text-[#122A24] mt-3">{hw.title}</h3>
              <div className="text-xs text-slate-500 mt-1">Assigned by: <span className="font-semibold text-slate-700">{hw.teacher}</span></div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Due: {hw.dueDate}</span>
              </div>

              {hw.attachment && (
                <div className="mt-2.5 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-mono text-[11px] truncate">{hw.attachment}</span>
                </div>
              )}
            </div>

            {/* Submission Rate Bar for Teacher / Status for Student */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              {userRole === 'STUDENT' ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">My Submission Status:</span>
                    {studentSubmittedMap[hw.id] ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                        <Clock className="w-3 h-3 text-amber-600" /> Due
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setStudentSubmitModal(hw)}
                    className={`w-full mt-2 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      studentSubmittedMap[hw.id]
                        ? 'bg-[#EBF5EF] hover:bg-emerald-100 text-[#122A24] border border-[#C5E2CF]'
                        : 'bg-[#122A24] hover:bg-[#1C443A] text-white shadow-xs'
                    }`}
                  >
                    {studentSubmittedMap[hw.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" /> View My Submission
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Submit Homework
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Submissions:</span>
                    <span className="font-mono text-[#122A24] font-bold">{hw.submittedCount} of {hw.totalCount} ({Math.round((hw.submittedCount/hw.totalCount)*100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(hw.submittedCount/hw.totalCount)*100}%` }} />
                  </div>

                  <button
                    onClick={() => setViewSubmissionModal(hw)}
                    className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-[#122A24] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review Submissions &amp; Grade
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create New Homework Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-display font-bold text-base text-[#122A24]">Dispatch New Homework</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishHomework} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Class &amp; Section</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option>Class 6 - A</option>
                    <option>Class 7 - B</option>
                    <option>Class 8 - A</option>
                    <option>Class 9 - C</option>
                    <option>Class 10 - A</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>English Literature</option>
                    <option>Social Science</option>
                    <option>Hindi Core</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  placeholder="e.g. Chapter 8: Fractions & Decimals"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructions &amp; Problem Sets</label>
                <textarea
                  rows={3}
                  required
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Submission Deadline</label>
                  <input
                    type="text"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attach Worksheet (PDF)</label>
                  <button
                    type="button"
                    onClick={() => alert('Worksheet PDF selected.')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 border border-slate-300"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach File
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {publishedSuccess ? 'Dispatched to Students & Parents! ✓' : 'Dispatch to Class Diary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-xl w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  {viewSubmissionModal.title}
                </h3>
                <p className="text-xs text-slate-500">{viewSubmissionModal.class} • Submissions</p>
              </div>
              <button onClick={() => setViewSubmissionModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {[
                { name: 'Aarav Sharma', roll: '01', time: 'Yesterday, 07:45 PM', status: 'SUBMITTED', marks: '10/10' },
                { name: 'Aaradhya Kapoor', roll: '02', time: 'Yesterday, 08:20 PM', status: 'SUBMITTED', marks: '9/10' },
                { name: 'Ayush Mehra', roll: '03', time: 'Today, 06:30 AM', status: 'SUBMITTED', marks: 'Pending Review' },
                { name: 'Ananya Singhania', roll: '04', time: '—', status: 'PENDING', marks: '—' },
              ].map((sub, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">#{sub.roll} {sub.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sub.time}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sub.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.status}
                    </span>
                    <div className="text-[10px] text-slate-600 font-bold mt-0.5">{sub.marks}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewSubmissionModal(null)}
              className="w-full py-2.5 bg-[#122A24] text-white rounded-xl font-bold text-xs"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )}

      {/* Student Submit Homework Modal */}
      {studentSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {studentSubmitModal.subject}
                </span>
                <h3 className="font-display font-bold text-base text-[#122A24] mt-1">
                  {studentSubmitModal.title}
                </h3>
              </div>
              <button onClick={() => setStudentSubmitModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] text-slate-500 font-mono">Assigned By: <strong className="text-slate-800">{studentSubmitModal.teacher}</strong></div>
                <div className="text-[11px] text-slate-500 font-mono">Deadline: <strong className="text-slate-800">{studentSubmitModal.dueDate}</strong></div>
                {studentSubmitModal.attachment && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-mono text-[11px] truncate">{studentSubmitModal.attachment}</span>
                    <button
                      onClick={() => alert(`Downloading ${studentSubmitModal.attachment}...`)}
                      className="px-2.5 py-1 bg-white border border-[#C5E2CF] rounded-lg text-emerald-800 font-bold hover:bg-[#EBF5EF] cursor-pointer"
                    >
                      Download PDF
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">My Homework Solution Notes / Description</label>
                <textarea
                  rows={3}
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Enter your answers or step-by-step notebook notes here..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-sans text-xs resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Attach Homework Photo / PDF (Optional)</label>
                <button
                  type="button"
                  onClick={() => alert('Assignment photo/PDF selected.')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-dashed border-slate-300 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Choose Photo / Notebook Scan</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStudentSubmitModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentSubmittedMap(prev => ({ ...prev, [studentSubmitModal.id]: true }));
                    alert(`Homework for ${studentSubmitModal.title} submitted successfully to ${studentSubmitModal.teacher}!`);
                    setStudentSubmitModal(null);
                  }}
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Faculty</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
