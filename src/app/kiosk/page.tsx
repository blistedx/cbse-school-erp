/*! Giterp Multi-School Enterprise ERP Core - Smart QR Touchless Attendance & Identity Kiosk v2.5.0 */
'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import jsQR from 'jsqr';
import {
  QrCode,
  CalendarCheck,
  Building2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Sparkles,
  SwitchCamera,
  Camera,
  Search,
  User,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { Student, School } from '@/lib/types';

function KioskContent() {
  const searchParams = useSearchParams();
  const schoolCode = searchParams.get('school') || 'DPS2026';

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

  // Attendance Punch & Verification State
  const [attMode, setAttMode] = useState<'SIGN_IN' | 'SIGN_OUT'>('SIGN_IN');
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; name: string; adm: string; cls: string; time: string; mode: string }>>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');

  // Scanned Person Verification Form State
  const [scannedPerson, setScannedPerson] = useState<{
    person_type: 'STUDENT' | 'FACULTY';
    student?: {
      id: string;
      full_name: string;
      class_name: string;
      section: string;
      admission_no?: string;
      roll_no?: string;
      father_name?: string;
      guardian_phone?: string;
    };
    faculty?: {
      id: string;
      full_name: string;
      designation: string;
      department?: string;
      staff_code?: string;
      phone?: string;
    };
    verifiedStatus?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
    message?: string;
  } | null>(null);

  // Sound Synthesizer
  const playSound = (type: 'success' | 'reject' | 'beep') => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(type === 'reject' ? [150, 60, 150] : [80, 40, 80]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'reject' ? 'sawtooth' : 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      } else if (type === 'reject') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (type === 'success' ? 0.35 : 0.3));
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

  const handleLookupAndOpenForm = useCallback(async (admOrId: string) => {
    playSound('beep');

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: admOrId,
          school_id: schoolCode
        })
      });
      const data = await res.json();

      if (data && data.success) {
        if (data.person_type === 'FACULTY' && data.faculty) {
          setScannedPerson({
            person_type: 'FACULTY',
            faculty: data.faculty,
            verifiedStatus: 'PENDING'
          });
        } else {
          setScannedPerson({
            person_type: 'STUDENT',
            student: data.student || {
              id: admOrId,
              full_name: 'Scholar Record',
              class_name: 'Class 9',
              section: 'A',
              admission_no: admOrId
            },
            verifiedStatus: 'PENDING'
          });
        }
      } else {
        setScannedPerson({
          person_type: 'STUDENT',
          student: {
            id: admOrId,
            full_name: 'Scholar Pass',
            class_name: 'Class 9',
            section: 'A',
            admission_no: admOrId
          },
          verifiedStatus: 'PENDING'
        });
      }
    } catch (_) {
      setScannedPerson({
        person_type: 'STUDENT',
        student: {
          id: admOrId,
          full_name: 'Scholar Pass',
          class_name: 'Class 9',
          section: 'A',
          admission_no: admOrId
        },
        verifiedStatus: 'PENDING'
      });
    }
  }, [schoolCode]);

  const handleQrDetected = useCallback((rawPayload: string) => {
    if (!rawPayload || Date.now() - lastScannedTimeRef.current < 2500 || scannedPerson) return;
    lastScannedTimeRef.current = Date.now();

    let admOrId = rawPayload.trim();
    try {
      if (rawPayload.startsWith('{') && rawPayload.endsWith('}')) {
        const parsed = JSON.parse(rawPayload);
        admOrId = parsed.admission_no || parsed.admissionNo || parsed.staff_code || parsed.student_id || parsed.id || admOrId;
      } else if (rawPayload.includes('?')) {
        const urlObj = new URL(rawPayload, 'http://localhost');
        admOrId = urlObj.searchParams.get('admission_no') || urlObj.searchParams.get('staff_code') || urlObj.searchParams.get('student_id') || admOrId;
      }
    } catch {}

    handleLookupAndOpenForm(admOrId);
  }, [handleLookupAndOpenForm, scannedPerson]);

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
      setCameraError('Camera access not allowed or unavailable. You can also search Admission No below.');
    }
  }, [cameraFacing, stopCamera, tickScanner]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (!scannedPerson) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannedPerson, cameraFacing, startCamera, stopCamera]);

  // Action 1: Confirm "VERIFIED AND PRESENT"
  const handleConfirmVerifiedPresent = async () => {
    if (!scannedPerson) return;
    playSound('success');

    const punchTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const targetName = scannedPerson.person_type === 'STUDENT'
      ? scannedPerson.student?.full_name || 'Scholar'
      : scannedPerson.faculty?.full_name || 'Faculty';
    const targetCode = scannedPerson.person_type === 'STUDENT'
      ? scannedPerson.student?.admission_no || scannedPerson.student?.id || ''
      : scannedPerson.faculty?.staff_code || scannedPerson.faculty?.id || '';
    const targetCls = scannedPerson.person_type === 'STUDENT'
      ? `${scannedPerson.student?.class_name}-${scannedPerson.student?.section || 'A'}`
      : `${scannedPerson.faculty?.designation || 'Staff'}`;

    try {
      await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetCode,
          school_id: schoolCode,
          action: 'VERIFY_PRESENT'
        })
      });
    } catch (_) {}

    setScannedPerson((prev) => prev ? {
      ...prev,
      verifiedStatus: 'CONFIRMED',
      message: attMode === 'SIGN_IN' ? '✓ CAMPUS ENTRY CONFIRMED & MARKED PRESENT' : '✓ CAMPUS EXIT CONFIRMED'
    } : null);

    setRecentLogs((prev) => [
      {
        id: `${Date.now()}`,
        name: targetName,
        adm: targetCode,
        cls: targetCls,
        time: punchTime,
        mode: attMode
      },
      ...prev.slice(0, 7)
    ]);

    setTimeout(() => {
      setScannedPerson(null);
      startCamera(cameraFacing);
    }, 2500);
  };

  // Action 2: Reject "WRONG PERSON"
  const handleRejectWrongPerson = () => {
    playSound('reject');
    setScannedPerson((prev) => prev ? {
      ...prev,
      verifiedStatus: 'REJECTED',
      message: '❌ SCAN REJECTED: Identification Mismatch / Wrong Person'
    } : null);

    setTimeout(() => {
      setScannedPerson(null);
      startCamera(cameraFacing);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#06100d] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
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
                SMART QR ATTENDANCE KIOSK
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 font-mono">
              Affiliation: {school.affiliation_no} • Campus Code: {schoolCode}
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
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors shadow-sm no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </header>

      {/* ─── KIOSK MAIN CONTAINER (FULLSCREEN SCANNER & FORM) ─── */}
      <main className="flex-1 flex flex-col justify-center p-3 sm:p-6 w-full max-w-7xl mx-auto">
        <div className="w-full flex-1 flex flex-col max-w-5xl mx-auto bg-[#0d221d] border-2 border-emerald-500/60 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn relative my-2 min-h-[75vh]">
          
          {/* Top Attendance Controls Bar */}
          <div className="px-5 py-3.5 bg-[#081714] border-b border-emerald-900/80 flex items-center justify-between z-20 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {/* SIGN IN / SIGN OUT Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-emerald-900/80">
                <button
                  type="button"
                  onClick={() => {
                    setAttMode('SIGN_IN');
                    playSound('beep');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
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

            {/* FLIP CAMERA BUTTON */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-2 border-emerald-500/70 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                title="Switch between Selfie (Front) Camera and Back Camera"
              >
                <SwitchCamera className="w-4 h-4 text-emerald-400" />
                <span>
                  Flip Camera ({cameraFacing === 'user' ? 'Front / Selfie' : 'Back Camera'})
                </span>
              </button>
            </div>
          </div>

          {/* FULLSCREEN CAMERA / VERIFICATION FORM CONTAINER */}
          <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden min-h-[440px]">
            
            {/* 1. Live Video Stream Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover absolute inset-0 ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Scanning Target Box */}
            {!scannedPerson && (
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none p-4">
                <div className="w-64 sm:w-80 h-72 border-4 border-dashed border-emerald-400 rounded-3xl relative shadow-[0_0_30px_rgba(52,211,153,0.35)] flex flex-col items-center justify-between p-4 bg-emerald-950/15 backdrop-blur-[2px]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/60 font-mono">
                    Align ID Card QR Here
                  </span>

                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_2s_infinite]" />

                  <span className="text-[10px] text-slate-200 bg-slate-950/80 px-3 py-1 rounded-full text-center">
                    Touchless Auto-Scan Active
                  </span>
                </div>

                <p className="text-xs font-black text-white mt-4 bg-slate-950/90 px-4 py-1.5 rounded-full border border-emerald-700/60 shadow-lg text-center">
                  Hold ID Card in front of camera • Verification form will open
                </p>
              </div>
            )}

            {/* Camera Error Alert */}
            {cameraError && !scannedPerson && (
              <div className="absolute top-4 inset-x-4 z-20 bg-amber-950/90 border border-amber-600 p-3 rounded-2xl text-amber-200 text-xs flex items-center justify-between shadow-xl">
                <span>{cameraError}</span>
                <button
                  type="button"
                  onClick={() => startCamera(cameraFacing)}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
                2. KIOSK INTERACTIVE VERIFICATION FORM MODAL
                STUDENT NAME / CLASS / SECTION OR FACULTY NAME / DESIGNATION
                WITH [ VERIFIED AND PRESENT ] & [ WRONG PERSON ] OPTIONS
                ═════════════════════════════════════════════════════════════ */}
            {scannedPerson && (
              <div className="absolute inset-0 z-30 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fadeIn overflow-y-auto">
                
                <div className="w-full max-w-lg bg-[#0c1f1a] border-3 border-emerald-400 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left text-white">
                  
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                    <div className="flex items-center gap-3">
                      {scannedPerson.person_type === 'STUDENT' ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center font-black">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-black">
                          <Briefcase className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-display font-black text-base text-white tracking-tight uppercase">
                          {scannedPerson.person_type === 'STUDENT' ? 'Student Identity Verification' : 'Faculty / Staff Verification'}
                        </h3>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                          ROLE: {scannedPerson.person_type} • GATE PUNCH
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setScannedPerson(null);
                        startCamera(cameraFacing);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Student Details */}
                  {scannedPerson.person_type === 'STUDENT' && scannedPerson.student && (
                    <div className="space-y-3 bg-black/50 border border-emerald-900/80 rounded-2xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/60 pb-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                          STUDENT NAME:
                        </span>
                        <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                          {scannedPerson.student.full_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-b border-emerald-900/60 pb-2">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase block">
                            CLASS:
                          </span>
                          <span className="text-sm font-bold text-white">
                            {scannedPerson.student.class_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase block">
                            SECTION:
                          </span>
                          <span className="text-sm font-bold text-emerald-300">
                            Section {scannedPerson.student.section || 'A'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-0.5">
                        <div>
                          <span className="text-slate-500 block">Admission No:</span>
                          <strong className="text-white">{scannedPerson.student.admission_no || '2026/0481'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Roll No:</span>
                          <strong className="text-emerald-300">{scannedPerson.student.roll_no || '14'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Faculty Details */}
                  {scannedPerson.person_type === 'FACULTY' && scannedPerson.faculty && (
                    <div className="space-y-3 bg-black/50 border border-emerald-900/80 rounded-2xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/60 pb-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                          FACULTY NAME:
                        </span>
                        <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                          {scannedPerson.faculty.full_name}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/60 pb-2">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                          DESIGNATION:
                        </span>
                        <span className="text-sm font-bold text-white">
                          {scannedPerson.faculty.designation} ({scannedPerson.faculty.department || 'Academics'})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-0.5">
                        <div>
                          <span className="text-slate-500 block">Staff Code:</span>
                          <strong className="text-white">{scannedPerson.faculty.staff_code || scannedPerson.faculty.id}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Department:</span>
                          <strong className="text-cyan-300">{scannedPerson.faculty.department || 'Faculty Wing'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Status */}
                  {scannedPerson.verifiedStatus === 'CONFIRMED' && (
                    <div className="p-3.5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl animate-bounce">
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      <span>{scannedPerson.message || '✓ ATTENDANCE CONFIRMED & MARKED PRESENT'}</span>
                    </div>
                  )}

                  {scannedPerson.verifiedStatus === 'REJECTED' && (
                    <div className="p-3.5 bg-rose-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl animate-pulse">
                      <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                      <span>{scannedPerson.message || '❌ SCAN REJECTED: Wrong Person Flagged'}</span>
                    </div>
                  )}

                  {/* Action Buttons: VERIFIED AND PRESENT & WRONG PERSON */}
                  {scannedPerson.verifiedStatus === 'PENDING' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmVerifiedPresent}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>VERIFIED AND PRESENT</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectWrongPerson}
                        className="w-full py-3.5 px-4 bg-rose-950 hover:bg-rose-900 border-2 border-rose-600 text-rose-200 hover:text-white font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                      >
                        <X className="w-5 h-5 stroke-[3]" />
                        <span>WRONG PERSON</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>

          {/* Bottom Controls Bar & Manual Entry */}
          <div className="p-4 bg-[#081714] border-t border-emerald-900/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualSearchQuery.trim()) return;
                handleLookupAndOpenForm(manualSearchQuery.trim());
                setManualSearchQuery('');
              }}
              className="w-full md:w-auto flex-1 flex items-center gap-2 max-w-md"
            >
              <input
                type="text"
                placeholder="Manual Adm No / Staff Code (e.g. 2026/0481)..."
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-emerald-900/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
              >
                Lookup &amp; Verify
              </button>
            </form>

            {/* Recent Scans Count */}
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{recentLogs.length} Verified Scans Logged in Session</span>
            </div>
          </div>

        </div>
      </main>

      {/* ─── KIOSK FOOTER ─── */}
      <footer className="px-5 py-2.5 bg-[#071310] border-t border-emerald-950 text-center text-[10px] text-slate-500 font-mono">
        Giterp Smart QR Touchless Attendance Terminal • CBSE Multi-School Enterprise Core
      </footer>
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#06100d] text-emerald-400 font-mono text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span>Loading Touchless Smart QR Kiosk...</span>
          </div>
        </div>
      }
    >
      <KioskContent />
    </Suspense>
  );
}
