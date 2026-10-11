/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Notice } from '@/lib/types';

export default function PrincipalNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [audienceFilter, setAudienceFilter] = useState('ALL_FILTER');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Notice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [category, setCategory] = useState('OFFICIAL');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/principal/notices');
      if (!res.ok) throw new Error('Failed to load notices');
      const json = await res.json();
      if (json.success && Array.isArray(json.notices)) {
        setNotices(json.notices);
      }
    } catch (err: any) {
      console.error('Fetch notices error:', err);
      setError(err.message || 'Unable to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Both title and circular content are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const effectiveAudience = targetAudience === 'CLASS' ? `CLASS:${selectedClass}` : targetAudience;

      const res = await fetch('/api/principal/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_audience: effectiveAudience,
          category,
          is_urgent: isUrgent
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotices(prev => [data.notice, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        setIsUrgent(false);
        setSuccessToast('Official circular successfully dispatched and archived.');
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        setFormError(data.error || 'Failed to dispatch circular.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while broadcasting notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    if (audienceFilter !== 'ALL_FILTER') {
      const aud = (n.target_audience || '').toUpperCase();
      if (audienceFilter === 'ALL' && aud !== 'ALL' && aud !== 'PUBLIC') return false;
      if (audienceFilter === 'STAFF' && !aud.includes('STAFF') && !aud.includes('TEACHER')) return false;
      if (audienceFilter === 'CLASS' && !aud.includes('CLASS') && !aud.includes('STUDENT')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchContent = (n.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & BROADCAST ACTION
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#122A24] tracking-tight">
            Official Circulars &amp; Broadcasts
          </h1>
          <p className="text-xs sm:text-sm text-[#2D5A4E] mt-0.5">
            Issue authorized school circulars to the whole school, staff and faculty, or specific classes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError('');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs shadow-md transition transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Broadcast Official Circular</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. AUDIENCE FILTERS & SEARCH
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DCE8E0]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL_FILTER', label: 'All Dispatches' },
            { id: 'ALL', label: 'Whole School' },
            { id: 'STAFF', label: 'Staff & Faculty Only' },
            { id: 'CLASS', label: 'Specific Classes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setAudienceFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                audienceFilter === f.id
                  ? 'bg-[#122A24] text-white'
                  : 'bg-[#F4F8F5] text-[#2D5A4E] hover:bg-[#EBF5EF]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#2D5A4E]/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search circulars by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs focus:outline-hidden text-[#122A24]"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. NOTICES FEED
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-[#DCE8E0] animate-pulse" />
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#DCE8E0] text-center max-w-md mx-auto my-6">
          <Megaphone className="w-12 h-12 text-[#2D5A4E]/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#122A24]">No circulars found</h3>
          <p className="text-xs text-[#2D5A4E] mt-1">
            Click "Broadcast Official Circular" above to issue a new notice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map(notice => {
            const isUrgent = (notice as any).is_pinned || notice.category === 'EMERGENCY';
            const aud = notice.target_audience || 'ALL';

            return (
              <div
                key={notice.id}
                className="bg-white p-6 rounded-3xl border border-[#DCE8E0] hover:border-[#10B981] transition shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#2D5A4E] bg-[#F4F8F5] px-2.5 py-0.5 rounded-md border border-[#DCE8E0]">
                      {notice.id}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                      aud.includes('STAFF')
                        ? 'bg-teal-100 text-teal-800'
                        : aud.includes('CLASS')
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      TARGET: {aud}
                    </span>

                    {isUrgent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>HIGH PRIORITY / URGENT</span>
                      </span>
                    )}

                    <span className="text-[11px] text-[#2D5A4E]/80 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2D5A4E]/60" />
                      <span>{notice.created_at ? new Date(notice.created_at).toLocaleString('en-GB') : 'Recent'}</span>
                    </span>
                  </div>

                  <span className="text-xs font-mono text-[#2D5A4E]">
                    Signatory: <strong>{notice.posted_by || 'Principal Office'}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#122A24] tracking-tight">
                  {notice.title}
                </h3>

                <p className="text-xs text-[#2D5A4E] leading-relaxed whitespace-pre-line bg-[#F8FAF9] p-4 rounded-2xl border border-[#E2EBE5]">
                  {notice.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DRAFT & BROADCAST CIRCULAR MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DCE8E0] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE8E0] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#122A24] text-white flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#122A24]">
                    Broadcast Official Circular
                  </h3>
                  <div className="text-[11px] font-mono text-[#2D5A4E]">
                    Direct Principal Transmission
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#2D5A4E] hover:bg-[#F4F8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1">
                  Target Recipient Audience <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('ALL')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      targetAudience === 'ALL'
                        ? 'bg-[#122A24] text-white border-[#122A24]'
                        : 'bg-[#F4F8F5] text-[#2D5A4E] border-[#DCE8E0]'
                    }`}
                  >
                    Whole School
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('STAFF')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      targetAudience === 'STAFF'
                        ? 'bg-[#122A24] text-white border-[#122A24]'
                        : 'bg-[#F4F8F5] text-[#2D5A4E] border-[#DCE8E0]'
                    }`}
                  >
                    Staff Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('CLASS')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      targetAudience === 'CLASS'
                        ? 'bg-[#122A24] text-white border-[#122A24]'
                        : 'bg-[#F4F8F5] text-[#2D5A4E] border-[#DCE8E0]'
                    }`}
                  >
                    Specific Class
                  </button>
                </div>
              </div>

              {/* Specific Class Selector */}
              {targetAudience === 'CLASS' && (
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1">
                    Select Recipient Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-medium text-[#122A24]"
                  >
                    {['Playgroup', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Circular Title */}
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1">
                  Circular Subject / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for CBSE Term 1 Periodic Assessments"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-[#10B981]"
                />
              </div>

              {/* Body Content */}
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1">
                  Circular Text / Directive Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the official notification body here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-hidden focus:border-[#10B981]"
                />
              </div>

              {/* Urgent Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentNotice"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="urgentNotice" className="text-xs font-medium text-[#122A24] cursor-pointer">
                  Mark as High Priority / Emergency Advisory
                </label>
              </div>

              {formError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE8E0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2D5A4E] hover:bg-[#F4F8F5] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{submitting ? 'Transmitting...' : 'Dispatch Circular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
