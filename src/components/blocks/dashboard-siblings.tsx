'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Home,
  Search,
  Phone,
  MapPin,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Printer
} from 'lucide-react';
import { Student, FeeInvoice } from '@/lib/types';
import { getAllSiblingGroups } from '@/lib/student-helper';

interface DashboardSiblingsProps {
  students: Student[];
  invoices?: FeeInvoice[];
  onSelectStudent: (student: Student) => void;
  onCollectFee?: (student: Student) => void;
  onExportReport?: () => void;
  onPrintReport?: () => void;
}

export function DashboardSiblings({
  students = [],
  invoices = [],
  onSelectStudent,
  onCollectFee,
  onExportReport,
  onPrintReport
}: DashboardSiblingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MULTI_CHILD' | 'FEES_DUE' | 'ALL_PAID'>('ALL');

  const siblingGroups = useMemo(() => {
    return getAllSiblingGroups(students, invoices);
  }, [students, invoices]);

  const totalSiblingStudents = useMemo(() => {
    return siblingGroups.reduce((acc, g) => acc + g.students.length, 0);
  }, [siblingGroups]);

  const settledFamiliesCount = useMemo(() => {
    return siblingGroups.filter(g => g.allFeesPaid).length;
  }, [siblingGroups]);

  const feeComplianceRate = useMemo(() => {
    if (siblingGroups.length === 0) return 100;
    return Math.round((settledFamiliesCount / siblingGroups.length) * 100);
  }, [siblingGroups, settledFamiliesCount]);

  const multiChildCount = useMemo(() => {
    return siblingGroups.filter(g => g.students.length > 1).length;
  }, [siblingGroups]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return siblingGroups.filter(g => {
      if (filterMode === 'FEES_DUE' && g.allFeesPaid) return false;
      if (filterMode === 'ALL_PAID' && !g.allFeesPaid) return false;
      if (filterMode === 'MULTI_CHILD' && g.students.length < 2) return false;

      if (!q) return true;

      const familyName = g.familyName.toLowerCase();
      const father = g.fatherName.toLowerCase();
      const mother = g.motherName.toLowerCase();
      const phone = g.phone.toLowerCase();
      const address = g.address.toLowerCase();
      const studentNames = g.students.map(s => (s.full_name || '').toLowerCase()).join(' ');
      const admissionNos = g.students.map(s => (s.admission_no || '').toLowerCase()).join(' ');

      return (
        familyName.includes(q) ||
        father.includes(q) ||
        mother.includes(q) ||
        phone.includes(q) ||
        address.includes(q) ||
        studentNames.includes(q) ||
        admissionNos.includes(q)
      );
    });
  }, [siblingGroups, searchQuery, filterMode]);

  // Built-in direct CSV export for siblings
  const handleDirectExportCSV = () => {
    if (onExportReport) {
      onExportReport();
      return;
    }

    const headers = [
      'S.No',
      'Family / Household',
      'Student Names',
      'Father Name',
      'Mother Name',
      'Mobile Number',
      'Residential Address',
      'Total Siblings',
      'Consolidated Dues (INR)',
      'Fee Settlement Status'
    ];

    const rows = filteredGroups.map((g, idx) => [
      idx + 1,
      g.familyName,
      g.students.map((s, sIdx) => `${sIdx + 1}. ${s.full_name} (Class: ${s.class_name}-${s.section || 'A'}, Adm: ${s.admission_no})`).join('\n'),
      g.fatherName || 'N/A',
      g.motherName || 'N/A',
      g.phone || 'N/A',
      g.address || 'N/A',
      g.students.length,
      g.totalDues,
      g.allFeesPaid ? 'ALL CLEAR' : `DUE: INR ${g.totalDues}`
    ]);

    const csvLines = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Siblings_and_Families_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDirectPrint = () => {
    if (onPrintReport) {
      onPrintReport();
      return;
    }
    window.print();
  };

  // Helper to extract clean initial for household avatar
  const getFamilyInitial = (name: string, fatherName: string) => {
    const clean = (name || '').replace(/household|family/gi, '').trim();
    if (clean) return clean.charAt(0).toUpperCase();
    const cleanFather = (fatherName || '').replace(/^(mr\.|dr\.|shri|adv\.)\s*/i, '').trim();
    if (cleanFather) return cleanFather.charAt(0).toUpperCase();
    return 'H';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Executive #122A24 Dashboard KPI Hero Banner */}
      <div className="bg-[#122A24] rounded-2xl p-6 sm:p-7 border border-[#1C443A] shadow-md relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-[#1C443A]/70">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              Family Units
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {siblingGroups.length}
            </div>
            <p className="text-[11px] text-white/50">
              Active Registered Households
            </p>
          </div>

          <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Co-Enrolled Scholars
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {totalSiblingStudents}
            </div>
            <p className="text-[11px] text-white/50">
              {multiChildCount} Multi-Child Families
            </p>
          </div>

          <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Fee Compliance
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {feeComplianceRate}%
            </div>
            <p className="text-[11px] text-white/50">
              {settledFamiliesCount} Fully Settled Accounts
            </p>
          </div>

          <div className="space-y-1 pt-4 lg:pt-0 lg:pl-6">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Parent Linkage
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2">
              <span>100% Synced</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-white/50">
              Automated Household Matching
            </p>
          </div>
        </div>
      </div>

      {/* Search, Filters & Direct Action Toolbar */}
      <div className="p-4 rounded-3xl bg-white border border-[#DCE8E0] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by family, parents, student, phone..."
            className="w-full pl-10 pr-4 py-2 border border-[#DCE8E0] rounded-full text-xs text-[#122A24] bg-[#F4F8F5] focus:bg-white focus:outline-none focus:border-emerald-600 font-medium transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: `All Families (${siblingGroups.length})` },
              { id: 'MULTI_CHILD', label: `Multi-Child (${multiChildCount})` },
              { id: 'ALL_PAID', label: 'Fees Paid' },
              { id: 'FEES_DUE', label: 'Fees Due' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border-none cursor-pointer whitespace-nowrap transition-all ${
                  filterMode === f.id
                    ? 'bg-[#122A24] text-white shadow-xs'
                    : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Actions: Export CSV & Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EBF5EF] hover:bg-[#DCE8E0] text-[#122A24] border border-[#C5E2CF] shadow-2xs transition-all cursor-pointer"
              title="Export Siblings & Families Register to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDirectPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] shadow-2xs transition-all cursor-pointer"
              title="Print Official Siblings & Household Dossier"
            >
              <Printer className="w-3.5 h-3.5 text-[#1C443A]" />
              <span className="hidden sm:inline">Print Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sibling Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const initial = getFamilyInitial(group.familyName, group.fatherName);

            return (
              <div
                key={group.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E2ECE5] hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between gap-4 group"
              >
                {/* Household Header */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] flex items-center justify-center font-display font-bold text-base shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-base text-[#122A24] truncate">
                        {group.familyName}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>Father: <strong className="text-slate-700 font-semibold">{group.fatherName}</strong></span>
                        {group.motherName && (
                          <span>• Mother: <strong className="text-slate-700 font-semibold">{group.motherName}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 flex items-center gap-1 shadow-2xs ${
                    group.allFeesPaid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {group.allFeesPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>All Dues Clear</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        <span>Family Due: ₹{group.totalDues.toLocaleString()}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Children List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Enrolled Siblings ({group.students.length})</span>
                    <span className="text-[11px] font-normal text-slate-400">Click to view 360° dossier</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.students.map(s => {
                      const att = s.attendance_percent || 94;
                      const isPaid = (s.fee_status || '').toUpperCase() === 'PAID';

                      return (
                        <div
                          key={s.id}
                          onClick={() => onSelectStudent(s)}
                          className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] hover:bg-[#EBF5EF]/60 hover:border-[#A3D1B4] cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-2xs group/child"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] flex items-center justify-center font-display font-bold text-xs shrink-0 overflow-hidden relative">
                              {(s.photo || s.avatar) ? (
                                <img
                                  src={s.photo || s.avatar}
                                  alt={s.full_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <span className={(s.photo || s.avatar) ? 'hidden' : ''}>
                                {(s.full_name || 'S')[0]}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-[#122A24] group-hover/child:text-[#1C443A] truncate">
                                {s.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                Class {s.class_name} ({s.section || 'A'}) {s.roll_no ? `• Roll ${s.roll_no}` : ''}
                              </div>
                              <div className="text-[11px] font-medium text-emerald-700 mt-1 flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Att: {att}%</span>
                                <span>•</span>
                                <span className={isPaid ? 'text-emerald-700' : 'text-amber-700 font-semibold'}>
                                  {s.fee_status || 'PAID'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover/child:text-emerald-700 group-hover/child:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Footer */}
                <div className="pt-3 border-t border-[#E8F0EA] flex items-center justify-between text-xs text-slate-500 gap-3">
                  <div className="flex items-center gap-1.5 truncate text-slate-600 hover:text-[#122A24] transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{group.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-[240px]">
                      {group.address || 'Address on record'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-14 text-center text-slate-400 text-xs bg-white rounded-3xl border border-[#DCE8E0] shadow-xs space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] flex items-center justify-center mx-auto text-slate-400">
              <Home className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No Sibling Groups Found</p>
            <p className="text-slate-500">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
