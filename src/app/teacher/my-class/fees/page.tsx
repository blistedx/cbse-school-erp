'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Send, 
  AlertTriangle, 
  Download, 
  Printer, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Phone, 
  User, 
  ShieldAlert,
  BellRing
} from 'lucide-react';

interface FeeDefaulter {
  student_id: string;
  admission_no: string;
  student_name: string;
  roll_no: string;
  father_name: string;
  mobile: string;
  pending_amount: number;
  due_date?: string;
}

export default function ClassFeeStatusPage() {
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Reminder status tracker
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [sentReminders, setSentReminders] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/class/fees');
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setDefaulters(data.defaulters || []);
        setTotalPending(data.total_pending_amount || 0);
      }
    } catch (err) {
      console.error('Failed to load fee defaulters', err);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (d: FeeDefaulter) => {
    try {
      setRemindingId(d.student_id);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: d.student_id,
          student_name: d.student_name,
          father_name: d.father_name,
          pending_amount: d.pending_amount
        })
      });
      const data = await res.json();
      if (data.success) {
        setSentReminders(prev => ({ ...prev, [d.student_id]: true }));
        setFeedback({
          type: 'success',
          text: `Fee advisory dispatched to parents of ${d.student_name} via notice board!`
        });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to dispatch reminder' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setRemindingId(null);
    }
  };

  const exportCSV = () => {
    if (defaulters.length === 0) return;
    const headers = ['Roll No', 'Adm No', 'Student Name', 'Father Name', 'Mobile', 'Pending Amount'];
    const rows = defaulters.map(d => [
      `"${d.roll_no || ''}"`,
      `"${d.admission_no}"`,
      `"${d.student_name}"`,
      `"${d.father_name}"`,
      `"${d.mobile}"`,
      d.pending_amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Defaulters_Class_${className}_${section}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = defaulters.filter(d => 
    d.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.roll_no && d.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.admission_no && d.admission_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    d.father_name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Class Fee Status &amp; Defaulters</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Real-time fee clearance ledger powered by the school Fee Master engine.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={exportCSV}
            disabled={defaulters.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={defaulters.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-semibold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Policy Note: Read Only, No Cash Handling */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-semibold text-amber-950">Read-Only Fee Ledger Policy</p>
          <p className="mt-0.5 text-amber-800">
            Teachers are not authorized to collect fees or record payments directly. This ledger is synchronized 
            with the Central Fee Master. Class teachers may issue polite parent reminders for outstanding balances.
          </p>
        </div>
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
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
          <p className="text-xs font-semibold text-rose-700 uppercase">Defaulters Count</p>
          <p className="text-3xl font-bold text-rose-700 mt-1">{defaulters.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Scholars with pending fee dues</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase">Total Outstanding Balance</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-0.5">Class {className}-{section} dues total</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Reminder Action</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-600" />
            <span>Digital Notice</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Sends automated advisory to parent portal</p>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-gray-900">Fee Defaulters Broadsheet</h2>
          </div>

          <div className="relative w-full sm:w-64 print:hidden">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scholar or parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Consulting Central Fee Master...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-sm">All Clear! No Fee Defaulters</p>
            <p className="text-xs text-gray-500 mt-1">All active scholars in Class {className}-{section} are fully fee-cleared.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Father / Guardian</th>
                  <th className="py-3 px-4">Parent Mobile</th>
                  <th className="py-3 px-4">Outstanding Due</th>
                  <th className="py-3 px-4 text-right">Advisory Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => {
                  const isSent = !!sentReminders[d.student_id];
                  const isSending = remindingId === d.student_id;
                  return (
                    <tr key={d.student_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium">{d.roll_no || '-'}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{d.admission_no}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{d.student_name}</td>
                      <td className="py-3 px-4 text-gray-700">{d.father_name}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{d.mobile || 'NA'}</td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        ₹{Number(d.pending_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => sendReminder(d)}
                          disabled={isSending || isSent}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Advisory Sent
                            </>
                          ) : isSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Remind Parent
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
