/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  Plus,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  LogOut,
  Phone,
  MessageCircle,
  Users,
  Calendar,
  Building2,
  FileCheck,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { School, Student, VisitorEntry, StudentGatePass } from '@/lib/types';
import { openWhatsAppDirect } from '@/lib/whatsapp';

export interface DashboardVisitorGateProps {
  selectedSchool?: School | null;
  students: Student[];
  selectedSession?: string;
  showAdminToast?: (msg: string) => void;
}

export function DashboardVisitorGate({
  selectedSchool,
  students = [],
  selectedSession = '2026-27',
  showAdminToast
}: DashboardVisitorGateProps) {
  const [activeTab, setActiveTab] = useState<'visitors' | 'gatepass'>('visitors');
  const [visitorSearch, setVisitorSearch] = useState('');

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<StudentGatePass | null>(null);

  // New Visitor Form State
  const [visitorName, setVisitorName] = useState('Rajesh Malhotra');
  const [visitorPhone, setVisitorPhone] = useState('9811234567');
  const [whomToMeet, setWhomToMeet] = useState('Principal / Vice Principal');
  const [visitorPurpose, setVisitorPurpose] = useState('Academic Progress & Fee Verification');
  const [badgeNo, setBadgeNo] = useState('V-12');

  // New Student Gate Pass Form State with Class & Section Filters
  const [gateFilterClass, setGateFilterClass] = useState<string>('ALL');
  const [gateFilterSection, setGateFilterSection] = useState<string>('ALL');
  const [gateScholarSearch, setGateScholarSearch] = useState<string>('');
  const [gateStudentId, setGateStudentId] = useState(students[0]?.id || '');
  const [escortName, setEscortName] = useState(students[0]?.father_name || students[0]?.mother_name || 'Mr. Suresh Sharma');
  const [escortPhone, setEscortPhone] = useState(students[0]?.parent_phone || students[0]?.phone || '9876543210');
  const [escortRelation, setEscortRelation] = useState('Father / Legal Guardian');
  const [passReason, setPassReason] = useState('Sudden Medical Illness (Infirmary Referral)');
  const [authorizedBy, setAuthorizedBy] = useState('Vice Principal / Academic Incharge');

  // Available Classes and Sections
  const availableClasses = useMemo(() => {
    const set = new Set(students.map(s => s.class_name).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const availableSections = useMemo(() => {
    const set = new Set(students.map(s => s.section).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students for Gate Pass Modal
  const filteredGateStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = gateFilterClass === 'ALL' || s.class_name === gateFilterClass;
      const matchSection = gateFilterSection === 'ALL' || (s.section || 'A') === gateFilterSection;
      const q = gateScholarSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_no || '').toLowerCase().includes(q) ||
        String(s.roll_no || '').includes(q);
      return matchClass && matchSection && matchSearch;
    });
  }, [students, gateFilterClass, gateFilterSection, gateScholarSearch]);

  // Handle Scholar Selection with Auto-fill Parent details
  const handleSelectScholar = (studentId: string) => {
    setGateStudentId(studentId);
    const st = students.find(s => s.id === studentId);
    if (st) {
      if (st.father_name) setEscortName(st.father_name);
      else if (st.mother_name) setEscortName(st.mother_name);
      if (st.parent_phone || st.phone) setEscortPhone(st.parent_phone || st.phone || '');
    }
  };

  // Visitor Entries State
  const [visitors, setVisitors] = useState<VisitorEntry[]>([
    {
      id: 'VIS-01',
      visitor_name: 'Dr. Neha Kapoor',
      phone: '9810123456',
      whom_to_meet: 'Principal Office',
      purpose: 'CBSE Regional Inspection Consultation',
      badge_no: 'V-01',
      in_time: '09:15 AM',
      status: 'CHECKED_IN',
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: 'VIS-02',
      visitor_name: 'Vikramjit Singh',
      phone: '9876501234',
      whom_to_meet: 'Accounts / Treasury Desk',
      purpose: 'Annual Fee Clearance & Transport Pass',
      badge_no: 'V-02',
      in_time: '09:45 AM',
      out_time: '10:30 AM',
      status: 'CHECKED_OUT',
      date: new Date().toISOString().split('T')[0]
    }
  ]);

  // Student Early Gate Passes State
  const [gatePasses, setGatePasses] = useState<StudentGatePass[]>([
    {
      id: 'GP-01',
      pass_no: 'GP-2026-0412',
      student_id: students[0]?.id || 'STU-01',
      student_name: students[0]?.full_name || 'Aarav Sharma',
      class_name: students[0]?.class_name || 'Class 10',
      section: students[0]?.section || 'A',
      parent_name: 'Mr. Rajesh Sharma',
      parent_phone: '9811223344',
      escort_relation: 'Father',
      reason: 'Sudden high fever (Infirmary Medical Referral)',
      authorized_by: 'Head of School / Vice Principal',
      issued_at: '11:15 AM',
      status: 'DEPARTED',
      date: new Date().toISOString().split('T')[0]
    }
  ]);

  // KPIs
  const totalVisitorsToday = visitors.length;
  const currentlyInside = visitors.filter(v => v.status === 'CHECKED_IN').length;
  const totalCheckedOut = visitors.filter(v => v.status === 'CHECKED_OUT').length;
  const totalEarlyPasses = gatePasses.length;

  // Filtered Visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const q = visitorSearch.toLowerCase().trim();
      return (
        !q ||
        v.visitor_name.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.whom_to_meet.toLowerCase().includes(q) ||
        v.badge_no.toLowerCase().includes(q)
      );
    });
  }, [visitors, visitorSearch]);

  // Check In Visitor
  const handleCheckInVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newV: VisitorEntry = {
      id: `VIS-${Date.now().toString().slice(-4)}`,
      visitor_name: visitorName,
      phone: visitorPhone,
      whom_to_meet: whomToMeet,
      purpose: visitorPurpose,
      badge_no: badgeNo || `V-${visitors.length + 1}`,
      in_time: timeStr,
      status: 'CHECKED_IN',
      date: now.toISOString().split('T')[0]
    };

    setVisitors(prev => [newV, ...prev]);
    setShowCheckInModal(false);
    if (showAdminToast) showAdminToast(`Visitor "${visitorName}" checked in (Badge ${newV.badge_no})`);
  };

  // Check Out Visitor
  const handleCheckOutVisitor = (id: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setVisitors(prev =>
      prev.map(v => (v.id === id ? { ...v, status: 'CHECKED_OUT', out_time: timeStr } : v))
    );
    if (showAdminToast) showAdminToast('Visitor successfully checked out.');
  };

  // Issue Student Gate Pass
  const handleIssueGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === gateStudentId) || students[0];
    if (!st) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const passNo = `GP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPass: StudentGatePass = {
      id: `GP-${Date.now().toString().slice(-4)}`,
      pass_no: passNo,
      student_id: st.id,
      student_name: st.full_name,
      class_name: st.class_name,
      section: st.section || 'A',
      parent_name: escortName,
      parent_phone: escortPhone,
      escort_relation: escortRelation,
      reason: passReason,
      authorized_by: authorizedBy,
      issued_at: timeStr,
      status: 'ISSUED',
      date: now.toISOString().split('T')[0]
    };

    setGatePasses(prev => [newPass, ...prev]);
    setShowGatePassModal(false);
    setSelectedPassForPrint(newPass);
    if (showAdminToast) showAdminToast(`Gate Pass ${passNo} generated for ${st.full_name}`);
  };

  // Mark Student Departed
  const handleMarkDeparted = (passId: string) => {
    setGatePasses(prev =>
      prev.map(p => (p.id === passId ? { ...p, status: 'DEPARTED' } : p))
    );
    if (showAdminToast) showAdminToast('Student marked DEPARTED through security gate.');
  };

  // WhatsApp Gate Pass Departure Notification to Parents
  const handleSendWhatsAppDeparture = (pass: StudentGatePass) => {
    const phone = pass.parent_phone;
    const text =
      `🛡️ *CBSE EARLY DISPERSAL GATE PASS CONFIRMATION*\n` +
      `*${selectedSchool?.school_name?.toUpperCase() || 'DELHI PUBLIC SCHOOL'}*\n\n` +
      `Dear Parent,\n\n` +
      `Your ward has safely departed the school campus via Security Main Gate:\n` +
      `👤 *Scholar:* ${pass.student_name} (${pass.class_name} - ${pass.section})\n` +
      `🎫 *Gate Pass No:* ${pass.pass_no}\n` +
      `⏰ *Departure Time:* ${pass.issued_at}\n` +
      `🤝 *Escorted By:* ${pass.parent_name} (${pass.escort_relation})\n` +
      `📋 *Reason:* ${pass.reason}\n` +
      `✍️ *Authorized By:* ${pass.authorized_by}\n\n` +
      `This electronic confirmation is generated under CBSE Child Safety Security Norms.\n\n` +
      `_Campus Security Directorate, ${selectedSchool?.school_name || 'Delhi Public School'}_`;

    openWhatsAppDirect(phone, text);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Smart Gate Pass &amp; Visitor Security Desk
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                CBSE CHILD SAFETY PROTOCOL
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E]">
              Digital visitor check-in, real-time campus presence, emergency student early dispersal &amp; security QR passes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGatePassModal(true)}
            className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Generate Early Gate Pass</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCheckInModal(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Check-In Visitor</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Today's Visitors</span>
          <div className="text-2xl font-display font-black text-[#122A24] mt-1">{totalVisitorsToday}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Inside Campus</span>
          <div className="text-2xl font-display font-black text-amber-600 mt-1 flex items-center gap-1.5">
            <span>{currentlyInside}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Checked Out</span>
          <div className="text-2xl font-display font-black text-emerald-800 mt-1">{totalCheckedOut}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Early Dispersal Passes</span>
          <div className="text-2xl font-display font-black text-purple-800 mt-1">{totalEarlyPasses}</div>
        </div>
      </div>

      {/* Tab Switcher: Visitors vs Early Dispersal Passes */}
      <div className="flex items-center gap-2 border-b border-[#DCE8E0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'visitors'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🛡️ Visitor Security Log ({visitors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gatepass')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'gatepass'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🎫 Student Early Dispersal Gate Passes ({gatePasses.length})
        </button>
      </div>

      {/* TAB 1: VISITOR SECURITY REGISTER */}
      {activeTab === 'visitors' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor name, phone, person to meet, or badge no..."
                value={visitorSearch}
                onChange={e => setVisitorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-sans"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                    <th className="py-3 px-4">BADGE &amp; VISITOR NAME</th>
                    <th className="py-3 px-4">CONTACT PHONE</th>
                    <th className="py-3 px-4">PERSON TO MEET &amp; PURPOSE</th>
                    <th className="py-3 px-4 text-center">IN / OUT TIME</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-right">GATE ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF2ED]">
                  {filteredVisitors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-[#122A24] text-white">
                            {v.badge_no}
                          </span>
                          <span className="font-bold text-[#122A24] text-xs">{v.visitor_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {v.phone}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{v.whom_to_meet}</div>
                        <div className="text-[10.5px] text-slate-500">{v.purpose}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <div>In: {v.in_time}</div>
                        {v.out_time && <div className="text-slate-500">Out: {v.out_time}</div>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {v.status === 'CHECKED_IN' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> INSIDE CAMPUS
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            CHECKED OUT
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {v.status === 'CHECKED_IN' && (
                          <button
                            type="button"
                            onClick={() => handleCheckOutVisitor(v.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors border-none cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check Out</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT EARLY GATE PASSES */}
      {activeTab === 'gatepass' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                  <th className="py-3 px-4">PASS NUMBER</th>
                  <th className="py-3 px-4">SCHOLAR PROFILE</th>
                  <th className="py-3 px-4">ESCORTED BY (GUARDIAN)</th>
                  <th className="py-3 px-4">REASON &amp; AUTHORIZATION</th>
                  <th className="py-3 px-4 text-center">TIME &amp; STATUS</th>
                  <th className="py-3 px-4 text-right">SECURITY ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF2ED]">
                {gatePasses.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#122A24]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                        {p.pass_no}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#122A24] text-xs">{p.student_name}</div>
                      <div className="text-[10.5px] font-mono text-slate-500">
                        {p.class_name} (Sec {p.section})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.parent_name}</div>
                      <div className="text-[10.5px] font-mono text-slate-500">
                        {p.escort_relation} • {p.parent_phone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{p.reason}</div>
                      <div className="text-[10px] text-emerald-800 font-mono font-bold">
                        Auth: {p.authorized_by}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-mono text-[11px]">{p.issued_at}</div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold mt-1 inline-block ${
                          p.status === 'DEPARTED'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppDeparture(p)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Send Confirmation Alert to Parent via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPassForPrint(p)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border-none shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print Slip</span>
                        </button>

                        {p.status === 'ISSUED' && (
                          <button
                            type="button"
                            onClick={() => handleMarkDeparted(p.id)}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold border-none cursor-pointer"
                          >
                            Mark Departed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CHECK IN VISITOR */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[#122A24]">Gate Security Check-In</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckInVisitor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={visitorPhone}
                    onChange={e => setVisitorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge / Pass No *</label>
                  <input
                    type="text"
                    required
                    value={badgeNo}
                    onChange={e => setBadgeNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Whom To Meet *</label>
                <select
                  value={whomToMeet}
                  onChange={e => setWhomToMeet(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  <option>Principal / Vice Principal</option>
                  <option>Class Teacher / Academic Staff</option>
                  <option>Accounts / Fee Treasury Desk</option>
                  <option>Administrative Office / Admission Desk</option>
                  <option>Transport / Bus Incharge</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  value={visitorPurpose}
                  onChange={e => setVisitorPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold rounded-xl shadow-xs border-none cursor-pointer"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GENERATE EARLY GATE PASS */}
      {showGatePassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Student Early Dispersal Pass
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGatePassModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueGatePass} className="space-y-3.5 text-xs">
              {/* Class & Section Filter Docket */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-[#122A24] uppercase font-mono block">
                  1. Filter Roster By Class &amp; Section
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">Class</label>
                    <select
                      value={gateFilterClass}
                      onChange={e => {
                        setGateFilterClass(e.target.value);
                      }}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white focus:outline-emerald-600"
                    >
                      <option value="ALL">All Classes ({availableClasses.length})</option>
                      {availableClasses.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">Section</label>
                    <select
                      value={gateFilterSection}
                      onChange={e => setGateFilterSection(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white focus:outline-emerald-600"
                    >
                      <option value="ALL">All Sections</option>
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type to search scholar name or roll no..."
                    value={gateScholarSearch}
                    onChange={e => setGateScholarSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-emerald-600 font-sans"
                  />
                </div>
              </div>

              {/* Scholar Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Select Scholar *</label>
                  <span className="text-[10.5px] font-mono text-emerald-800 font-bold">
                    {filteredGateStudents.length} Scholars Listed
                  </span>
                </div>
                <select
                  value={gateStudentId}
                  onChange={e => handleSelectScholar(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  {filteredGateStudents.length === 0 && (
                    <option value="">No scholars found matching filter</option>
                  )}
                  {filteredGateStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} — {st.class_name} (Section {st.section || 'A'} • Roll #{st.roll_no || '01'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Escort/Parent Name *</label>
                  <input
                    type="text"
                    required
                    value={escortName}
                    onChange={e => setEscortName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Contact No *</label>
                  <input
                    type="tel"
                    required
                    value={escortPhone}
                    onChange={e => setEscortPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escort Relation *</label>
                <select
                  value={escortRelation}
                  onChange={e => setEscortRelation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  <option>Father / Legal Guardian</option>
                  <option>Mother</option>
                  <option>Authorized Local Guardian</option>
                  <option>Elder Sibling (Pre-approved)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Early Leave *</label>
                <select
                  value={passReason}
                  onChange={e => setPassReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  <option>Sudden Medical Illness (Infirmary Referral)</option>
                  <option>Doctor / Specialist Medical Appointment</option>
                  <option>Family Emergency / Bereavement</option>
                  <option>Outstation Travel / Visa Appointment</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGatePassModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold rounded-xl shadow-xs border-none cursor-pointer"
                >
                  Generate Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE GATE PASS MODAL */}
      {selectedPassForPrint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-bold text-sm text-[#122A24]">Official CBSE Gate Pass Docket</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#122A24] text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 inline mr-1" /> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPassForPrint(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border-2 border-slate-800 p-5 rounded-2xl space-y-4 font-serif text-slate-900 bg-white">
              <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                <h2 className="font-black text-xl uppercase tracking-wider text-[#122A24]">
                  {selectedSchool?.school_name || 'DELHI PUBLIC SCHOOL'}
                </h2>
                <div className="text-xs font-mono font-bold text-slate-600 uppercase">
                  CBSE CHILD SAFETY PROTOCOL • EARLY DISPERSAL GATE PASS
                </div>
                <div className="text-[10.5px] font-mono text-slate-500">
                  Pass Serial No: <strong>{selectedPassForPrint.pass_no}</strong> • Date: {selectedPassForPrint.date}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">Scholar's Full Name</span>
                  <strong className="text-[#122A24] text-sm">{selectedPassForPrint.student_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">Class &amp; Section</span>
                  <strong className="text-[#122A24] text-sm">
                    {selectedPassForPrint.class_name} - {selectedPassForPrint.section}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">Escort / Parent</span>
                  <strong>{selectedPassForPrint.parent_name}</strong>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedPassForPrint.escort_relation}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">Gate Departure Time</span>
                  <strong className="font-mono text-rose-700 font-bold">{selectedPassForPrint.issued_at}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-xs font-sans">
                <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">
                  Reason for Early Dispersal:
                </span>
                <p className="mt-0.5 font-medium text-slate-800">{selectedPassForPrint.reason}</p>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-2 text-center text-[10.5px] font-sans border-t border-slate-300">
                <div>
                  <div className="h-8"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">Parent / Escort</div>
                </div>
                <div>
                  <div className="h-8"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">Security Incharge</div>
                </div>
                <div>
                  <div className="h-8"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-[#122A24]">Principal / Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
