/*! EduSuite Smart QR Touchless Demo Kiosk v1.0.0 */
'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  QrCode,
  CalendarCheck,
  CreditCard,
  Building2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Sparkles,
  Smartphone,
  Printer,
  RotateCw,
  Check,
  ShieldCheck,
  User,
  Users,
  Search,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Student, School } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { DualCopyFeeReceiptModal } from '@/components/dual-copy-fee-receipt-modal';

function KioskContent() {
  const searchParams = useSearchParams();
  const schoolCode = searchParams.get('school') || 'DPS2026';

  // Kiosk Modes: 'HOME' | 'ATTENDANCE' | 'FEES'
  const [activeModule, setActiveModule] = useState<'HOME' | 'ATTENDANCE' | 'FEES'>('HOME');

  // School Data & Clock
  const [school, setSchool] = useState<School | any>({
    id: schoolCode,
    school_code: schoolCode,
    name: 'DELHI PUBLIC SCHOOL',
    school_name: 'Delhi Public School (CBSE)',
    affiliation_no: 'CBSE-AFF-2130048',
    address: 'Knowledge Park III, Institutional Area, Greater Noida'
  });
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);

  // Sound Chime Tone
  const playSound = (type: 'success' | 'beep') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {}
  };

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch School & Students list for rapid mock scan & lookup
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        setLoadingStudents(true);
        // Load Students
        const res = await fetch(`/api/students?school_id=${encodeURIComponent(schoolCode)}&limit=100`);
        const data = await res.json();
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
        } else {
          // Fallback Demo Students
          setStudents([
            {
              id: 'STU-001',
              admission_no: '2026/0481',
              full_name: 'Abhishek Shukla',
              class_name: 'Class 9',
              section: 'A',
              roll_no: '14',
              father_name: 'Mr. Ramesh Shukla',
              guardian_phone: '+91 9876543210',
              transport_opted: 'YES',
              status: 'ACTIVE'
            } as any,
            {
              id: 'STU-002',
              admission_no: '2026/0128',
              full_name: 'Aarav Agarwal',
              class_name: 'Class 1',
              section: 'A',
              roll_no: '16',
              father_name: 'Mr. Amit Agarwal',
              guardian_phone: '+91 9811402127',
              transport_opted: 'NO',
              status: 'ACTIVE'
            } as any,
            {
              id: 'STU-003',
              admission_no: '2026/0992',
              full_name: 'Priya Sharma',
              class_name: 'Class 10',
              section: 'B',
              roll_no: '22',
              father_name: 'Dr. V. K. Sharma',
              guardian_phone: '+91 9412001122',
              transport_opted: 'YES',
              status: 'ACTIVE'
            } as any
          ]);
        }
      } catch {
        // Fallback
        setStudents([
          {
            id: 'STU-001',
            admission_no: '2026/0481',
            full_name: 'Abhishek Shukla',
            class_name: 'Class 9',
            section: 'A',
            roll_no: '14',
            father_name: 'Mr. Ramesh Shukla',
            guardian_phone: '+91 9876543210',
            transport_opted: 'YES',
            status: 'ACTIVE'
          } as any
        ]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadSchoolData();
  }, [schoolCode]);

  // ═════════════════════════════════════════════════════════════
  // MODULE 1: QR ATTENDANCE STATE (SIGN IN / SIGN OUT)
  // ═════════════════════════════════════════════════════════════
  const [attMode, setAttMode] = useState<'SIGN_IN' | 'SIGN_OUT'>('SIGN_IN');
  const [attSearch, setAttSearch] = useState<string>('');
  const [attSuccessStudent, setAttSuccessStudent] = useState<any | null>(null);
  const [isPunching, setIsPunching] = useState<boolean>(false);

  // Process Attendance Punch
  const handlePunchAttendance = (st: Student) => {
    setIsPunching(true);
    playSound('success');
    const punchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAttSuccessStudent({
      student: st,
      mode: attMode,
      time: punchTime,
      date: new Date().toLocaleDateString()
    });

    // Auto clear success card after 4 seconds for next student
    setTimeout(() => {
      setAttSuccessStudent(null);
      setIsPunching(false);
      setAttSearch('');
    }, 4000);
  };

  // ═════════════════════════════════════════════════════════════
  // MODULE 2: QR FEE SUBMISSION STATE
  // ═════════════════════════════════════════════════════════════
  const [feeStudent, setFeeStudent] = useState<Student | null>(null);
  const [feeStudentSearch, setFeeStudentSearch] = useState<string>('');
  const [feeStep, setFeeStep] = useState<'LOOKUP' | 'CART' | 'UPI_QR' | 'RECEIPT'>('LOOKUP');
  const [selectedFeeItems, setSelectedFeeItems] = useState<{ id: string; title: string; amount: number; selected: boolean }[]>([]);
  const [verifiedReceipt, setVerifiedReceipt] = useState<any | null>(null);

  // Load Dues when Student is Selected for Fee
  const handleSelectFeeStudent = (st: Student) => {
    setFeeStudent(st);
    playSound('beep');

    // Default Itemized breakdown
    const items = [
      { id: 'sep-tuition', title: 'September 2026 — Tuition Fee', amount: 2000, selected: true },
      { id: 'sep-transport', title: 'September 2026 — Transport Route', amount: 800, selected: true },
      { id: 'sep-hostel', title: 'September 2026 — Hostel / Boarding', amount: 3000, selected: false },
      { id: 'oct-tuition', title: 'October 2026 — Tuition Fee', amount: 2000, selected: true },
      { id: 'oct-transport', title: 'October 2026 — Transport Route', amount: 800, selected: false },
      { id: 'term-exam', title: 'Half-Yearly CBSE Exam Fee', amount: 1200, selected: true },
    ];
    setSelectedFeeItems(items);
    setFeeStep('CART');
  };

  const toggleFeeItem = (id: string) => {
    setSelectedFeeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const feeTotal = useMemo(() => {
    return selectedFeeItems.filter((i) => i.selected).reduce((sum, i) => sum + i.amount, 0);
  }, [selectedFeeItems]);

  // Generate UPI Payment QR String & Image
  const schoolVpa = 'dps.accounts@icici';
  const upiPayString = `upi://pay?pa=${schoolVpa}&pn=DELHI%20PUBLIC%20SCHOOL&am=${feeTotal}&cu=INR&tn=FEES-${feeStudent?.admission_no || 'STU'}`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayString)}&margin=10&color=122a24`;

  // Complete Payment & Generate Verified Dual Copy Receipt
  const handleCompletePayment = () => {
    if (!feeStudent || feeTotal <= 0) return;
    playSound('success');
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const newReceipt = {
      receipt_no: receiptNo,
      student_id: feeStudent.id,
      student_name: feeStudent.full_name,
      admission_no: feeStudent.admission_no,
      class_name: feeStudent.class_name,
      section: feeStudent.section,
      father_name: feeStudent.father_name || 'Mr. Ramesh Shukla',
      amount_paise: feeTotal * 100,
      amount: feeTotal,
      payment_mode: 'UPI (QR KIOSK)',
      created_at: new Date().toISOString(),
      remarks: selectedFeeItems.filter((i) => i.selected).map((i) => i.title).join(', ')
    };
    setVerifiedReceipt(newReceipt);
    setFeeStep('RECEIPT');
  };

  return (
    <div className="min-h-screen bg-[#0a1612] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ─── KIOSK TOP HIGH-TECH HEADER BAR ─── */}
      <header className="px-6 py-4 bg-[#0d221d] border-b border-emerald-900/60 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-950">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase leading-none">
                {school.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                DEMO TOUCHLESS KIOSK
              </span>
            </div>
            <p className="text-xs text-emerald-400/80 font-mono mt-0.5">
              Affiliation: {school.affiliation_no} • Code: {schoolCode}
            </p>
          </div>
        </div>

        {/* Real-time Clock & Exit Button */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="text-lg font-mono font-black text-emerald-300 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              {currentTime || '12:00:00 PM'}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{currentDate}</p>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Full Admin Login</span>
          </Link>
        </div>
      </header>

      {/* ─── KIOSK MAIN BODY ─── */}
      <main className="flex-1 flex flex-col justify-center p-6 sm:p-10 max-w-6xl w-full mx-auto">
        
        {/* ═════════════════════════════════════════════════════════
            VIEW 1: HOME (EXACTLY 2 MASSIVE CARDS: ATTENDANCE & FEES)
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'HOME' && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-700/50 rounded-full text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Select Action on Touch Screen (स्क्रीन पर विकल्प चुनें)
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Self-Service Smart Station
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Touch below for instant QR Attendance Punch or Universal Student Fee Payment
              </p>
            </div>

            {/* 2 Massive Touch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Card 1: QR ATTENDANCE */}
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setActiveModule('ATTENDANCE');
                }}
                className="group relative bg-gradient-to-b from-[#133029] to-[#0e241f] hover:from-[#1b443a] hover:to-[#122e27] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-8 text-left shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/20 transition-colors" />

                <div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-lg">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    Option 1 • Punch In / Out
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors mb-2">
                    QR Attendance
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    First choose <strong>SIGN IN</strong> (Entry) or <strong>SIGN OUT</strong> (Exit) to scan Student/Faculty ID and log punctuality.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-white">
                  <span>Start Attendance Punch</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card 2: QR FEE SUBMISSION */}
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setActiveModule('FEES');
                  setFeeStep('LOOKUP');
                }}
                className="group relative bg-gradient-to-b from-[#142838] to-[#0c1c28] hover:from-[#1b3a52] hover:to-[#122838] border-2 border-cyan-500/40 hover:border-cyan-400 rounded-3xl p-8 text-left shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />

                <div>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shadow-lg">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                    Option 2 • Universal Code Scan
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors mb-2">
                    QR Fee Submission
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Scan Student Code → Select Pending Months (Tuition, Transport, etc.) → Scan Dynamic UPI QR to Pay &amp; Print Stamped Receipt.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-cyan-900/60 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-white">
                  <span>Start Fee Payment</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            VIEW 2: QR ATTENDANCE (SIGN IN / SIGN OUT)
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'ATTENDANCE' && (
          <div className="w-full max-w-2xl mx-auto bg-[#122A24] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60 mb-6">
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setActiveModule('HOME');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Menu</span>
              </button>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Touchless QR Attendance
              </h3>
            </div>

            {/* STEP 1: CHOOSE SIGN IN OR SIGN OUT (As requested by user) */}
            <div className="mb-6">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2.5">
                1. Select Punch Mode (उपस्थिति का प्रकार चुनें):
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAttMode('SIGN_IN');
                    playSound('beep');
                  }}
                  className={`py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                    attMode === 'SIGN_IN'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-950'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                  }`}
                >
                  <LogIn className="w-5 h-5 stroke-[2.5]" />
                  <span>SIGN IN (Entry / आगमन)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttMode('SIGN_OUT');
                    playSound('beep');
                  }}
                  className={`py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                    attMode === 'SIGN_OUT'
                      ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-lg shadow-amber-950'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                  }`}
                >
                  <LogOut className="w-5 h-5 stroke-[2.5]" />
                  <span>SIGN OUT (Exit / प्रस्थान)</span>
                </button>
              </div>
            </div>

            {/* STEP 2: SCANNER BOX & SUCCESS CARD */}
            {attSuccessStudent ? (
              <div className="bg-emerald-950 border-2 border-emerald-400 rounded-2xl p-6 text-center shadow-xl animate-bounce">
                <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-black text-white mb-0.5">
                  {attSuccessStudent.mode === 'SIGN_IN' ? 'PUNCHED IN SUCCESSFULLY' : 'PUNCHED OUT SUCCESSFULLY'}
                </h4>
                <p className="text-sm font-bold text-emerald-300">
                  {attSuccessStudent.student.full_name} • Class {attSuccessStudent.student.class_name}-{attSuccessStudent.student.section}
                </p>
                <div className="mt-3 inline-block px-4 py-1.5 bg-emerald-900/80 border border-emerald-600 rounded-full text-xs font-mono font-bold text-emerald-200">
                  Time: {attSuccessStudent.time} • Adm: {attSuccessStudent.student.admission_no}
                </div>
                <p className="text-[11px] text-emerald-400/80 mt-3">
                  Next student can punch in 3 seconds...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Laser QR Frame */}
                <div className="relative w-full aspect-video max-h-52 bg-slate-950 rounded-2xl border-2 border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  {/* Laser line animation */}
                  <div className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite] pointer-events-none" />
                  
                  <div className="w-36 h-36 border-2 border-dashed border-emerald-400 rounded-xl flex items-center justify-center text-center p-2">
                    <span className="text-[11px] font-mono text-emerald-300">
                      Align Student ID Barcode / QR Code Here
                    </span>
                  </div>
                </div>

                {/* Instant Tap Selector for Demonstration */}
                <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-200">
                      Tap Student to Simulate Touchless Scan (डेमो स्कैन करें):
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {students.length} Enrolled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {students.slice(0, 6).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handlePunchAttendance(st)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-900/80 border border-emerald-800/60 hover:border-emerald-400 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center">
                            {st.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{st.full_name}</p>
                            <p className="text-[10px] text-emerald-400/80 font-mono">Adm: {st.admission_no}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-300 px-1.5 py-0.5 bg-emerald-950 rounded border border-emerald-800">
                          {attMode === 'SIGN_IN' ? 'IN' : 'OUT'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            VIEW 3: QR FEE SUBMISSION (LOOKUP -> CART -> DYNAMIC UPI QR -> RECEIPT)
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'FEES' && (
          <div className="w-full max-w-2xl mx-auto bg-[#122A24] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60 mb-6">
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  if (feeStep === 'LOOKUP') setActiveModule('HOME');
                  else if (feeStep === 'CART') setFeeStep('LOOKUP');
                  else if (feeStep === 'UPI_QR') setFeeStep('CART');
                  else setActiveModule('HOME');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{feeStep === 'LOOKUP' ? 'Back to Menu' : 'Back'}</span>
              </button>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Universal QR Fee Payment
              </h3>
            </div>

            {/* STEP 1: SCAN UNIVERSAL STUDENT CODE */}
            {feeStep === 'LOOKUP' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Scan or Select Universal Student Code
                  </span>
                  <p className="text-xs text-slate-300">
                    Student ID card ka QR scan karein ya list me se student select karein
                  </p>
                </div>

                {/* Laser QR Visualizer */}
                <div className="relative w-full aspect-video max-h-48 bg-slate-950 rounded-2xl border-2 border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  <div className="absolute inset-x-4 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[bounce_2s_infinite] pointer-events-none" />
                  <div className="w-36 h-36 border-2 border-dashed border-cyan-400 rounded-xl flex items-center justify-center text-center p-2">
                    <span className="text-[11px] font-mono text-cyan-300">
                      Universal Student QR Scanner Active
                    </span>
                  </div>
                </div>

                {/* Quick Student Selector */}
                <div className="bg-slate-900/90 border border-emerald-900/60 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Or Select Student Directly (डेमो छात्र चुनें):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {students.slice(0, 6).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectFeeStudent(st)}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-400 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-600 text-slate-950 font-bold text-xs flex items-center justify-center">
                            {st.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{st.full_name}</p>
                            <p className="text-[10px] text-cyan-300 font-mono">
                              Class {st.class_name}-{st.section} • {st.admission_no}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: STUDENT INFO + ITEMIZED CHECKBOX CART */}
            {feeStep === 'CART' && feeStudent && (
              <div className="space-y-4">
                {/* Student Info Banner */}
                <div className="bg-cyan-950/50 border border-cyan-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-lg shadow">
                      {feeStudent.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        {feeStudent.full_name}
                        <span className="text-[10px] font-mono bg-cyan-900 text-cyan-200 px-1.5 py-0.5 rounded">
                          Class {feeStudent.class_name}-{feeStudent.section}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Adm No: {feeStudent.admission_no} • Father: {feeStudent.father_name || 'Mr. Ramesh Shukla'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/60 px-2.5 py-1 rounded-full border border-cyan-600">
                    Verified Profile
                  </span>
                </div>

                {/* Checkbox Dues List */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Select Fee Heads to Pay (मद चुनें):
                  </span>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedFeeItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleFeeItem(item.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          item.selected
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              item.selected ? 'bg-cyan-400 border-cyan-300 text-slate-950' : 'border-slate-600'
                            }`}
                          >
                            {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold">{item.title}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Total & Proceed Button */}
                <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Amount to Pay</span>
                    <span className="text-xl font-black text-cyan-300 font-mono">
                      {formatCurrency(feeTotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={feeTotal <= 0}
                    onClick={() => {
                      playSound('beep');
                      setFeeStep('UPI_QR');
                    }}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-cyan-950 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Generate UPI Payment QR</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DYNAMIC SCHOOL UPI QR CODE (Amount Embedded) */}
            {feeStep === 'UPI_QR' && feeStudent && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">Scan School UPI QR to Pay</h4>
                  <p className="text-xs text-slate-300">
                    Use GooglePay, PhonePe, Paytm, or any BHIM UPI App
                  </p>
                </div>

                {/* High-Contrast Standee QR Box */}
                <div className="p-4 bg-white rounded-2xl border-4 border-cyan-400 shadow-2xl flex flex-col items-center">
                  <span className="text-[11px] font-mono font-black text-[#122A24] uppercase tracking-wider mb-2">
                    {school.name}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={upiQrImageUrl}
                    alt="School Fee Payment UPI QR"
                    className="w-48 h-48 object-contain"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-base font-black text-[#122A24] font-mono block">
                      PAY EXACT: {formatCurrency(feeTotal)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      VPA: {schoolVpa} • Student: {feeStudent.admission_no}
                    </span>
                  </div>
                </div>

                {/* Simulate / Verify Payment */}
                <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Live Gateway Listener Active
                  </span>
                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Confirm Payment &amp; Print Receipt
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: VERIFIED STAMPED RECEIPT VIEW */}
            {feeStep === 'RECEIPT' && verifiedReceipt && (
              <div className="space-y-4">
                <div className="bg-white text-slate-900 rounded-2xl p-6 border-4 border-[#122A24] shadow-2xl relative">
                  
                  {/* Watermark & Stamp */}
                  <div className="absolute right-6 bottom-16 border-2 border-emerald-800 text-emerald-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest rotate-[-12deg] bg-emerald-50/90 shadow-md">
                    ✓ VERIFIED &amp; PAID<br />ADMIN ACCOUNTS STAMP
                  </div>

                  {/* Top School Header */}
                  <div className="text-center border-b pb-3 mb-3">
                    <h2 className="text-base font-black text-[#122A24] uppercase tracking-wide">
                      {school.name}
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Affiliation No: {school.affiliation_no} • {school.address}
                    </p>
                    <span className="mt-1 inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-bold">
                      OFFICIAL DUAL-COPY FEE RECEIPT (PARENT + SCHOOL COPY)
                    </span>
                  </div>

                  {/* Receipt Meta */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 bg-slate-50 p-2.5 rounded-xl border">
                    <div>
                      <p><strong>Receipt No:</strong> {verifiedReceipt.receipt_no}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p><strong>Mode:</strong> {verifiedReceipt.payment_mode}</p>
                    </div>
                    <div>
                      <p><strong>Student:</strong> {verifiedReceipt.student_name}</p>
                      <p><strong>Adm No:</strong> {verifiedReceipt.admission_no}</p>
                      <p><strong>Class:</strong> {verifiedReceipt.class_name}-{verifiedReceipt.section}</p>
                    </div>
                  </div>

                  {/* Breakdown Summary */}
                  <div className="border-t border-b py-2 mb-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Fee Heads Paid:</span>
                      <p className="text-[10px] text-slate-600 mt-0.5">{verifiedReceipt.remarks}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total Realized</span>
                      <span className="text-base font-black text-emerald-900 font-mono">
                        {formatCurrency(verifiedReceipt.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Signature & Stamp Section */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-600">
                    <div className="text-center">
                      <div className="w-24 border-b border-slate-400 mb-1" />
                      <span>Parent Signature</span>
                    </div>
                    <div className="text-center">
                      <div className="w-24 border-b border-slate-400 mb-1" />
                      <span>Cashier / Admin Stamp</span>
                    </div>
                  </div>
                </div>

                {/* Print & New Action */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Official Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('beep');
                      setActiveModule('HOME');
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Finish / Back to Home
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ─── KIOSK FOOTER ─── */}
      <footer className="px-6 py-3 bg-[#091410] border-t border-emerald-950 text-center text-[11px] text-slate-500 font-mono">
        EduSuite Touchless QR Kiosk Station v3.0 • CBSE Multi-School Enterprise Cloud
      </footer>

    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1612] text-white flex items-center justify-center font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Touchless QR Kiosk...</span>
          </div>
        </div>
      }
    >
      <KioskContent />
    </Suspense>
  );
}
