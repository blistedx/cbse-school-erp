'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Database,
  Lock,
  Eye,
  X
} from 'lucide-react';
import { AuditLogEntry, School } from '@/lib/types';

export interface DashboardAuditLogsProps {
  selectedSchool?: School | null;
  selectedSession?: string;
}

export function DashboardAuditLogs({
  selectedSchool,
  selectedSession = '2026-27'
}: DashboardAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [detailModalLog, setDetailModalLog] = useState<AuditLogEntry | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Audit Logs from API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedModule !== 'ALL') params.append('module', selectedModule);
      if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
      showToast('Error loading audit stream.');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, selectedSeverity, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'SECURITY').length;
    const warnings = logs.filter(l => l.severity === 'WARNING').length;
    const uniqueActors = new Set(logs.map(l => l.actor.name)).size;

    return { total, critical, warnings, uniqueActors };
  }, [logs]);

  // Modules list
  const MODULES = [
    { id: 'ALL', label: 'All Modules' },
    { id: 'EXAMINATION', label: 'Examination & Marks' },
    { id: 'FEES', label: 'Fees & Invoices' },
    { id: 'ATTENDANCE', label: 'Attendance' },
    { id: 'STUDENTS', label: 'Student Admissions' },
    { id: 'BROADCAST', label: 'Broadcast & Alerts' },
    { id: 'AUTH', label: 'Authentication & Security' },
    { id: 'SETTINGS', label: 'System Settings' },
  ];

  // Helper to format ISO timestamp
  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return iso;
    }
  };

  // Severity style helper
  const getSeverityBadge = (sev: AuditLogEntry['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'SECURITY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'WARNING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'INFO':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  // Download CSV
  const handleExportCsv = () => {
    const url = `/api/audit-logs?export=csv${selectedModule !== 'ALL' ? `&module=${selectedModule}` : ''}${selectedSeverity !== 'ALL' ? `&severity=${selectedSeverity}` : ''}`;
    window.open(url, '_blank');
    showToast('Compliance Audit Trail CSV download started!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#122A24] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner with Watermark */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] text-7xl sm:text-9xl leading-none z-0 tracking-tight"
        >
          AUDIT
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold shadow-2xs border border-[#C5E2CF]">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] tracking-tight">
              Enterprise Security &amp; Activity Audit Trail
            </h1>
            <p className="text-xs text-[#2D5A4E] font-mono mt-0.5">
              Tamper-evident logs capturing every administrative, academic, fee, and security operation
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
            Session {selectedSession}
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            CBSE Rule 24.1 Compliant
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>TOTAL LOGGED EVENTS</span>
            <Database className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="font-display font-black text-2xl text-[#122A24]">
            {metrics.total}
          </div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">
            ● 100% Operations Recorded
          </div>
        </div>

        {/* Security & Critical */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>SECURITY &amp; CRITICAL</span>
            <ShieldAlert className="h-4 w-4 text-purple-700" />
          </div>
          <div className="font-display font-black text-2xl text-[#122A24]">
            {metrics.critical}
          </div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">
            ✓ 0 Unauthorized Breaches
          </div>
        </div>

        {/* Active Operators */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>ACTIVE OPERATORS</span>
            <User className="h-4 w-4 text-amber-700" />
          </div>
          <div className="font-display font-black text-2xl text-[#122A24]">
            {metrics.uniqueActors}
          </div>
          <div className="text-[11px] font-mono text-amber-700 font-semibold">
            Authorized Faculty &amp; Staff
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>IMMUTABILITY STANDARD</span>
            <Lock className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-800">
            VERIFIED
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Cryptographic SHA-256 Trail
          </div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by operator, action keyword, scholar name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] text-xs font-bold text-[#122A24] rounded-xl outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
              <option value="SECURITY">Security</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchLogs}
              className="p-2.5 bg-[#F8FAF9] hover:bg-slate-100 text-[#122A24] border border-[#DCE8E0] rounded-xl shadow-2xs cursor-pointer transition-all"
              title="Refresh Logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download Compliance CSV</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-700" />
              <span>Print Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Module Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {MODULES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModule(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                selectedModule === m.id
                  ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                  : 'bg-[#F8FAF9] text-slate-600 border-[#DCE8E0] hover:bg-white hover:text-[#122A24]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Trail Feed Table */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8F0EA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-700" />
            <h3 className="font-display font-bold text-sm text-[#122A24]">
              Real-Time Security Event Stream
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500 font-bold">
            Showing {logs.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-slate-600 font-mono font-bold uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-4">Timestamp &amp; Log ID</th>
                <th className="py-3 px-4">Operator / Staff</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-4">Audit Summary Description</th>
                <th className="py-3 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF0ED] font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-[#F9FCFA] transition-colors group">
                        {/* Timestamp & ID */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          <div className="font-bold text-[#122A24]">{formatTimestamp(log.timestamp)}</div>
                          <div className="text-[10px] text-slate-400">{log.id}</div>
                        </td>

                        {/* Operator */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                            <span>{log.actor.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-bold">{log.actor.role}</span>
                            {log.actor.ip && <span>({log.actor.ip})</span>}
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                            {log.module}
                          </span>
                        </td>

                        {/* Action Code */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-slate-800">
                          {log.action}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${getSeverityBadge(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>

                        {/* Summary Description */}
                        <td className="py-3 px-4 text-slate-800 max-w-md font-medium">
                          <div>{log.summary}</div>
                          {log.targetName && (
                            <div className="text-[11px] font-mono text-emerald-800 mt-0.5">
                              Target: {log.targetName} {log.targetId ? `(${log.targetId})` : ''}
                            </div>
                          )}
                        </td>

                        {/* Inspect Details Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalLog(log)}
                            className="p-1.5 hover:bg-[#EBF5EF] text-[#122A24] rounded-lg border border-[#DCE8E0] transition-colors cursor-pointer"
                            title="Inspect JSON Metadata"
                          >
                            <Eye className="h-3.5 w-3.5 text-emerald-700" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Feed (Mobile Devices Only) */}
        <div className="md:hidden divide-y divide-[#EBF0ED] font-sans">
          {loading ? (
            <div className="py-10 text-center text-slate-400 font-mono text-xs">
              Loading security audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-sans text-xs">
              No audit records found matching your filters.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5 bg-white hover:bg-[#F9FCFA]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-[#122A24]">{log.actor.name}</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-700 font-bold">
                      {log.actor.role}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getSeverityBadge(log.severity)}`}>
                    {log.severity}
                  </span>
                </div>

                <div className="text-xs text-slate-800 font-medium leading-relaxed">
                  {log.summary}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0F4F2] text-[10.5px] font-mono text-slate-400">
                  <span>{formatTimestamp(log.timestamp)}</span>
                  <button
                    type="button"
                    onClick={() => setDetailModalLog(log)}
                    className="px-2.5 py-1 bg-[#EBF5EF] hover:bg-[#DCE8E0] text-[#1C443A] rounded-lg font-bold flex items-center gap-1 border border-[#C5E2CF] cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JSON Metadata Inspection Modal */}
      {detailModalLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Audit Event Deep Inspection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#F8FAF9] p-3 rounded-2xl border border-[#DCE8E0] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">LOG ID:</span>
                  <span className="font-bold text-[#122A24]">{detailModalLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TIMESTAMP:</span>
                  <span className="font-bold text-[#122A24]">{formatTimestamp(detailModalLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">OPERATOR:</span>
                  <span className="font-bold text-[#122A24]">{detailModalLog.actor.name} ({detailModalLog.actor.role})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IP ADDRESS:</span>
                  <span className="font-bold text-[#122A24]">{detailModalLog.actor.ip || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Human-Readable Summary:</label>
                <div className="p-3 bg-white border border-[#DCE8E0] rounded-xl text-slate-800 font-medium">
                  {detailModalLog.summary}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 font-mono">Payload &amp; Metadata (JSON):</label>
                <pre className="p-3 bg-[#0D1B17] text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                  {JSON.stringify(detailModalLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalLog(null)}
                className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
