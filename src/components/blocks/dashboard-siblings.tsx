'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  HeartHandshake,
  Search,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Student, FeeInvoice } from '@/lib/types';
import { getAllSiblingGroups, SiblingGroup } from '@/lib/student-helper';

interface DashboardSiblingsProps {
  students: Student[];
  invoices?: FeeInvoice[];
  onSelectStudent: (student: Student) => void;
  onCollectFee?: (student: Student) => void;
}

export function DashboardSiblings({
  students = [],
  invoices = [],
  onSelectStudent,
  onCollectFee
}: DashboardSiblingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MULTI_CHILD' | 'FEES_DUE' | 'ALL_PAID'>('ALL');

  const siblingGroups = useMemo(() => {
    return getAllSiblingGroups(students, invoices);
  }, [students, invoices]);

  const totalSiblingStudents = useMemo(() => {
    return siblingGroups.reduce((acc, g) => acc + g.students.length, 0);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Summary Stat KPI Cards (2x2 on mobile, 4 across on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-1 tile-hover-card">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#2D5A4E] uppercase flex items-center justify-between">
            <span className="truncate">Family Units</span>
            <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700 shrink-0" />
          </div>
          <div className="text-xl sm:text-3xl font-display font-bold text-[#122A24]">
            {siblingGroups.length}
          </div>
          <div className="text-[9.5px] sm:text-[11px] font-mono text-emerald-700 truncate">
            Active Households
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-1 tile-hover-card">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-purple-900 uppercase flex items-center justify-between">
            <span className="truncate">Co-Enrolled</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-700 shrink-0" />
          </div>
          <div className="text-xl sm:text-3xl font-display font-bold text-purple-950">
            {totalSiblingStudents}
          </div>
          <div className="text-[9.5px] sm:text-[11px] font-mono text-purple-800 truncate">
            Sibling Scholars
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1 tile-hover-card">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-900 uppercase flex items-center justify-between">
            <span className="truncate">Fee Compliance</span>
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
          </div>
          <div className="text-xl sm:text-3xl font-display font-bold text-emerald-950">
            {siblingGroups.length > 0
              ? Math.round((siblingGroups.filter(g => g.allFeesPaid).length / siblingGroups.length) * 100)
              : 100}%
          </div>
          <div className="text-[9.5px] sm:text-[11px] font-mono text-emerald-800 truncate">
            {siblingGroups.filter(g => g.allFeesPaid).length} Fully Settled
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-1 tile-hover-card">
          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#2D5A4E] uppercase flex items-center justify-between">
            <span className="truncate">Parent Linkage</span>
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
          </div>
          <div className="text-xl sm:text-3xl font-display font-bold text-[#122A24]">
            100%
          </div>
          <div className="text-[9.5px] sm:text-[11px] font-mono text-emerald-700 truncate">
            Auto-Indexed
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by family, parents, student, phone..."
            className="w-full pl-9 pr-3.5 py-2 border border-[#DCE8E0] rounded-xl text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'ALL', label: `All Families (${siblingGroups.length})` },
            { id: 'ALL_PAID', label: 'Fees Paid' },
            { id: 'FEES_DUE', label: 'Fees Due' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer whitespace-nowrap transition-colors ${
                filterMode === f.id
                  ? 'bg-[#122A24] text-white border-[#122A24]'
                  : 'bg-[#F8FAF9] text-slate-600 border-[#DCE8E0] hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sibling Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => (
            <div
              key={group.id}
              className="p-5 rounded-2xl bg-white border border-[#DCE8E0] hover:border-purple-400/80 transition-colors shadow-2xs flex flex-col justify-between gap-4"
            >
              {/* Household Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 border border-purple-300 flex items-center justify-center font-display font-bold text-lg shrink-0">
                    {group.fatherName?.slice(3, 5).toUpperCase() || 'FM'}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#122A24]">
                      {group.familyName}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>Father: <strong>{group.fatherName}</strong></span>
                      {group.motherName && <span>• Mother: <strong>{group.motherName}</strong></span>}
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border shrink-0 ${
                  group.allFeesPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {group.allFeesPaid ? 'ALL DUES CLEAR' : `FAMILY DUE: ₹${group.totalDues.toLocaleString()}`}
                </span>
              </div>

              {/* Children List */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">
                  Enrolled Siblings ({group.students.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.students.map(s => {
                    const att = s.attendance_percent || 94;
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectStudent(s)}
                        className="p-3 rounded-xl bg-[#F8FAF9] border border-[#E2ECE5] hover:bg-purple-50/50 hover:border-purple-300 cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {s.full_name}
                          </div>
                          <div className="text-[10.5px] font-mono text-slate-500 truncate mt-0.5">
                            Class {s.class_name} ({s.section || 'A'}) • Roll {s.roll_no || '1'}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                            Att: {att}% • {s.fee_status}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Footer */}
              <div className="pt-3 border-t border-[#E8F0EA] flex items-center justify-between text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{group.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{group.address}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-mono text-xs bg-white rounded-2xl border border-[#DCE8E0]">
            <HeartHandshake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No Sibling Groups Found</p>
            <p className="mt-1">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
