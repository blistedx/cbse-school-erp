'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Plus, 
  Search, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Users, 
  Megaphone,
  X
} from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  target_audience: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  author_name: string;
  created_at?: string;
}

export default function ClassNoticesPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'PARENTS'>('PARENTS');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/class/notices');
      const data = await res.json();
      if (data.success) {
        setClassName(data.class_name);
        setSection(data.section);
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load class notices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setBroadcasting(true);
      setFeedback(null);
      const res = await fetch('/api/teacher/class/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          target_audience: targetAudience,
          priority
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Notice broadcasted successfully to Class ${className}-${section} ${targetAudience.toLowerCase()}!`
        });
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        fetchNotices();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to dispatch notice' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Class Notices &amp; Parent Broadcasts</h1>
          <p className="text-emerald-100/70 text-sm mt-1">
            Dispatch circulars, field trip permissions, and academic announcements directly to your class.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#122A24] transition shadow-sm"
        >
          <Megaphone className="w-4 h-4" />
          Broadcast Class Notice
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
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Broadcasts: <strong className="text-gray-900">{notices.length}</strong>
        </div>
      </div>

      {/* Notices Stream */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
            Loading class circulars...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BellRing className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-700">No circulars broadcasted yet</p>
            <p className="text-xs text-gray-500 mt-1">Broadcast an announcement to communicate with parents.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotices.map((n) => (
              <div key={n.id} className="p-5 hover:bg-gray-50/70 transition space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      n.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {n.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      To: {n.target_audience}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
                  {n.content}
                </p>

                <p className="text-[11px] text-gray-400">
                  Author: <span className="text-gray-600 font-medium">{n.author_name}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Broadcast Class Notice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Circular Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Upcoming Science Exhibition Preparation"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Audience:
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="PARENTS">Parents Only</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="ALL">Students &amp; Parents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Notice Content:
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write announcement details..."
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  disabled={broadcasting || !title.trim() || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcasting ? 'Broadcasting...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
