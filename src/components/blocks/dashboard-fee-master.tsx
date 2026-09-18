'use client';
/*! Giterp Fee Master — Unified Dashboard UI v1.0.0 */
/**
 * dashboard-fee-master.tsx — ONE page with:
 * - Left: report picker (grouped by category)
 * - Top: universal filter bar
 * - KPI strip with live updates
 * - Summary chart above table
 * - Data table with drill-down
 * - Quick actions
 * - Fee Configuration tab
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, PieChart, Calendar, CreditCard, UserCheck, FileText, AlertTriangle,
  Clock, Phone, ClipboardList, GraduationCap, Bus, Building, Percent,
  Users, Tag, ShieldCheck, TrendingUp, Activity, ArrowRightLeft, RotateCcw,
  XCircle, ArrowUpRight, BookOpen, Search, Download, Printer, Filter,
  Plus, Settings, ChevronRight, ChevronDown, RefreshCw, Send, X,
  DollarSign, School, IndianRupee, Receipt, Wallet, BadgePercent,
  CircleDollarSign, Calculator, FileSpreadsheet, CheckCircle2, AlertCircle,
  Banknote, Coins, ArrowDownRight, ArrowUpCircle, ChevronLeft,
} from 'lucide-react';
import { School as SchoolType, Student, FeeAggregateRow, FeeConfig, AcademicMonth } from '@/lib/types';
import { ALL_REPORT_PRESETS, PRESETS_BY_CATEGORY, type ReportPreset } from '@/lib/fee-report-presets';
import { ACADEMIC_MONTHS, formatPaise, paiseToRupees } from '@/lib/fee-constants';
import { apiFetch } from '@/lib/api-client';

// ─── Props ───

interface FeeMasterProps {
  school?: SchoolType | null;
  students?: Student[];
  apiToken?: string;
  selectedSession?: string;
}

// ─── Icons map ───

const ICON_MAP: Record<string, React.ReactNode> = {
  Calendar: <Calendar className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  PieChart: <PieChart className="w-4 h-4" />,
  School: <School className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  UserCheck: <UserCheck className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  Bus: <Bus className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
  Percent: <Percent className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  ArrowRightLeft: <ArrowRightLeft className="w-4 h-4" />,
  RotateCcw: <RotateCcw className="w-4 h-4" />,
  XCircle: <XCircle className="w-4 h-4" />,
  ArrowUpRight: <ArrowUpRight className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  COLLECTION: { label: 'Collection', icon: <Coins className="w-4 h-4" />, color: 'text-emerald-600' },
  DUES_OUTSTANDING: { label: 'Dues & Outstanding', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' },
  CONCESSIONS: { label: 'Concessions', icon: <BadgePercent className="w-4 h-4" />, color: 'text-blue-600' },
  ANALYTICS: { label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-600' },
};

const MONTH_LABELS: Record<AcademicMonth, string> = {
  APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September',
  OCT: 'October', NOV: 'November', DEC: 'December', JAN: 'January', FEB: 'February', MAR: 'March',
};

// ─── Component ───

export function DashboardFeeMaster({ school, students = [], apiToken, selectedSession = '2026-27' }: FeeMasterProps) {
  // ─── State ───
  const [activeTab, setActiveTab] = useState<'reports' | 'config'>('reports');
  const [selectedPreset, setSelectedPreset] = useState<ReportPreset>(ALL_REPORT_PRESETS[0]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    COLLECTION: true, DUES_OUTSTANDING: false, CONCESSIONS: false, ANALYTICS: false,
  });

  // Filter state
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMonths, setFilterMonths] = useState<AcademicMonth[]>([]);
  const [filterClasses, setFilterClasses] = useState<string[]>([]);
  const [filterFeeHeads, setFilterFeeHeads] = useState<string[]>([]);
  const [filterPaymentModes, setFilterPaymentModes] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');

  // Data state
  const [reportData, setReportData] = useState<FeeAggregateRow[]>([]);
  const [kpiData, setKpiData] = useState<FeeAggregateRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Quick action modals
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);

  // ─── Classes from students ───
  const availableClasses = useMemo(() => {
    const classes = new Set((students || []).map(s => s.class_name));
    return Array.from(classes).filter(Boolean).sort();
  }, [students]);

  // ─── API helper ───
  const fetchApi = useCallback(async (path: string, params: Record<string, string> = {}) => {
    const url = new URL(`/api/fee-master${path}`, window.location.origin);
    url.searchParams.set('session', selectedSession);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    const headers: Record<string, string> = {};
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
    const res = await apiFetch(url.toString(), { headers });
    return res.json();
  }, [apiToken, selectedSession]);

  // ─── Load report data ───
  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        action: 'preset',
        preset_id: selectedPreset.id,
      };
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterMonths.length > 0) params.months = filterMonths.join(',');
      if (filterClasses.length > 0) params.classes = filterClasses.join(',');
      if (filterFeeHeads.length > 0) params.fee_heads = filterFeeHeads.join(',');
      if (filterPaymentModes.length > 0) params.payment_modes = filterPaymentModes.join(',');

      const data = await fetchApi('', params);
      if (data.success) {
        setReportData(data.rows || []);
      }
    } catch (e) {
      console.error('Failed to load report:', e);
    }
    setIsLoading(false);
  }, [fetchApi, selectedPreset, filterDateFrom, filterDateTo, filterMonths, filterClasses, filterFeeHeads, filterPaymentModes]);

  // ─── Load KPIs ───
  const loadKPIs = useCallback(async () => {
    try {
      const data = await fetchApi('', { action: 'aggregate' });
      if (data.success && data.rows?.length > 0) {
        setKpiData(data.rows[0]);
      }
    } catch (e) {
      console.error('Failed to load KPIs:', e);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadReport();
    loadKPIs();
  }, [loadReport, loadKPIs]);

  // ─── Toggle category ───
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ─── Export CSV ───
  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = selectedPreset.columns;
    const rows = reportData.map(row => {
      const dims = Object.values(row.dimensions || {});
      return [...dims, row.demand, row.collected, row.discount, row.waiver, row.balance, row.studentCount]
        .map(v => typeof v === 'number' ? paiseToRupees(v) : v);
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPreset.id}_${selectedSession}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Demand generation ───
  const generateDemand = async (month: AcademicMonth) => {
    try {
      const res = await fetch('/api/fee-master/demand', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: selectedSession, month }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Demand generated: ${data.created} lines created, ${data.skipped} skipped`);
        loadReport();
        loadKPIs();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (e) {
      alert('Failed to generate demand');
    }
    setShowDemandModal(false);
  };

  // ─── Render ───
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* ─── LEFT SIDEBAR: Report Picker ─── */}
      <aside className={`${sidebarCollapsed ? 'w-12' : 'w-72'} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Sidebar header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Fee Master</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-2">
            {/* Tab switcher */}
            <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 inline mr-1" />Reports
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-all ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-3.5 h-3.5 inline mr-1" />Config
              </button>
            </div>

            {activeTab === 'reports' && (
              <div className="space-y-1">
                {Object.entries(PRESETS_BY_CATEGORY).map(([cat, presets]) => {
                  const catInfo = CATEGORY_LABELS[cat];
                  return (
                    <div key={cat}>
                      <button
                        onClick={() => toggleCategory(cat)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold ${catInfo.color} hover:bg-gray-50 dark:hover:bg-gray-700`}
                      >
                        {catInfo.icon}
                        <span className="flex-1 text-left">{catInfo.label}</span>
                        <span className="text-gray-400 text-[10px]">{presets.length}</span>
                        {expandedCategories[cat] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      {expandedCategories[cat] && (
                        <div className="ml-2 space-y-0.5 mt-0.5">
                          {presets.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedPreset(p)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${
                                selectedPreset.id === p.id
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {ICON_MAP[p.icon] || <FileText className="w-4 h-4" />}
                              <span className="truncate">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <FeeConfigPanel school={school} apiToken={apiToken} session={selectedSession} />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ─── TOP: Filter Bar ─── */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>

          {/* Date range */}
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 w-32"
            placeholder="From"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 w-32"
            placeholder="To"
          />

          {/* Month multi-select */}
          <select
            multiple
            value={filterMonths}
            onChange={e => setFilterMonths(Array.from(e.target.selectedOptions, o => o.value as AcademicMonth))}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-200 h-7 min-w-[80px]"
            title="Filter by months"
          >
            {ACADEMIC_MONTHS.map(m => (
              <option key={m} value={m}>{MONTH_LABELS[m]}</option>
            ))}
          </select>

          {/* Class filter */}
          <select
            value={filterClasses[0] || ''}
            onChange={e => setFilterClasses(e.target.value ? [e.target.value] : [])}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 w-32"
          >
            <option value="">All Classes</option>
            {availableClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Student search */}
          <div className="relative flex-1 min-w-[150px] max-w-[250px]">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Search student..."
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-md pl-7 pr-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 w-full"
            />
          </div>

          {/* Quick actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setShowCollectModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Collect Fee
            </button>
            <button
              onClick={() => setShowDemandModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5" /> Generate Demand
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { loadReport(); loadKPIs(); }}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── KPI Strip ─── */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="grid grid-cols-5 gap-4">
            <KpiCard
              label="Total Demand"
              value={kpiData ? formatPaise(kpiData.demand) : '—'}
              icon={<IndianRupee className="w-4 h-4" />}
              color="text-gray-800 dark:text-gray-200"
              bgColor="bg-gray-50 dark:bg-gray-700/50"
            />
            <KpiCard
              label="Collected"
              value={kpiData ? formatPaise(kpiData.collected) : '—'}
              icon={<Banknote className="w-4 h-4" />}
              color="text-emerald-700 dark:text-emerald-400"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            />
            <KpiCard
              label="Discount + Waiver"
              value={kpiData ? formatPaise(kpiData.discount + kpiData.waiver) : '—'}
              icon={<BadgePercent className="w-4 h-4" />}
              color="text-blue-700 dark:text-blue-400"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />
            <KpiCard
              label="Outstanding"
              value={kpiData ? formatPaise(kpiData.balance) : '—'}
              icon={<AlertCircle className="w-4 h-4" />}
              color="text-red-700 dark:text-red-400"
              bgColor="bg-red-50 dark:bg-red-900/20"
            />
            <KpiCard
              label="Collection %"
              value={kpiData && kpiData.demand > 0
                ? `${Math.round(((kpiData.collected + kpiData.discount + kpiData.waiver) / kpiData.demand) * 100)}%`
                : '—'}
              icon={<TrendingUp className="w-4 h-4" />}
              color="text-violet-700 dark:text-violet-400"
              bgColor="bg-violet-50 dark:bg-violet-900/20"
            />
          </div>
        </div>

        {/* ─── Report Header ─── */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {ICON_MAP[selectedPreset.icon] || <FileText className="w-4 h-4" />}
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedPreset.name}</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">— {selectedPreset.description}</span>
            <span className="ml-auto text-xs text-gray-400">{reportData.length} rows</span>
          </div>
        </div>

        {/* ─── Data Table ─── */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="ml-2 text-sm text-gray-500">Loading report...</span>
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <FileSpreadsheet className="w-10 h-10 mb-2" />
              <p className="text-sm">No data for this report.</p>
              <p className="text-xs mt-1">Try generating demand first or adjusting filters.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  {/* Dimension columns */}
                  {Object.keys(reportData[0]?.dimensions || {}).map(dim => (
                    <th key={dim} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      {dim.replace(/_/g, ' ')}
                    </th>
                  ))}
                  {/* Value columns */}
                  <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Demand</th>
                  <th className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-600">Collected</th>
                  <th className="px-3 py-2 text-right font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-600">Discount</th>
                  <th className="px-3 py-2 text-right font-semibold text-orange-600 dark:text-orange-400 border-b border-gray-200 dark:border-gray-600">Waiver</th>
                  <th className="px-3 py-2 text-right font-semibold text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-600">Balance</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                    {Object.values(row.dimensions || {}).map((val, i) => (
                      <td key={i} className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">
                        {val || '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatPaise(row.demand)}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatPaise(row.collected)}</td>
                    <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400">{formatPaise(row.discount)}</td>
                    <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400">{formatPaise(row.waiver)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${row.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatPaise(row.balance)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">{row.studentCount}</td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot className="bg-gray-100 dark:bg-gray-700 sticky bottom-0 border-t-2 border-gray-300 dark:border-gray-500 font-semibold">
                <tr>
                  {Object.keys(reportData[0]?.dimensions || {}).map((_, i) => (
                    <td key={i} className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {i === 0 ? 'TOTAL' : ''}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                    {formatPaise(reportData.reduce((s, r) => s + r.demand, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300">
                    {formatPaise(reportData.reduce((s, r) => s + r.collected, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-300">
                    {formatPaise(reportData.reduce((s, r) => s + r.discount, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-orange-700 dark:text-orange-300">
                    {formatPaise(reportData.reduce((s, r) => s + r.waiver, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-red-700 dark:text-red-300">
                    {formatPaise(reportData.reduce((s, r) => s + r.balance, 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                    {new Set(reportData.flatMap(r => Object.values(r.dimensions))).size}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Print footer */}
        <div className="hidden print:block px-4 py-2 text-xs text-gray-400 border-t">
          <p>{school.school_name} — {selectedPreset.name} — Session {selectedSession}</p>
          <p>Generated on {new Date().toLocaleString('en-IN')} | Fee Master v1.0</p>
        </div>
      </main>

      {/* ─── Demand Generation Modal ─── */}
      {showDemandModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-96 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Generate Monthly Demand</h3>
              <button onClick={() => setShowDemandModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Select a month to generate fee demand for all active students.
              This is idempotent — existing demands will not be duplicated.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ACADEMIC_MONTHS.map(m => (
                <button
                  key={m}
                  onClick={() => generateDemand(m)}
                  className="px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all text-gray-700 dark:text-gray-300"
                >
                  {MONTH_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Collect Fee Modal ─── */}
      {showCollectModal && (
        <CollectFeeModal
          students={students}
          apiToken={apiToken}
          session={selectedSession}
          onClose={() => { setShowCollectModal(false); loadReport(); loadKPIs(); }}
        />
      )}
    </div>
  );
}

// ─── KPI Card Sub-Component ───

function KpiCard({ label, value, icon, color, bgColor }: {
  label: string; value: string; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg px-3 py-2.5 flex items-center gap-3`}>
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Collect Fee Modal ───

function CollectFeeModal({ students, apiToken, session, onClose }: {
  students: Student[]; apiToken: string; session: string; onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [feeHead, setFeeHead] = useState<string>('TUITION');
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [month, setMonth] = useState<string>('APR');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = searchTerm.length >= 2
    ? students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admission_no || '').toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleSubmit = async () => {
    if (!selectedStudent || !amount) return;
    setIsSubmitting(true);

    try {
      const amountPaise = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountPaise) || amountPaise <= 0) {
        alert('Invalid amount');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/fee-master', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lines: [{
            student_id: selectedStudent.id,
            class_name: selectedStudent.class_name,
            section: selectedStudent.section || 'A',
            admission_no: selectedStudent.admission_no || '',
            academic_session: session,
            line_type: 'PAYMENT',
            fee_head: feeHead,
            month: month || null,
            amount: amountPaise,
            payment_mode: paymentMode,
            remarks: remarks || `Fee payment — ${feeHead}`,
          }],
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Payment of ₹${amount} recorded. Receipt: ${data.lines?.[0]?.receipt_no || 'Generated'}`);
        onClose();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (e) {
      alert('Failed to collect fee');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Collect Fee
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Student search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Student</label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedStudent.full_name}</span>
                <span className="text-xs text-gray-500">{selectedStudent.admission_no} — {selectedStudent.class_name}</span>
                <button onClick={() => setSelectedStudent(null)} className="ml-auto text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name or admission no..."
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
                />
                {filteredStudents.length > 0 && (
                  <div className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-gray-700 shadow-lg">
                    {filteredStudents.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudent(s); setSearchTerm(''); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-b border-gray-100 dark:border-gray-600 last:border-0"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">{s.full_name}</span>
                        <span className="text-gray-500 ml-2">{s.admission_no} — {s.class_name} {s.section}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount in rupees"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
              min="0"
              step="1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Fee Head */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fee Head</label>
              <select
                value={feeHead}
                onChange={e => setFeeHead(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                {['TUITION', 'ADMISSION', 'TRANSPORT', 'HOSTEL', 'EXAM', 'ACTIVITY', 'MISC'].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                {['CASH', 'UPI', 'CARD', 'CHEQUE', 'NEFT', 'ONLINE'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Month</label>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Annual/One-time</option>
                {ACADEMIC_MONTHS.map(m => (
                  <option key={m} value={m}>{MONTH_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional remarks"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedStudent || !amount || isSubmitting}
            className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSubmitting ? 'Recording...' : `Record Payment${amount ? ` of ₹${amount}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fee Configuration Panel ───

function FeeConfigPanel({ school, apiToken, session }: {
  school: SchoolType; apiToken: string; session: string;
}) {
  const [config, setConfig] = useState<FeeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/fee-master/config?session=${session}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` },
        });
        const data = await res.json();
        if (data.success) setConfig(data.config);
      } catch (e) {
        console.error('Failed to load config:', e);
      }
      setIsLoading(false);
    })();
  }, [apiToken, session]);

  if (isLoading) return <div className="text-center py-4"><RefreshCw className="w-4 h-4 animate-spin inline" /></div>;
  if (!config) return <p className="text-red-500 text-xs">Failed to load config</p>;

  return (
    <div className="space-y-4">
      {/* Tuition Structure */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" /> Tuition Structure
        </h4>
        <div className="space-y-1">
          {config.tuition_structure.map((ts, i) => (
            <div key={i} className="flex justify-between items-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs">
              <span className="text-gray-600 dark:text-gray-400">{ts.class_group}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatPaise(ts.monthly_fee_paise)}/mo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transport Slabs */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5" /> Transport Slabs
        </h4>
        <div className="space-y-1">
          {config.transport_slabs.map((ts, i) => (
            <div key={i} className="flex justify-between items-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs">
              <span className="text-gray-600 dark:text-gray-400">{ts.slab_name}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatPaise(ts.monthly_fee_paise)}/mo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hostel Rates */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" /> Hostel Rates
        </h4>
        <div className="space-y-1">
          {config.hostel_rates.map((hr, i) => (
            <div key={i} className="flex justify-between items-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs">
              <span className="text-gray-600 dark:text-gray-400">{hr.room_type}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatPaise(hr.monthly_fee_paise)}/mo + {formatPaise(hr.security_deposit_paise)} dep.
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Concession Rules */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <BadgePercent className="w-3.5 h-3.5" /> Concession Rules
        </h4>
        <div className="space-y-1">
          {config.concession_rules.map((cr, i) => (
            <div key={i} className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{cr.type}</span>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">{cr.rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Late Fee */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Late Fee Rules
        </h4>
        <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
          {formatPaise(config.late_fee_rules.amount_paise)} after {config.late_fee_rules.grace_days} days grace period (max {config.late_fee_rules.max_months} months)
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Last updated: {config.updated_at ? new Date(config.updated_at).toLocaleDateString('en-IN') : 'Never'} by {config.updated_by || 'System'}
      </p>
    </div>
  );
}

export default DashboardFeeMaster;
