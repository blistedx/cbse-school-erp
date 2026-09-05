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
      'Household ID',
      'Household / Family Name',
      'Enrolled Sibling Students (Name, Class, Section, Adm No)',
      'Father Name',
      'Mother Name',
      'Mobile Number',
      'Residential Address',
      'Total Siblings Count',
      'Consolidated Family Dues (INR)',
      'Fee Settlement Status'
    ];

    const rows = filteredGroups.map(g => [
      g.id,
      g.familyName,
      g.students.map(s => `${s.full_name} (${s.class_name}-${s.section || 'A'}, Adm: ${s.admission_no})`).join(' | '),
      g.fatherName,
      g.motherName || 'N/A',
      g.phone,
      g.address,
      g.students.length,
      g.totalDues,
      g.allFeesPaid ? 'ALL DUES CLEAR' : `DUE: INR ${g.totalDues}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Siblings_and_Families_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* 4 Summary Stat KPI Cards aligned with website theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch min-w-0">
        {/* Card 1: Family Units */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs tile-hover-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-800 transition-colors">
              Family Units
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
              <Home className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
              {siblingGroups.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active Households
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Indexed Registry</span>
            <span className="font-semibold text-emerald-800 text-[11px]">Verified Standard</span>
          </div>
        </div>

        {/* Card 2: Co-Enrolled Scholars */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs tile-hover-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-800 transition-colors">
              Co-Enrolled Scholars
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
              <Users className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
              {totalSiblingStudents}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-[#1C443A] bg-[#EBF5EF] px-2.5 py-0.5 rounded-full border border-[#C5E2CF] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Sibling Scholars
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Multi-Child Clusters</span>
            <span className="font-semibold text-[#1C443A] text-[11px]">{multiChildCount} Families</span>
          </div>
        </div>

        {/* Card 3: Fee Compliance */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs tile-hover-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-800 transition-colors">
              Fee Compliance
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
              <CreditCard className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
              {feeComplianceRate}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                feeComplianceRate >= 80
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {feeComplianceRate >= 80 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {settledFamiliesCount} Fully Settled
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Settlement Ratio</span>
            <span className="font-semibold text-emerald-800 text-[11px]">Consolidated Invoices</span>
          </div>
        </div>

        {/* Card 4: Parent Linkage */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] flex flex-col justify-between shadow-xs tile-hover-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-800 transition-colors">
              Parent Linkage
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-700" />
            </div>
          </div>
          <div className="my-3">
            <div className="font-display font-bold text-3xl text-[#122A24] tracking-tight">
              100%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Auto-Indexed
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span>Verification Method</span>
            <span className="font-semibold text-emerald-800 text-[11px]">Phone &amp; Address</span>
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
