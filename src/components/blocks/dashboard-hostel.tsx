/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Bed,
  Users,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Save,
  Plus,
  Trash2,
  Search,
  Filter,
  Phone,
  Shield,
  Coffee,
  Utensils,
  ChevronRight,
  AlertCircle,
  X,
  Sparkles,
  Snowflake,
  Sun,
  UserCheck
} from 'lucide-react';
import { Student, HostelRoom, HostelFeeHead } from '@/lib/types';
import {
  DEFAULT_HOSTEL_FEES,
  DEFAULT_ONE_TIME_FEES,
  DEFAULT_TUITION_FEES,
  HostelFeeStructure
} from '@/lib/fee-calculator';

export interface DashboardHostelProps {
  students?: Student[];
  schoolName?: string;
  currentUser?: any;
  userRole?: string;
  onUpdateStudent?: (student: Student) => void;
}

// Initial realistic default rooms in school campus
const INITIAL_HOSTEL_ROOMS: HostelRoom[] = [
  {
    id: 'room-101',
    roomNumber: 'A-101',
    wing: 'BOYS_SENIOR',
    type: 'WITH_AC',
    capacity: 3,
    occupied: 3,
    floor: 1,
    amenities: ['Split Air Conditioner', 'Study Desk', 'Attached Washroom', 'Wi-Fi Hub'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-1', studentName: 'Aarav Sharma', className: 'Class 11 - PCM', allocatedDate: '2026-04-10' },
      { bedNumber: 'Bed 2', studentId: 'st-2', studentName: 'Rohan Verma', className: 'Class 11 - PCB', allocatedDate: '2026-04-12' },
      { bedNumber: 'Bed 3', studentId: 'st-3', studentName: 'Kunal Singhania', className: 'Class 12 - PCM', allocatedDate: '2026-04-15' }
    ]
  },
  {
    id: 'room-102',
    roomNumber: 'A-102',
    wing: 'BOYS_SENIOR',
    type: 'WITHOUT_AC',
    capacity: 3,
    occupied: 2,
    floor: 1,
    amenities: ['Ceiling Fans', 'Study Desk', 'Common Washroom', 'Solar Geyser'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-4', studentName: 'Aditya Gupta', className: 'Class 10-A', allocatedDate: '2026-04-10' },
      { bedNumber: 'Bed 2', studentId: 'st-5', studentName: 'Deepak Patel', className: 'Class 9-B', allocatedDate: '2026-04-11' },
      { bedNumber: 'Bed 3' }
    ]
  },
  {
    id: 'room-103',
    roomNumber: 'A-103',
    wing: 'BOYS_SENIOR',
    type: 'WITH_AC',
    capacity: 3,
    occupied: 1,
    floor: 1,
    amenities: ['Split Air Conditioner', 'Study Desk', 'Attached Washroom'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-6', studentName: 'Saurabh Kumar', className: 'Class 12 - Commerce', allocatedDate: '2026-04-20' },
      { bedNumber: 'Bed 2' },
      { bedNumber: 'Bed 3' }
    ]
  },
  {
    id: 'room-201',
    roomNumber: 'B-201',
    wing: 'GIRLS_WING',
    type: 'WITH_AC',
    capacity: 3,
    occupied: 3,
    floor: 2,
    amenities: ['Split Air Conditioner', 'Individual Lockers', 'Attached Washroom', '24x7 Lady Matron'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-7', studentName: 'Ananya Mishra', className: 'Class 11 - Humanities', allocatedDate: '2026-04-08' },
      { bedNumber: 'Bed 2', studentId: 'st-8', studentName: 'Pooja Tiwari', className: 'Class 10-A', allocatedDate: '2026-04-09' },
      { bedNumber: 'Bed 3', studentId: 'st-9', studentName: 'Riya Saxena', className: 'Class 12 - PCB', allocatedDate: '2026-04-14' }
    ]
  },
  {
    id: 'room-202',
    roomNumber: 'B-202',
    wing: 'GIRLS_WING',
    type: 'WITHOUT_AC',
    capacity: 3,
    occupied: 2,
    floor: 2,
    amenities: ['Ceiling Fans', 'Study Desks', 'Lady Guard Monitored'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-10', studentName: 'Suhani Yadav', className: 'Class 8-B', allocatedDate: '2026-04-18' },
      { bedNumber: 'Bed 2', studentId: 'st-11', studentName: 'Tanya Singh', className: 'Class 7-A', allocatedDate: '2026-04-19' },
      { bedNumber: 'Bed 3' }
    ]
  },
  {
    id: 'room-301',
    roomNumber: 'C-301',
    wing: 'BOYS_JUNIOR',
    type: 'WITHOUT_AC',
    capacity: 3,
    occupied: 2,
    floor: 3,
    amenities: ['Junior Single Cots', 'Attached Bath', 'Junior Caretaker Support'],
    beds: [
      { bedNumber: 'Bed 1', studentId: 'st-12', studentName: 'Kartik Awasthi', className: 'Class 6-A', allocatedDate: '2026-04-22' },
      { bedNumber: 'Bed 2', studentId: 'st-13', studentName: 'Manish Joshi', className: 'Class 6-B', allocatedDate: '2026-04-25' },
      { bedNumber: 'Bed 3' }
    ]
  }
];

export function DashboardHostel({
  students = [],
  schoolName = 'Delhi Public School',
  currentUser,
  userRole,
  onUpdateStudent
}: DashboardHostelProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'inmates' | 'fees' | 'mess'>('matrix');
  const [selectedWing, setSelectedWing] = useState<string>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loaded Rooms with LocalStorage Persistence
  const [rooms, setRooms] = useState<HostelRoom[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('school_erp_hostel_rooms');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_HOSTEL_ROOMS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('school_erp_hostel_rooms', JSON.stringify(rooms));
      } catch (e) {}
    }
  }, [rooms]);

  // ─────────────────────────────────────────────────────────────
  // EDITABLE HOSTEL & INSTITUTIONAL FEE MASTER STATE
  // Matching the User's Uploaded Fee Chart Image
  // ─────────────────────────────────────────────────────────────
  const [feeMaster, setFeeMaster] = useState<{
    registrationFee: number;
    admissionFee: number;
    annualFeeJunior: number;
    annualFeeSenior: number;
    hostelSecurityMoney: number;
    academicFeeJunior: number;
    academicFeeMiddle: number;
    academicFeeSenior: number;
    hostelFeeNonAc: number;
    hostelFeeAc: number;
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('school_erp_official_fee_chart');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      registrationFee: 1000,
      admissionFee: 5000,
      annualFeeJunior: 5000,
      annualFeeSenior: 6000,
      hostelSecurityMoney: 10000,
      academicFeeJunior: 21600, // VI to VIII Annual
      academicFeeMiddle: 24000, // IX & X Annual
      academicFeeSenior: 28800, // XI & XII Annual
      hostelFeeNonAc: 72000,    // Annual Without AC
      hostelFeeAc: 94000        // Annual With AC
    };
  });

  const [showFeeEditModal, setShowFeeEditModal] = useState<boolean>(false);
  const [tempFeeMaster, setTempFeeMaster] = useState(feeMaster);

  const saveFeeMaster = () => {
    setFeeMaster(tempFeeMaster);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('school_erp_official_fee_chart', JSON.stringify(tempFeeMaster));
        // Sync with fee-calculator storage
        localStorage.setItem('cbse_hostel_fees', JSON.stringify({
          securityMoney: tempFeeMaster.hostelSecurityMoney,
          withoutAcAnnual: tempFeeMaster.hostelFeeNonAc,
          withoutAcMonthly: Math.round(tempFeeMaster.hostelFeeNonAc / 12),
          withAcAnnual: tempFeeMaster.hostelFeeAc,
          withAcMonthly: Math.round(tempFeeMaster.hostelFeeAc / 12)
        }));
      } catch (e) {}
    }
    setShowFeeEditModal(false);
  };

  // ─────────────────────────────────────────────────────────────
  // COMPUTED TOTAL COMBINATIONS TABLE (MATCHING TABLE 2 FROM IMAGE)
  // ─────────────────────────────────────────────────────────────
  const computedTotals = useMemo(() => {
    const f = feeMaster;
    const baseNew = f.registrationFee + f.admissionFee + f.hostelSecurityMoney; // 1000 + 5000 + 10000 = 16,000

    return [
      {
        classGroup: 'TOTAL VI TO VIII (WITHOUT AC)',
        category: 'Classes 6th to 8th',
        roomType: 'Without AC',
        annualAcademic: f.academicFeeJunior,
        annualHostel: f.hostelFeeNonAc,
        annualFee: f.annualFeeJunior,
        grandTotal: baseNew + f.annualFeeJunior + f.academicFeeJunior + f.hostelFeeNonAc,
        monthlyHostelRate: Math.round(f.hostelFeeNonAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeJunior / 12)
      },
      {
        classGroup: 'TOTAL VI TO VIII (WITH AC)',
        category: 'Classes 6th to 8th',
        roomType: 'With AC',
        annualAcademic: f.academicFeeJunior,
        annualHostel: f.hostelFeeAc,
        annualFee: f.annualFeeJunior,
        grandTotal: baseNew + f.annualFeeJunior + f.academicFeeJunior + f.hostelFeeAc,
        monthlyHostelRate: Math.round(f.hostelFeeAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeJunior / 12)
      },
      {
        classGroup: 'TOTAL IX AND X (WITHOUT AC)',
        category: 'Classes 9th & 10th',
        roomType: 'Without AC',
        annualAcademic: f.academicFeeMiddle,
        annualHostel: f.hostelFeeNonAc,
        annualFee: f.annualFeeSenior,
        grandTotal: baseNew + f.annualFeeSenior + f.academicFeeMiddle + f.hostelFeeNonAc,
        monthlyHostelRate: Math.round(f.hostelFeeNonAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeMiddle / 12)
      },
      {
        classGroup: 'TOTAL IX & X (WITH AC)',
        category: 'Classes 9th & 10th',
        roomType: 'With AC',
        annualAcademic: f.academicFeeMiddle,
        annualHostel: f.hostelFeeAc,
        annualFee: f.annualFeeSenior,
        grandTotal: baseNew + f.annualFeeSenior + f.academicFeeMiddle + f.hostelFeeAc,
        monthlyHostelRate: Math.round(f.hostelFeeAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeMiddle / 12)
      },
      {
        classGroup: 'TOTAL XI & XII (WITHOUT AC)',
        category: 'Classes 11th & 12th',
        roomType: 'Without AC',
        annualAcademic: f.academicFeeSenior,
        annualHostel: f.hostelFeeNonAc,
        annualFee: f.annualFeeSenior,
        grandTotal: baseNew + f.annualFeeSenior + f.academicFeeSenior + f.hostelFeeNonAc,
        monthlyHostelRate: Math.round(f.hostelFeeNonAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeSenior / 12)
      },
      {
        classGroup: 'TOTAL XI & XII (WITH AC)',
        category: 'Classes 11th & 12th',
        roomType: 'With AC',
        annualAcademic: f.academicFeeSenior,
        annualHostel: f.hostelFeeAc,
        annualFee: f.annualFeeSenior,
        grandTotal: baseNew + f.annualFeeSenior + f.academicFeeSenior + f.hostelFeeAc,
        monthlyHostelRate: Math.round(f.hostelFeeAc / 12),
        monthlyAcademicRate: Math.round(f.academicFeeSenior / 12)
      }
    ];
  }, [feeMaster]);

  // Overall Bed Counts
  const totalBeds = useMemo(() => rooms.reduce((acc, r) => acc + r.capacity, 0), [rooms]);
  const occupiedBeds = useMemo(() => rooms.reduce((acc, r) => acc + r.occupied, 0), [rooms]);
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedWing !== 'ALL' && r.wing !== selectedWing) return false;
      if (selectedRoomType !== 'ALL' && r.type !== selectedRoomType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = r.roomNumber.toLowerCase().includes(q);
        const matchesInmates = r.beds.some(b => b.studentName?.toLowerCase().includes(q));
        if (!matchesRoom && !matchesInmates) return false;
      }
      return true;
    });
  }, [rooms, selectedWing, selectedRoomType, searchQuery]);

  // List of all resident students
  const residentList = useMemo(() => {
    const list: any[] = [];
    rooms.forEach(r => {
      r.beds.forEach(b => {
        if (b.studentName) {
          list.push({
            id: b.studentId || b.bedNumber,
            name: b.studentName,
            className: b.className || 'Senior Secondary',
            roomNumber: r.roomNumber,
            wing: r.wing,
            type: r.type,
            bedNumber: b.bedNumber,
            allocatedDate: b.allocatedDate || '2026-04-10',
            monthlyRate: r.type === 'WITH_AC' ? Math.round(feeMaster.hostelFeeAc / 12) : Math.round(feeMaster.hostelFeeNonAc / 12),
            phone: '+91 98765-43210'
          });
        }
      });
    });
    return list;
  }, [rooms, feeMaster]);

  // Allocation Modal State
  const [allocationModal, setAllocationModal] = useState<{
    isOpen: boolean;
    roomId: string;
    bedIndex: number;
    bedNumber: string;
  } | null>(null);
  const [selectedStudentToAllocate, setSelectedStudentToAllocate] = useState<string>('');

  const handleAllocateBed = () => {
    if (!allocationModal || !selectedStudentToAllocate) return;
    const st = students.find(s => s.id === selectedStudentToAllocate);
    if (!st) return;

    setRooms(prev => prev.map(r => {
      if (r.id !== allocationModal.roomId) return r;
      const updatedBeds = [...r.beds];
      updatedBeds[allocationModal.bedIndex] = {
        bedNumber: allocationModal.bedNumber,
        studentId: st.id,
        studentName: st.full_name,
        className: st.class_name,
        allocatedDate: new Date().toISOString().split('T')[0]
      };
      const occ = updatedBeds.filter(b => !!b.studentName).length;
      return { ...r, beds: updatedBeds, occupied: occ };
    }));

    if (onUpdateStudent) {
      onUpdateStudent({
        ...st,
        hostel_opted: 'WITHOUT_AC',
        hostel_room_no: rooms.find(r => r.id === allocationModal.roomId)?.roomNumber,
        hostel_bed_no: allocationModal.bedNumber
      });
    }

    setAllocationModal(null);
    setSelectedStudentToAllocate('');
  };

  const handleVacateBed = (roomId: string, bedIndex: number) => {
    if (!confirm('Are you sure you want to vacate this bed?')) return;
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const updatedBeds = [...r.beds];
      const bedNum = updatedBeds[bedIndex].bedNumber;
      updatedBeds[bedIndex] = { bedNumber: bedNum };
      const occ = updatedBeds.filter(b => !!b.studentName).length;
      return { ...r, beds: updatedBeds, occupied: occ };
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BRANDED HERO BANNER (MATCHING WEBSITE THEME #122A24)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#122A24] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono uppercase tracking-wider">
                CBSE Residential Boarding Facility
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                Session 2026-27
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Hostel Accommodation &amp; Fee Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Official residential wings, room-bed allocations, AC / Non-AC inventory, student inmates directory, and editable CBSE institutional fee master.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => {
                setTempFeeMaster(feeMaster);
                setShowFeeEditModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white text-[#122A24] text-xs font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-md cursor-pointer border-none"
            >
              <Edit3 className="w-4 h-4 text-emerald-700" />
              <span>Edit Hostel Fees Master</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10.5px] text-emerald-300 font-bold uppercase tracking-wider block">
              Hostel Inmates
            </span>
            <div className="text-2xl font-extrabold text-white font-display">
              {occupiedBeds} Students
            </div>
            <span className="text-[11px] text-slate-300 block">
              Residential enrolled boys &amp; girls
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10.5px] text-emerald-300 font-bold uppercase tracking-wider block">
              Bed Capacity &amp; Rooms
            </span>
            <div className="text-2xl font-extrabold text-white font-display">
              {totalBeds} Beds ({rooms.length} Rooms)
            </div>
            <span className="text-[11px] text-slate-300 block">
              Across 3 campus residential wings
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10.5px] text-amber-300 font-bold uppercase tracking-wider block">
              Vacant Beds Available
            </span>
            <div className="text-2xl font-extrabold text-amber-300 font-display">
              {vacantBeds} Beds Free
            </div>
            <span className="text-[11px] text-slate-300 block font-mono">
              Occupancy: {occupancyPercent}% full
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10.5px] text-emerald-300 font-bold uppercase tracking-wider block">
              Monthly Hostel Rate
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-display">
              ₹{Math.round(feeMaster.hostelFeeNonAc / 12).toLocaleString('en-IN')} – ₹{Math.round(feeMaster.hostelFeeAc / 12).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-200/80 block">
              Non-AC: ₹72k/yr &bull; AC: ₹94k/yr
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVIGATION TABS BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto bg-white p-2 rounded-2xl border border-[#DCE8E0] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-[#122A24] text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span>Room &amp; Bed Allocation Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('inmates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'inmates'
                ? 'bg-[#122A24] text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resident Inmates Directory ({residentList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fees'
                ? 'bg-[#122A24] text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hostel &amp; Academic Fee Master (Official Chart)</span>
          </button>

          <button
            onClick={() => setActiveTab('mess')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mess'
                ? 'bg-[#122A24] text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-slate-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mess &amp; Dietary Menu</span>
          </button>
        </div>

        <button
          onClick={() => {
            setTempFeeMaster(feeMaster);
            setShowFeeEditModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#EBF5EF] hover:bg-[#D8EEDF] text-[#1C443A] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#C5E2CF] cursor-pointer shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Fees</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ROOM & BED ALLOCATION MATRIX
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#DCE8E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#122A24] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span>Filter Wing:</span>
              </span>

              {(['ALL', 'BOYS_SENIOR', 'BOYS_JUNIOR', 'GIRLS_WING'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWing(w)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-none cursor-pointer transition-all ${
                    selectedWing === w
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-[#F4F8F5] text-slate-600 hover:text-[#122A24]'
                  }`}
                >
                  {w === 'ALL' ? 'All Wings' : w === 'BOYS_SENIOR' ? 'Boys Senior Wing' : w === 'BOYS_JUNIOR' ? 'Boys Junior Wing' : 'Girls Hostel Wing'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
              >
                <option value="ALL">All Room Types (AC &amp; Non-AC)</option>
                <option value="WITH_AC">❄️ A/C Rooms (₹94,000/yr)</option>
                <option value="WITHOUT_AC">☀️ Non-A/C Rooms (₹72,000/yr)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Room / Student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-medium text-[#122A24] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-sm space-y-4 hover:border-[#122A24] transition-all"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-[#122A24] font-display">
                        Room {room.roomNumber}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono flex items-center gap-1 ${
                        room.type === 'WITH_AC'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {room.type === 'WITH_AC' ? <Snowflake className="w-3 h-3 text-sky-700" /> : <Sun className="w-3 h-3 text-amber-700" />}
                        <span>{room.type === 'WITH_AC' ? 'A/C Room' : 'Non-A/C'}</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {room.wing === 'BOYS_SENIOR' ? 'Senior Boys Wing' : room.wing === 'BOYS_JUNIOR' ? 'Junior Boys Wing' : 'Girls Residence Wing'} &bull; Floor {room.floor}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold font-mono ${
                    room.occupied >= room.capacity
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {room.occupied} / {room.capacity} Beds
                  </span>
                </div>

                {/* 3 Bed Slots */}
                <div className="space-y-2.5 pt-1">
                  {room.beds.map((bed, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        bed.studentName
                          ? 'bg-[#EBF5EF]/70 border-[#C5E2CF]'
                          : 'bg-[#F4F8F5] border-dashed border-[#DCE8E0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          bed.studentName ? 'bg-[#122A24] text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          B{idx + 1}
                        </div>
                        <div>
                          {bed.studentName ? (
                            <>
                              <strong className="text-xs text-[#122A24] block font-bold">
                                {bed.studentName}
                              </strong>
                              <span className="text-[10.5px] text-slate-500 font-mono block">
                                {bed.className} &bull; since {bed.allocatedDate}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">
                              Vacant Bed Slot
                            </span>
                          )}
                        </div>
                      </div>

                      {bed.studentName ? (
                        <button
                          onClick={() => handleVacateBed(room.id, idx)}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10.5px] font-bold transition-colors cursor-pointer"
                          title="Vacate Bed"
                        >
                          Vacate
                        </button>
                      ) : (
                        <button
                          onClick={() => setAllocationModal({
                            isOpen: true,
                            roomId: room.id,
                            bedIndex: idx,
                            bedNumber: `Bed ${idx + 1}`
                          })}
                          className="px-2.5 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white text-[10.5px] font-bold flex items-center gap-1 transition-colors border-none cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>Assign</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Amenities pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#DCE8E0]">
                  {room.amenities.map((am, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4F8F5] text-slate-600 font-medium">
                      &bull; {am}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RESIDENT INMATES DIRECTORY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'inmates' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Hostel Boarders &amp; Residents Roster
              </h2>
              <p className="text-xs text-slate-500">
                Official register of all students accommodated in school hostel facilities.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-xs">
              {residentList.length} Active Boarders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE8E0] text-[10.5px] uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Room &amp; Bed</th>
                  <th className="py-3 px-3">Room Type</th>
                  <th className="py-3 px-3">Hostel Fee (Mo)</th>
                  <th className="py-3 px-3">Allocated Date</th>
                  <th className="py-3 px-3">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F8F5]">
                {residentList.map((res, i) => (
                  <tr key={i} className="hover:bg-[#F4F8F5]/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#122A24] flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center font-bold text-xs">
                        {res.name[0]}
                      </span>
                      <span>{res.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{res.className}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800 text-[11px]">
                        {res.roomNumber} &bull; {res.bedNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        res.type === 'WITH_AC' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {res.type === 'WITH_AC' ? '❄️ Air Conditioned' : '☀️ Non-A/C'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      ₹{res.monthlyRate.toLocaleString('en-IN')}/mo
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{res.allocatedDate}</td>
                    <td className="py-3 px-3">
                      <a href={`tel:${res.phone}`} className="flex items-center gap-1 text-emerald-700 font-mono font-semibold hover:underline no-underline">
                        <Phone className="w-3 h-3" />
                        <span>{res.phone}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: HOSTEL & ACADEMIC FEE MASTER (OFFICIAL CHART FROM IMAGE)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          
          {/* Header with Admin Edit Button */}
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  OFFICIAL CBSE ESTABLISHED FEES
                </span>
                <span className="text-[10px] font-mono text-slate-500">Live Production Master</span>
              </div>
              <h2 className="font-display font-bold text-xl text-[#122A24] mt-1">
                Fee Schedule &amp; Category Totals (NR)
              </h2>
              <p className="text-xs text-slate-500">
                Direct reproduction of the school fee chart. Admin can adjust any amount at any time; changes reflect instantly across student dues and admissions.
              </p>
            </div>

            <button
              onClick={() => {
                setTempFeeMaster(feeMaster);
                setShowFeeEditModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer border-none"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Edit Fee Amounts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Table 1: Particulars & Amounts (Matching Photo Left Table) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Particulars &amp; Head Rates
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">Amount (INR)</span>
              </div>

              <div className="divide-y divide-[#F4F8F5] text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Prospectus / Registration Fee</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.registrationFee.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Admission Fee (Non-Refundable)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.admissionFee.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Annual Fee (PG to VIII)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.annualFeeJunior.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Annual Fee (IX to XII)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.annualFeeSenior.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between bg-emerald-50/50 -mx-3 px-3 rounded-lg">
                  <span className="font-bold text-emerald-900">Hostel Security Money (Refundable)</span>
                  <span className="font-mono font-bold text-emerald-800">₹{feeMaster.hostelSecurityMoney.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Academic Fee (VI to VIII) (Annual)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.academicFeeJunior.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Academic Fee (IX &amp; X) (Annual)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.academicFeeMiddle.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Academic Fee (XI &amp; XII) (Annual)</span>
                  <span className="font-mono font-bold text-[#122A24]">₹{feeMaster.academicFeeSenior.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between bg-amber-50/50 -mx-3 px-3 rounded-lg">
                  <span className="font-bold text-amber-950">Hostel Fee (Annual) [Without AC]</span>
                  <span className="font-mono font-bold text-amber-900">₹{feeMaster.hostelFeeNonAc.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="py-2.5 flex items-center justify-between bg-sky-50/50 -mx-3 px-3 rounded-lg">
                  <span className="font-bold text-sky-950">Hostel Fee (A/C Room) [Annual]</span>
                  <span className="font-mono font-bold text-sky-900">₹{feeMaster.hostelFeeAc.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {/* Table 2: Category Totals (Matching Photo Right Table) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Total Annual Package (All-Inclusive)
                  </h3>
                  <span className="text-[11px] text-slate-500">Registration + Admission + Annual + Security + Academic + Hostel</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800">TOTAL (INR)</span>
              </div>

              <div className="space-y-2.5">
                {computedTotals.map((tot, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#122A24]">
                        {tot.classGroup}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Hostel: ₹{tot.monthlyHostelRate.toLocaleString('en-IN')}/mo &bull; Academic: ₹{tot.monthlyAcademicRate.toLocaleString('en-IN')}/mo
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-extrabold text-base text-emerald-800">
                        ₹{tot.grandTotal.toLocaleString('en-IN')}.00
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Net Package</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: MESS & DIETARY MENU
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'mess' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
            <div>
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Hostel Nutrition &amp; Mess Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Balanced 4-meal dietary schedule prepared by certified residential mess staff.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              Pure Veg &amp; Healthy Kitchen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 font-mono">
                <Coffee className="w-4 h-4" />
                <span>Breakfast (07:00 – 08:00 AM)</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Poha / Idli Sambar / Stuffed Paratha with Curd, Boiled Eggs (Optional), Fresh Milk, Banana, and Sprouted Moong.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 font-mono">
                <Utensils className="w-4 h-4" />
                <span>Lunch (01:45 – 02:45 PM)</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Fresh Wheat Roti, Jeera Rice, Dal Tadka / Rajma / Chhole, Seasonal Green Vegetable, Boondi Raita, and Salad.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 font-mono">
                <Coffee className="w-4 h-4" />
                <span>Evening Snacks (05:00 – 05:45 PM)</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tea / Bournvita Milk, Veg Sandwich / Dhokla / Roasted Corn, Seasonal Fruits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 font-mono">
                <Utensils className="w-4 h-4" />
                <span>Dinner (08:00 – 09:15 PM)</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Hot Phulkas, Paneer Butter Masala / Dal Makhani, Pulao, Gulab Jamun / Kheer, and Night Haldi Milk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ALLOCATE BED TO STUDENT
          ───────────────────────────────────────────────────────────── */}
      {allocationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-[#C5E2CF] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
                  Room Allocation
                </span>
                <h3 className="font-display font-bold text-lg text-[#122A24]">
                  Assign Bed ({allocationModal.bedNumber})
                </h3>
              </div>
              <button
                onClick={() => setAllocationModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#122A24] block">
                Select Student to Assign:
              </label>
              <select
                value={selectedStudentToAllocate}
                onChange={(e) => setSelectedStudentToAllocate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-semibold text-[#122A24] outline-none"
              >
                <option value="">-- Choose Student --</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.full_name} ({st.class_name} &bull; {st.admission_no})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE8E0]">
              <button
                onClick={() => setAllocationModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateBed}
                disabled={!selectedStudentToAllocate}
                className="px-5 py-2 rounded-xl bg-[#122A24] text-white text-xs font-bold transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT HOSTEL & INSTITUTIONAL FEES (ADMIN FULL CONTROL)
          ───────────────────────────────────────────────────────────── */}
      {showFeeEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-[#C5E2CF] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                  Admin Master Control
                </span>
                <h3 className="font-display font-bold text-lg text-[#122A24]">
                  Edit Hostel &amp; Academic Fee Rates
                </h3>
              </div>
              <button
                onClick={() => setShowFeeEditModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Prospectus / Reg Fee (₹)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.registrationFee}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, registrationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.admissionFee}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, admissionFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Annual Fee (PG to VIII) (₹)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.annualFeeJunior}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, annualFeeJunior: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Annual Fee (IX to XII) (₹)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.annualFeeSenior}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, annualFeeSenior: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <label className="font-bold text-emerald-950 block mb-1">Hostel Security Deposit (Refundable) (₹)</label>
                <input
                  type="number"
                  value={tempFeeMaster.hostelSecurityMoney}
                  onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, hostelSecurityMoney: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-mono font-bold text-emerald-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Academic VI–VIII (₹/Yr)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.academicFeeJunior}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, academicFeeJunior: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Academic IX–X (₹/Yr)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.academicFeeMiddle}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, academicFeeMiddle: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#122A24] block mb-1">Academic XI–XII (₹/Yr)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.academicFeeSenior}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, academicFeeSenior: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Hostel Fee (Non-AC) (₹/Yr)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.hostelFeeNonAc}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, hostelFeeNonAc: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    = ₹{Math.round(tempFeeMaster.hostelFeeNonAc / 12)}/month
                  </span>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Hostel Fee (AC Room) (₹/Yr)</label>
                  <input
                    type="number"
                    value={tempFeeMaster.hostelFeeAc}
                    onChange={(e) => setTempFeeMaster({ ...tempFeeMaster, hostelFeeAc: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    = ₹{Math.round(tempFeeMaster.hostelFeeAc / 12)}/month
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE8E0]">
              <button
                type="button"
                onClick={() => setShowFeeEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFeeMaster}
                className="px-6 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md border-none cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Fee Updates</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
