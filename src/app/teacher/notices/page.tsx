'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Search, 
  RefreshCw, 
  Calendar, 
  Tag, 
  Building2, 
  Pin,
  CheckCircle2
} from 'lucide-react';

interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  category?: string;
  target_audience?: string;
  priority?: string;
  author_name?: string;
  posted_by?: string;
  is_pinned?: boolean;
  created_at?: string;
  date?: string;
}

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('ALL');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = notices.filter(n => {
    const matchesAud = filterAudience === 'ALL' || (n.target_audience || 'ALL').toUpperCase() === filterAudience;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.author_name && n.author_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAud && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#122A24] text-white p-6 rounded-2xl shadow-sm border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Notice Board
            </span>
            <span className="text-emerald-300/60 text-xs">Official School Circulars</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notices &amp; Administrative Circulars</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Institutional announcements, academic calendars, staff circulars, and principal orders.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/40 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Circulars
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'STAFF', 'TEACHERS', 'PARENTS', 'STUDENTS'].map(aud => (
            <button
              key={aud}
              onClick={() => setFilterAudience(aud)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filterAudience === aud
                  ? 'bg-[#122A24] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {aud === 'ALL' ? 'All Circulars' : aud}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search circular..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Notices Stream */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading circulars...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BellRing className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No circulars matching your criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(n => {
              const dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString() : (n.date || 'Active');
              return (
                <div key={n.id} className="p-6 hover:bg-gray-50/70 transition space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {n.is_pinned && (
                        <span className="p-1 rounded bg-amber-100 text-amber-800" title="Pinned Announcement">
                          <Pin className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <h3 className="text-base font-bold text-gray-900">{n.title}</h3>
                      {n.priority && n.priority !== 'NORMAL' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {n.priority}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100 whitespace-pre-line font-normal">
                    {n.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>
                      Issued By: <strong className="text-gray-700">{n.author_name || n.posted_by || 'Principal Office'}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                      Audience: {n.target_audience || 'School Wide'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
