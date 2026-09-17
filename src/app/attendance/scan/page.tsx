/*! Giterp Multi-School Enterprise ERP Core v1.2.0 - Dedicated Smart QR Attendance Check-In Portal */
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import {
  CheckCircle2,
  AlertCircle,
  QrCode,
  ScanLine,
  User,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  Phone,
  Camera,
  Layers,
  Video,
  VideoOff,
  Volume2,
  RotateCcw
} from 'lucide-react';

function AttendanceScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentId = searchParams.get('student_id') || searchParams.get('id') || '';
  const admissionNo = searchParams.get('admission_no') || searchParams.get('adm') || '';
  const schoolId = searchParams.get('school_id') || 'DPS2026';
  const session = searchParams.get('session') || '2026-27';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Manual input fallback for guards/teachers
  const [manualAdm, setManualAdm] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Play pleasant check-in chime
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}
  };

  const executeScan = async (sId: string, adm: string) => {
    if (!sId && !adm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sId || undefined,
          admission_no: adm || undefined,
          school_id: schoolId,
          session: session
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        playBeep();
      } else {
        setError(data.error || 'Could not verify student record.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while recording attendance.');
    } finally {
      setLoading(false);
    }
  };

  // Smart payload parser for QR code strings
  const handleQrPayload = (rawContent: string) => {
    if (!rawContent || Date.now() - lastScannedTimeRef.current < 2500) return;
    lastScannedTimeRef.current = Date.now();

    try {
      // 1. If it's a URL
      if (rawContent.includes('?') || rawContent.startsWith('http://') || rawContent.startsWith('https://') || rawContent.startsWith('/')) {
        let urlObj: URL;
        try {
          urlObj = new URL(rawContent, window.location.origin);
        } catch {
          urlObj = new URL(`http://dummy.com${rawContent.startsWith('/') ? '' : '/'}${rawContent}`);
        }
        const sId = urlObj.searchParams.get('student_id') || urlObj.searchParams.get('id') || '';
        const adm = urlObj.searchParams.get('admission_no') || urlObj.searchParams.get('adm') || '';
        if (sId || adm) {
          executeScan(sId, adm);
          return;
        }
      }

      // 2. If it's JSON
      if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
        const parsed = JSON.parse(rawContent);
        const sId = parsed.student_id || parsed.id || '';
        const adm = parsed.admission_no || parsed.adm || '';
        if (sId || adm) {
          executeScan(sId, adm);
          return;
        }
      }

      // 3. Fallback: Treat raw string as admission number or student id
      executeScan('', rawContent.trim());
    } catch (e) {
      console.error('QR parsing error:', e);
      executeScan('', rawContent.trim());
    }
  };

  // Camera stream controls
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        requestAnimationFrame(tickScanner);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera permission denied or camera not available. Please allow camera access in browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  const tickScanner = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tickScanner);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        handleQrPayload(code.data);
      }
    }

    animationFrameRef.current = requestAnimationFrame(tickScanner);
  };

  useEffect(() => {
    if (studentId || admissionNo) {
      executeScan(studentId, admissionNo);
    }
    return () => {
      stopCamera();
    };
  }, [studentId, admissionNo]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAdm.trim()) return;
    setIsSearchingManual(true);
    executeScan('', manualAdm.trim()).finally(() => setIsSearchingManual(false));
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] shadow-2xs hover:bg-[#EBF5EF] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open ERP Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#122A24] text-emerald-300 text-[10px] font-mono font-bold tracking-wider">
            <ScanLine className="w-3 h-3 text-emerald-400" />
            <span>SMART GATE SCAN</span>
          </span>
        </div>

        {/* Institution Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#122A24] uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>{result?.school?.school_name || 'CBSE Digital School'}</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-800 font-semibold">
            Biometric & QR Identity Roll • Session {session}
          </p>
        </div>

        {/* Scan Status Display */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-[#DCE8E0] shadow-sm text-center space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#122A24]">Verifying Scholar Identity...</h3>
              <p className="text-xs text-slate-500 mt-1">Marking attendance for today in official database</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-rose-900">Attendance Scan Failed</h3>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => executeScan(studentId, admissionNo)}
              className="px-4 py-2 rounded-xl bg-[#122A24] text-white text-xs font-bold cursor-pointer border-none shadow-xs hover:bg-[#1C443A]"
            >
              Try Again
            </button>
          </div>
        ) : result?.student ? (
          <div className="bg-white rounded-3xl border border-[#C5E2CF] shadow-lg overflow-hidden animate-scale-in">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#122A24] text-white p-4 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-mono font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ATTENDANCE MARKED: PRESENT</span>
              </div>
              <h2 className="font-black text-xl tracking-tight font-display">
                {result.student.full_name}
              </h2>
              <p className="text-xs font-mono text-emerald-200 mt-0.5">
                {result.student.class_name} • Section {result.student.section || 'A'} • Roll #{result.student.roll_no || '1'}
              </p>
            </div>

            {/* Scholar Details with Picture */}
            <div className="p-5 space-y-4">
              
              <div className="flex items-center gap-4">
                {/* Photo */}
                <div className="w-20 h-24 rounded-2xl bg-slate-100 border-2 border-[#122A24] shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {result.student.photo || result.student.avatar ? (
                    <img
                      src={result.student.photo || result.student.avatar}
                      alt={result.student.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#122A24] bg-emerald-50 w-full h-full font-mono font-bold text-xs">
                      <User className="w-8 h-8 text-emerald-700" />
                      <span className="text-[10px] mt-1">
                        {result.student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex-1 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Admission No:</span>
                    <strong className="text-[#122A24]">{result.student.admission_no || result.student.id}</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Scan Time:</span>
                    <strong className="text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.attendance_summary?.time || new Date().toLocaleTimeString()}
                    </strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-slate-700">{result.attendance_summary?.date} (TODAY)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <strong className="text-rose-600">{result.student.blood_group || 'O+'}</strong>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="p-3 bg-[#EBF5EF] rounded-2xl border border-[#C5E2CF] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left text-xs">
                  <strong className="text-[#122A24] block font-sans">Official CBSE Turnout Recorded</strong>
                  <span className="text-[11px] font-mono text-emerald-800">
                    Class Total Present: {result.attendance_summary?.total_present} / {result.attendance_summary?.total_students} Scholars
                  </span>
                </div>
              </div>

              {/* Guardian Contact quick alert */}
              {result.student.guardian_phone && (
                <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Guardian ({result.student.guardian_name || 'Parent'}):</span>
                  </span>
                  <strong>{result.student.guardian_phone}</strong>
                </div>
              )}

            </div>
          </div>
        ) : null}

        {/* Live Camera Scanner Box / Viewfinder */}
        <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-xs text-[#122A24] uppercase tracking-wider">
                Live Camera QR Scanner
              </h4>
            </div>
            {isCameraActive && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center gap-1 border-none cursor-pointer"
                title="Switch Camera (Front/Back)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Flip</span>
              </button>
            )}
          </div>

          {/* Camera Viewfinder */}
          {isCameraActive ? (
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-emerald-500 shadow-inner">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Scanning Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400 rounded-2xl relative">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-300 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-300 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-300 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-300 rounded-br-md" />

                  {/* Animated scanning laser beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent absolute top-0 animate-bounce shadow-sm" />
                </div>
              </div>

              {/* Live Active Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SCANNING ID CARD...</span>
              </div>

              {/* Stop Camera Button */}
              <button
                type="button"
                onClick={stopCamera}
                className="absolute bottom-3 right-3 bg-rose-600/90 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-md transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Close Camera</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-5 px-4 rounded-2xl bg-gradient-to-b from-[#EBF5EF] to-white border border-[#C5E2CF] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white mx-auto flex items-center justify-center shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#122A24]">Point Camera at I-Card QR</h5>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-xs mx-auto">
                  Hold the student physical ID card or phone screen in front of your camera for auto check-in.
                </p>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-sans">
                  {cameraError}
                </div>
              )}

              <button
                type="button"
                onClick={() => startCamera()}
                className="px-5 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs border-none cursor-pointer shadow-md inline-flex items-center gap-2 transition-all transform active:scale-98"
              >
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Start Live Camera Scanner</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Admission Number Check-in */}
        <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-xs text-[#122A24] uppercase tracking-wider">
              Scan Next / Manual Admission Search
            </h4>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualAdm}
              onChange={(e) => setManualAdm(e.target.value)}
              placeholder="e.g. ADM2026-001 or ID"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isSearchingManual || !manualAdm.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#122A24] text-white font-bold text-xs cursor-pointer border-none hover:bg-[#1C443A] disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearchingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
              <span>Mark</span>
            </button>
          </form>
        </div>

        {/* Date Footer */}
        <div className="text-center text-[11px] font-mono text-slate-400">
          {todayFormatted} • CBSE Auto-Attendance Cloud Engine
        </div>

      </div>
    </div>
  );
}

export default function AttendanceScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F8F5] flex items-center justify-center font-mono text-xs text-slate-500">Loading Smart QR Scanner...</div>}>
      <AttendanceScanContent />
    </Suspense>
  );
}
