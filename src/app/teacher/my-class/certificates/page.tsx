'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  User, 
  X,
  FileText
} from 'lucide-react';

interface StudentOption {
  id: string;
  full_name: string;
  admission_no: string;
  roll_no: string;
}

interface CertificateApprovalItem {
  id: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
  details?: {
    student_id: string;
    student_name: string;
    admission_no: string;
    certificate_type: string;
    reason: string;
    conduct?: string;
  };
  review_notes?: string;
  reviewed_at?: string;
}

export default function ClassCertificateRequestsPage() {
  const [certificates, setCertificates] = useState<CertificateApprovalItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [certificateType, setCertificateType] = useState('Transfer Certificate (TC)');
  const [reason, setReason] = useState('');
  const [conduct, setConduct] = useState('Exemplary Character & Conduct');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [resCerts, resStudents] = await Promise.all([
        fetch('/api/teacher/class/certificates'),
        fetch('/api/teacher/class/students')
      ]);

      const dataCerts = await resCerts.json();
      const dataStudents = await resStudents.json();

      if (dataCerts.success) {
        setClassName(dataCerts.class_name);
        setSection(dataCerts.section);
        setCertificates(dataCerts.certificates || []);
      }
      if (dataStudents.success) {
        setStudents(dataStudents.students || []);
        if (dataStudents.students?.length > 0) {
          setSelectedStudentId(dataStudents.students[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load certificate requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRaisePetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !reason.trim()) return;

    const studentObj = students.find(s => s.id === selectedStudentId);

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          student_name: studentObj?.full_name || '',
          admission_no: studentObj?.admission_no || '',
          certificate_type: certificateType,
          reason,
          conduct
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `${certificateType} petition submitted to Principal for ${studentObj?.full_name}.`
        });
        setIsModalOpen(false);
        setReason('');
        // Refresh petitions
        const ref = await fetch('/api/teacher/class/certificates');
        const refData = await ref.json();
        if (refData.success) {
          setCertificates(refData.certificates || []);
        }
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to submit certificate request' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCerts = certificates.filter(c => {
    const sName = c.details?.student_name || '';
    const adm = c.details?.admission_no || '';
    const rsn = c.details?.reason || '';
    return sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsn.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Certificate Petitions (TC / Bonafide)</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Initiate Transfer, Bonafide, or Character Certificate requests for Principal sanction.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Raise Certificate Request
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search scholar or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total Petitions: <strong className="text-gray-900">{certificates.length}</strong>
        </div>
      </div>

      {/* Petitions List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading certificate petitions...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No certificate requests found</p>
            <p className="text-xs text-gray-500 mt-1">Raise a TC or Bonafide petition when a scholar requests clearance.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCerts.map((c) => (
              <div key={c.id} className="p-5 hover:bg-gray-50/70 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">
                      {c.details?.student_name || 'Scholar'}
                    </h3>
                    <span className="text-xs font-mono text-gray-400">
                      Adm: {c.details?.admission_no}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {c.details?.certificate_type || 'Certificate'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-900">Reason for Certificate: </span>
                    {c.details?.reason}
                  </p>

                  {c.details?.conduct && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Conduct Endorsement: </span>
                      {c.details.conduct}
                    </p>
                  )}

                  {c.review_notes && (
                    <p className="text-[11px] text-gray-500 italic">
                      Principal Remark: {c.review_notes}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-400 shrink-0">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Raise Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Raise Certificate Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaisePetition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Select Scholar:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} (Roll: {s.roll_no || 'NA'} | Adm: {s.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Certificate Category:
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                >
                  <option value="Transfer Certificate (TC)">Transfer Certificate (TC)</option>
                  <option value="Bonafide Certificate">Bonafide Certificate</option>
                  <option value="Character Certificate">Character Certificate</option>
                  <option value="Migration Clearance Certificate">Migration Clearance Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Reason for Request:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Parent job relocation to Bangalore, admission in CBSE senior secondary school..."
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Conduct &amp; Character Endorsement:
                </label>
                <input
                  type="text"
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  placeholder="e.g., Exemplary Character & Conduct"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Petition to Principal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
