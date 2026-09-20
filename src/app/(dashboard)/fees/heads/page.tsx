'use client';
/*! CBSE School ERP — Fee Head Management Page */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  IndianRupee, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

export interface FeeHeadItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: 'recurring' | 'one-time';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'term';
  isRefundable?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export default function FeeHeadsPage() {
  const [heads, setHeads] = useState<FeeHeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [form, setForm] = useState<{
    name: string;
    code: string;
    type: 'recurring' | 'one-time';
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'term';
    isRefundable: boolean;
  }>({
    name: '',
    code: '',
    type: 'recurring',
    frequency: 'monthly',
    isRefundable: false
  });

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/finance');
      const data = await res.json();
      if (data.success) {
        setHeads(data.fee_heads || []);
      } else {
        showNotification(data.error || 'Failed to load fee heads', 'error');
      }
    } catch (err: any) {
      console.error('[FetchHeads Error]', err);
      showNotification('Network error loading fee heads', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeads();
  }, [fetchHeads]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      code: '',
      type: 'recurring',
      frequency: 'monthly',
      isRefundable: false
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (head: FeeHeadItem) => {
    setEditingId((head as any)._id || head.id || null);
    setForm({
      name: head.name,
      code: head.code,
      type: (head as any).type || 'recurring',
      frequency: (head.frequency || 'monthly').toLowerCase() as any,
      isRefundable: Boolean((head as any).isRefundable || head.is_refundable)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      showNotification('Please fill in Fee Name and Code', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = '/api/finance';
      const payload = {
        action: 'save_fee_head',
        id: editingId || undefined,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        frequency: form.frequency.toUpperCase(),
        is_refundable: form.isRefundable,
        category: 'ACADEMIC'
      };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(editingId ? 'Fee head updated successfully!' : 'Fee head created successfully!', 'success');
        setShowModal(false);
        setEditingId(null);
        setForm({ name: '', code: '', type: 'recurring', frequency: 'monthly', isRefundable: false });
        fetchHeads();
      } else {
        showNotification(data.error || 'Failed to save fee head', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error processing request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to deactivate this fee head?')) return;

    try {
      const res = await apiFetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_fee_head', id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Fee head deactivated', 'info');
        fetchHeads();
      } else {
        showNotification(data.error || 'Failed to delete fee head', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error deleting fee head', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-slate-800 p-4 sm:p-8 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
          'bg-[#122A24] text-white border-[#1C443A]'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs">
          <div className="flex items-center gap-3">
            <Link 
              href="/app" 
              className="p-2.5 rounded-2xl bg-[#EBF5EF] hover:bg-[#DCE8E0] text-[#122A24] transition cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#122A24] flex items-center gap-2.5 font-display tracking-tight">
                <div className="p-2 rounded-xl bg-[#122A24] text-[#10B981]">
                  <IndianRupee className="w-5 h-5" />
                </div>
                Fee Heads Master
              </h1>
              <p className="text-xs text-[#2D5A4E] mt-0.5">
                Manage all institutional tuition, transport, annual & composite fee components
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHeads()}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-[#DCE8E0] hover:bg-[#F4F8F5] text-[#122A24] transition cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#122A24] text-white rounded-2xl text-xs font-bold hover:bg-[#1C443A] transition shadow-xs cursor-pointer border-none"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Fee Head
            </button>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#DCE8E0] bg-[#F4F8F5]/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#122A24]">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Active Institutional Heads ({heads.length})</span>
            </div>
            <span className="text-[11px] text-[#2D5A4E]">CBSE Compliant Slabs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F8F5] text-[#122A24] font-bold border-b border-[#DCE8E0]">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Frequency</th>
                  <th className="p-4 text-center">Refundable</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE8E0]/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading fee heads...
                    </td>
                  </tr>
                ) : heads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No fee heads configured yet. Click <strong>Add Fee Head</strong> to create one.
                    </td>
                  </tr>
                ) : (
                  heads.map((h: any) => (
                    <tr key={h._id || h.id || h.code} className="hover:bg-[#F4F8F5]/60 transition">
                      <td className="p-4 font-bold text-[#122A24] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {h.name}
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span className="px-2.5 py-1 bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-lg text-xs">
                          {h.code}
                        </span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          h.type === 'one-time' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {h.type || 'recurring'}
                        </span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                          {h.frequency || 'monthly'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {h.isRefundable ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Yes (Caution)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(h)}
                            className="p-1.5 hover:bg-[#EBF5EF] text-slate-600 hover:text-[#122A24] rounded-lg cursor-pointer transition"
                            title="Edit Head"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(h._id || h.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                            title="Deactivate Head"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[#DCE8E0] space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-[#DCE8E0]">
                <h2 className="text-lg font-bold text-[#122A24] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {editingId ? 'Edit Fee Head' : 'Add New Fee Head'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F4F8F5] text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#122A24] block mb-1.5">Fee Head Name *</label>
                  <input
                    placeholder="e.g. Tuition Fee, Exam Fee, Lab Fee"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-[#DCE8E0] rounded-xl px-3.5 py-2.5 font-medium text-[#122A24] focus:ring-2 focus:ring-[#122A24] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#122A24] block mb-1.5">Short Code *</label>
                  <input
                    placeholder="e.g. TUI, EXAM, LAB, TRN"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full border border-[#DCE8E0] rounded-xl px-3.5 py-2.5 font-mono font-bold text-[#122A24] focus:ring-2 focus:ring-[#122A24] outline-none uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#122A24] block mb-1.5">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                      className="w-full border border-[#DCE8E0] rounded-xl px-3 py-2.5 font-medium text-[#122A24] bg-white outline-none"
                    >
                      <option value="recurring">Recurring</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#122A24] block mb-1.5">Billing Frequency</label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
                      className="w-full border border-[#DCE8E0] rounded-xl px-3 py-2.5 font-medium text-[#122A24] bg-white outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="term">Term-wise</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRefundable"
                    checked={form.isRefundable}
                    onChange={(e) => setForm({ ...form, isRefundable: e.target.checked })}
                    className="rounded border-[#DCE8E0] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isRefundable" className="font-medium text-[#122A24] cursor-pointer">
                    Refundable Caution / Security Deposit
                  </label>
                </div>

                <div className="flex gap-3 pt-3 border-t border-[#DCE8E0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-[#DCE8E0] text-slate-700 rounded-xl py-2.5 font-bold hover:bg-[#F4F8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#122A24] text-white rounded-xl py-2.5 font-bold hover:bg-[#1C443A] shadow-xs cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                    {editingId ? 'Update Head' : 'Save Head'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
