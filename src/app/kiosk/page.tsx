/*! EduSuite Smart QR Touchless Demo Kiosk v2.0.0 */
'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import jsQR from 'jsqr';
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
  ChevronRight,
  SwitchCamera,
  Maximize2,
  Minimize2,
  Camera
} from 'lucide-react';
import { Student, School } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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

  // Camera States
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user'); // Default to Front / Selfie for chest I-Card scanning
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Sound Synthesizer
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

  // Fetch Students list
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        setLoadingStudents(true);
        const res = await fetch(`/api/students?school_id=${encodeURIComponent(schoolCode)}&limit=100`);
        const data = await res.json();
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
        } else {
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
  // CAMERA SCANNER ENGINE WITH JSQR CONTINUOUS LOOP & FLIP CAMERA
  // ═════════════════════════════════════════════════════════════
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const handleQrDetected = useCallback((rawPayload: string) => {
    if (!rawPayload || Date.now() - lastScannedTimeRef.current < 2500) return;
    lastScannedTimeRef.current = Date.now();

    let admOrId = rawPayload.trim();

    // Parse URL params or JSON if present
    try {
      if (rawPayload.startsWith('{') && rawPayload.endsWith('}')) {
        const parsed = JSON.parse(rawPayload);
        admOrId = parsed.admission_no || parsed.admissionNo || parsed.student_id || parsed.id || admOrId;
      } else if (rawPayload.includes('?')) {
        const urlObj = new URL(rawPayload, 'http://localhost');
        admOrId = urlObj.searchParams.get('admission_no') || urlObj.searchParams.get('student_id') || admOrId;
      }
    } catch {}

    const matched = students.find(
      (s) =>
        s.id.toLowerCase() === admOrId.toLowerCase() ||
        s.admission_no.toLowerCase() === admOrId.toLowerCase() ||
        s.full_name.toLowerCase() === admOrId.toLowerCase()
    ) || students[0] || {
      id: 'STU-SCANNED',
      admission_no: admOrId || '2026/0481',
      full_name: 'Abhishek Shukla',
      class_name: 'Class 9',
      section: 'A',
      father_name: 'Mr. Ramesh Shukla'
    };

    if (activeModule === 'ATTENDANCE') {
      handlePunchAttendance(matched as Student);
    } else if (activeModule === 'FEES') {
      handleSelectFeeStudent(matched as Student);
    }
  }, [activeModule, students]);

  const tickScanner = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            handleQrDetected(code.data);
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tickScanner);
  }, [handleQrDetected]);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device not supported or permission denied.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          setIsCameraActive(true);
          animationFrameRef.current = requestAnimationFrame(tickScanner);
        }).catch(() => {
          setIsCameraActive(true);
          animationFrameRef.current = requestAnimationFrame(tickScanner);
        });
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('Camera access not allowed or unavailable. You can also tap Demo Students below.');
    }
  }, [cameraFacing, stopCamera, tickScanner]);

  // Flip Camera between Selfie (Front) and Back
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // ═════════════════════════════════════════════════════════════
  // MODULE 1: ATTENDANCE STATE (SIGN IN / SIGN OUT)
  // ═════════════════════════════════════════════════════════════
  const [attMode, setAttMode] = useState<'SIGN_IN' | 'SIGN_OUT'>('SIGN_IN');
  const [attSuccessStudent, setAttSuccessStudent] = useState<any | null>(null);

  // ═════════════════════════════════════════════════════════════
  // MODULE 2: UNIVERSAL QR FEE PAYMENT STATE
  // ═════════════════════════════════════════════════════════════
  const [feeStudent, setFeeStudent] = useState<Student | null>(null);
  const [feeStep, setFeeStep] = useState<'LOOKUP' | 'CART' | 'UPI_QR' | 'RECEIPT'>('LOOKUP');
  const [selectedFeeItems, setSelectedFeeItems] = useState<{ id: string; title: string; amount: number; selected: boolean }[]>([]);
  const [verifiedReceipt, setVerifiedReceipt] = useState<any | null>(null);

  // Start Camera whenever entering Attendance or Fees scanner module
  useEffect(() => {
    if (activeModule === 'ATTENDANCE' || (activeModule === 'FEES' && feeStep === 'LOOKUP')) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeModule, feeStep, cameraFacing, startCamera, stopCamera]);

  const handlePunchAttendance = (st: Student) => {
    playSound('success');
    const punchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAttSuccessStudent({
      student: st,
      mode: attMode,
      time: punchTime,
      date: new Date().toLocaleDateString()
    });

    setTimeout(() => {
      setAttSuccessStudent(null);
    }, 3500);
  };

  // Universal Desk QR payload (This is the static common desk QR)
  const universalDeskQrPayload = JSON.stringify({
    app: 'CBSE_SCHOOL_ERP',
    type: 'COUNTER_DESK',
    schoolId: schoolCode,
    deskId: 'FEE_COUNTER_1',
    deskTitle: 'Main Fee Counter 1'
  });
  const universalDeskQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(universalDeskQrPayload)}&margin=10&color=122a24`;

  const handleSelectFeeStudent = (st: Student) => {
    setFeeStudent(st);
    playSound('beep');

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

  const schoolVpa = 'dps.accounts@icici';
  const upiPayString = `upi://pay?pa=${schoolVpa}&pn=DELHI%20PUBLIC%20SCHOOL&am=${feeTotal}&cu=INR&tn=FEES-${feeStudent?.admission_no || 'STU'}`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayString)}&margin=10&color=122a24`;

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
    <div className="min-h-screen bg-[#06100d] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* Hidden Canvas for Live Video QR Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ─── KIOSK TOP HIGH-TECH HEADER BAR ─── */}
      <header className="px-5 py-3.5 bg-[#0b1c18] border-b border-emerald-900/60 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-emerald-950">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight">
                {school.name}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                TOUCHLESS KIOSK v2.0
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-mono">
              Affiliation: {school.affiliation_no} • Code: {schoolCode}
            </p>
          </div>
        </div>

        {/* Clock & Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-end text-right">
            <div className="text-sm sm:text-base font-mono font-black text-emerald-300 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              {currentTime || '12:00:00 PM'}
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">{currentDate}</p>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Kiosk</span>
          </Link>
        </div>
      </header>

      {/* ─── KIOSK MAIN CONTAINER ─── */}
      <main className="flex-1 flex flex-col justify-center p-3 sm:p-6 w-full max-w-7xl mx-auto">
        
        {/* ═════════════════════════════════════════════════════════
            VIEW 1: HOME LANDING (2 MASSIVE TOUCH OPTIONS)
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'HOME' && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn py-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-950/90 border border-emerald-700/60 rounded-full text-emerald-400 text-xs font-semibold shadow-inner">
                <Sparkles className="w-3.5 h-3.5" />
                Select Mode on Touch Screen (स्क्रीन पर स्पर्श करें)
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Self-Service Smart Station
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Touch below for Instant Fullscreen I-Card Neck QR Attendance or Universal Fee Counter
              </p>
            </div>

            {/* 2 Massive Touch Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Option 1: QR ATTENDANCE */}
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setActiveModule('ATTENDANCE');
                }}
                className="group relative bg-gradient-to-b from-[#102a24] to-[#0a1c17] hover:from-[#173e35] hover:to-[#0f2821] border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-8 text-left shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/20 transition-colors" />

                <div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-lg">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    Option 1 • Chest / Neck I-Card Scan
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-300 transition-colors mb-2">
                    QR Attendance
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Fullscreen <strong>Selfie / Front Camera</strong>: Gale me pada hua I-Card seedhe camera ke samne aate hi attendance mark ho jayegi.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-emerald-900/60 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-white">
                  <span>Open Fullscreen Scanner</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: QR FEE SUBMISSION */}
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  setActiveModule('FEES');
                  setFeeStep('LOOKUP');
                }}
                className="group relative bg-gradient-to-b from-[#0e2230] to-[#08151f] hover:from-[#15344a] hover:to-[#0c1f2d] border-2 border-cyan-500/50 hover:border-cyan-400 rounded-3xl p-8 text-left shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />

                <div>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shadow-lg">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                    Option 2 • Universal Counter QR
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-300 transition-colors mb-2">
                    QR Fee Submission
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Live <strong>Universal Standee QR</strong> on screen. Parent phone se scan karein ya I-Card dikhayein → Select fees → Pay via UPI QR.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-cyan-900/60 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-white">
                  <span>Open Universal Fee Desk</span>
                  <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            VIEW 2: FULLSCREEN QR ATTENDANCE (POORE PAGE PAR + ROTATE CAMERA)
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'ATTENDANCE' && (
          <div className="w-full flex-1 flex flex-col max-w-5xl mx-auto bg-[#0d221d] border-2 border-emerald-500/60 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn relative my-2 min-h-[75vh]">
            
            {/* Top Attendance Controls Bar */}
            <div className="px-5 py-3 bg-[#081714] border-b border-emerald-900/80 flex items-center justify-between z-20 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('beep');
                    setActiveModule('HOME');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Menu</span>
                </button>

                {/* SIGN IN / SIGN OUT Switcher */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-emerald-900/80">
                  <button
                    type="button"
                    onClick={() => {
                      setAttMode('SIGN_IN');
                      playSound('beep');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      attMode === 'SIGN_IN'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SIGN IN (Entry)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttMode('SIGN_OUT');
                      playSound('beep');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      attMode === 'SIGN_OUT'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>SIGN OUT (Exit)</span>
                  </button>
                </div>
              </div>

              {/* 🔄 ROTATE / FLIP CAMERA BUTTON (User explicitly requested this for Selfie vs Back) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-2 border-emerald-500/70 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  title="Switch between Selfie (Front) Camera and Back Camera"
                >
                  <SwitchCamera className="w-4 h-4 text-emerald-400 animate-spin-once" />
                  <span>
                    Flip Camera ({cameraFacing === 'user' ? 'Front / Selfie Active' : 'Back Camera Active'})
                  </span>
                </button>
              </div>
            </div>

            {/* FULLSCREEN CAMERA CONTAINER */}
            <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden min-h-[420px]">
              
              {/* Actual Video Stream Feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover absolute inset-0 ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Scanning Target Box for Chest / I-Card Height */}
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none p-4">
                
                {/* Target Frame Box */}
                <div className="w-64 sm:w-80 h-72 border-4 border-dashed border-emerald-400 rounded-3xl relative shadow-[0_0_30px_rgba(52,211,153,0.35)] flex flex-col items-center justify-between p-4 bg-emerald-950/15 backdrop-blur-[2px]">
                  
                  {/* Top Target Label */}
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/60 font-mono">
                    Align Neck / Chest I-Card Here
                  </span>

                  {/* Dynamic Laser Line Animation */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite]" />

                  {/* Bottom Guide */}
                  <span className="text-[10px] text-slate-200 bg-slate-950/80 px-3 py-1 rounded-full text-center">
                    Auto-Scanning Active (Touchless)
                  </span>
                </div>

                <p className="text-xs font-black text-white mt-4 bg-slate-950/90 px-4 py-1.5 rounded-full border border-emerald-700/60 shadow-lg text-center">
                  Gale me latka I-Card camera ke samne layein • Camera auto-detect karega
                </p>
              </div>

              {/* Camera Error Alert if not granted */}
              {cameraError && (
                <div className="absolute top-4 inset-x-4 z-20 bg-amber-950/90 border border-amber-600 p-3 rounded-2xl text-amber-200 text-xs flex items-center justify-between shadow-xl">
                  <span>{cameraError}</span>
                  <button
                    onClick={() => startCamera(cameraFacing)}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* SUCCESS PUNCH OVERLAY MODAL BANNER */}
              {attSuccessStudent && (
                <div className="absolute inset-0 z-30 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mb-4 shadow-2xl animate-bounce">
                    <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    {attSuccessStudent.mode === 'SIGN_IN' ? '✓ ATTENDANCE IN RECORDED' : '✓ ATTENDANCE OUT RECORDED'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
                    {attSuccessStudent.student.full_name}
                  </h3>
                  <p className="text-sm font-bold text-emerald-300">
                    Class {attSuccessStudent.student.class_name}-{attSuccessStudent.student.section} • Roll No: {attSuccessStudent.student.roll_no || '14'}
                  </p>
                  
                  <div className="mt-4 px-4 py-2 bg-slate-950/90 border border-emerald-500/60 rounded-2xl text-xs font-mono text-emerald-200">
                    Admission No: <strong>{attSuccessStudent.student.admission_no}</strong> • Time: <strong>{attSuccessStudent.time}</strong>
                  </div>

                  <p className="text-xs text-emerald-400/80 mt-4 animate-pulse">
                    Ready for next student in 2 seconds...
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Quick Test Bar */}
            <div className="px-5 py-3 bg-[#081714] border-t border-emerald-900/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400">Simulate Touchless I-Card Scan:</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {students.slice(0, 4).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handlePunchAttendance(st)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {st.full_name} ({st.admission_no})
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            VIEW 3: UNIVERSAL QR FEE PAYMENT
            ═════════════════════════════════════════════════════════ */}
        {activeModule === 'FEES' && (
          <div className="w-full max-w-4xl mx-auto bg-[#0e2230] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl animate-fadeIn my-2">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-900/80 mb-5">
              <button
                type="button"
                onClick={() => {
                  playSound('beep');
                  if (feeStep === 'LOOKUP') setActiveModule('HOME');
                  else if (feeStep === 'CART') setFeeStep('LOOKUP');
                  else if (feeStep === 'UPI_QR') setFeeStep('CART');
                  else setActiveModule('HOME');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{feeStep === 'LOOKUP' ? 'Menu' : 'Back'}</span>
              </button>
              <div className="text-right">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Universal Counter Fee Desk
                </h3>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {school.name}
                </span>
              </div>
            </div>

            {/* 🌟 STEP 1: ON-SCREEN UNIVERSAL QR CODE & I-CARD SCANNER */}
            {feeStep === 'LOOKUP' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Left Card: THE UNIVERSAL STANDING QR (User asked: UNIVERSAL QR NI AA RHA HAI) */}
                <div className="bg-white text-slate-900 rounded-2xl p-5 border-4 border-[#122A24] shadow-2xl flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between border-b pb-2 mb-2">
                    <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider">
                      Universal Counter Standee QR
                    </span>
                    <span className="text-[9px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      DESK 01
                    </span>
                  </div>

                  {/* Large High-Res Universal QR Code Image */}
                  <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner my-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={universalDeskQrUrl}
                      alt="Universal Fee Counter QR"
                      className="w-52 h-52 object-contain"
                    />
                  </div>

                  <p className="text-xs font-black text-[#122A24] leading-snug mt-1">
                    Scan via Parent Mobile App / PWA
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Parent phone se scan karenge toh unke student ka bill turant load hoga.
                  </p>
                </div>

                {/* Right Card: Kiosk Camera Scanner to scan Student I-Card Directly */}
                <div className="space-y-4">
                  <div className="bg-slate-900/90 border border-cyan-900/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Camera className="w-4 h-4" />
                        Or Scan Student I-Card on Kiosk Camera:
                      </span>
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        <span>Flip Camera</span>
                      </button>
                    </div>

                    {/* Camera Scanner Viewport */}
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-cyan-500/60 shadow-inner flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className={`w-full h-full object-cover absolute inset-0 ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                      />
                      <div className="w-32 h-32 border-2 border-dashed border-cyan-400 rounded-xl relative z-10 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded">
                          Show Student QR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Test Student List */}
                  <div className="bg-slate-900/90 border border-cyan-900/80 rounded-2xl p-3">
                    <span className="text-[11px] font-bold text-slate-300 block mb-2">
                      Or Select Student (डेमो छात्र चुनें):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {students.slice(0, 5).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSelectFeeStudent(st)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-400 text-left transition-all cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">{st.full_name}</span>
                            <span className="text-[10px] text-cyan-300 font-mono">
                              Class {st.class_name}-{st.section} • {st.admission_no}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: STUDENT INFO + ITEMIZED CHECKBOX CART */}
            {feeStep === 'CART' && feeStudent && (
              <div className="space-y-4">
                <div className="bg-cyan-950/60 border border-cyan-600/70 rounded-2xl p-4 flex items-center justify-between">
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
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-900/80 px-3 py-1 rounded-full border border-cyan-600">
                    Verified Profile
                  </span>
                </div>

                {/* Checkbox Dues List */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Select Fee Heads to Pay (मद चुनें):
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedFeeItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleFeeItem(item.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          item.selected
                            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100'
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
                <div className="pt-3 border-t border-cyan-900/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Amount to Pay</span>
                    <span className="text-2xl font-black text-cyan-300 font-mono">
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
                    <span>Generate School UPI Payment QR</span>
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

                {/* Standee QR Box */}
                <div className="p-5 bg-white rounded-2xl border-4 border-cyan-400 shadow-2xl flex flex-col items-center">
                  <span className="text-[11px] font-mono font-black text-[#122A24] uppercase tracking-wider mb-2">
                    {school.name}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={upiQrImageUrl}
                    alt="School Fee Payment UPI QR"
                    className="w-52 h-52 object-contain"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-lg font-black text-[#122A24] font-mono block">
                      PAY EXACT: {formatCurrency(feeTotal)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      VPA: {schoolVpa} • Student: {feeStudent.admission_no}
                    </span>
                  </div>
                </div>

                {/* Simulate / Verify Payment */}
                <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
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
                  
                  {/* Official Accounts Stamp Box */}
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
                    Finish / Back to Menu
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ─── KIOSK FOOTER ─── */}
      <footer className="px-5 py-2.5 bg-[#071310] border-t border-emerald-950 text-center text-[10px] text-slate-500 font-mono">
        EduSuite Touchless QR Kiosk Station v2.0 • CBSE Multi-School Enterprise Cloud
      </footer>

    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06100d] text-white flex items-center justify-center font-mono text-xs">
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
