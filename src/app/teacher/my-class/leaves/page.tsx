'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  FileText,
  UserCheck,
  MessageSquare
} from 'lucide-react';

interface StudentLeaveItem {
  id: string;
  student_id: string;
  student_name: string;
  roll_no?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  action_by_name?: string;
  action_remarks?: string;
  action_at?: string;
  created_at: string;
}

export default function ClassStudentLeavesPage() {
  const [leaves, setLeaves] = useState<StudentLeaveItem[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal
  const [actionItem, setActionItem] = useState<{ id: string; action: 'APPROVE' | 'REJECT'; student_name: string } | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL'
        ? '/api/teacher/class/leaves'
        : `/api/teacher/class/leaves?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionItem) return;
    try {
      setProcessing(true);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: actionItem.id,
          action: actionItem.action,
          remarks: remarkInput || (actionItem.action === 'APPROVE' ? 'Approved by Class Teacher' : 'Leave request declined')
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Leave for ${actionItem.student_name} ${actionItem.action.toLowerCase()}d successfully.`
        });
        setActionItem(null);
        setRemarkInput('');
        fetchLeaves();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update leave' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter(l => 
    l.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.roll_no && l.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    l.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Leave Applications</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Review and grant student leave requests. Approved leaves automatically synchronize with attendance.
          </p>
        </div>

        <button
          onClick={fetchLeaves}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Alert */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#122A24] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'ALL' ? 'All Petitions' : tab}
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search student or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Leaves List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading leave applications...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No leave applications found</p>
            <p className="text-xs text-gray-500 mt-1">There are no pending requests matching your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLeaves.map((l) => (
              <div key={l.id} className="p-5 hover:bg-gray-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{l.student_name}</h3>
                    {l.roll_no && (
                      <span className="text-xs font-mono text-gray-500">Roll: {l.roll_no}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {l.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Duration: {l.start_date} to {l.end_date}</span>
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 max-w-2xl">
                    <span className="font-semibold text-gray-700">Reason: </span>
                    {l.reason}
                  </p>

                  {l.action_remarks && (
                    <p className="text-[11px] text-gray-500 italic">
                      Remarks: {l.action_remarks} {l.action_by_name ? `(${l.action_by_name})` : ''}
                    </p>
                  )}
                </div>

                {l.status === 'PENDING' ? (
                  <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      onClick={() => setActionItem({ id: l.id, action: 'APPROVE', student_name: l.student_name })}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-xs active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setActionItem({ id: l.id, action: 'REJECT', student_name: l.student_name })}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition active:scale-95 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-left sm:text-right text-xs text-gray-400 font-mono">
                    Decided: {l.action_at || 'Recorded'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Dialog Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {actionItem.action === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Scholar: <strong className="text-gray-800">{actionItem.student_name}</strong>
            </p>

            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
              Teacher Remarks / Note:
            </label>
            <textarea
              rows={3}
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="e.g., Granted on medical grounds..."
              className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionItem(null)}
                className="py-2.5 text-xs font-medium rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={processing}
                className={`py-2.5 text-xs font-bold rounded-xl text-white transition text-center shadow-xs ${
                  actionItem.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {processing ? 'Processing...' : `Confirm ${actionItem.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
