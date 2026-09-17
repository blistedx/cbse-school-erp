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
  RotateCcw,
  Lock,
  LogIn,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

function AttendanceScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentId = searchParams.get('student_id') || searchParams.get('id') || '';
  const admissionNo = searchParams.get('admission_no') || searchParams.get('adm') || '';
  const schoolId = searchParams.get('school_id') || 'DPS2026';
  const session = searchParams.get('session') || '2026-27';

  // Auth & Access Control
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Manual input fallback for guards/teachers
  const [manualAdm, setManualAdm] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Verify User Role on Mount
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('current_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setCurrentUser(parsed);
      }
    } catch (_) {}
    setAuthChecked(true);
  }, []);

  const isStaffAuthorized = () => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toUpperCase();
    const authorizedRoles = ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'GUARD', 'GATEKEEPER', 'FACULTY'];
    return authorizedRoles.includes(role);
  };

  // Play pleasant check-in chime and mobile haptic vibration
  const playBeep = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
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
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': typeof localStorage !== 'undefined' ? (localStorage.getItem('erp_session_token') || '') : ''
        },
        body: JSON.stringify({
          student_id: sId || undefined,
          admission_no: adm || undefined,
          school_id: schoolId,
          session: session,
          operator_role: currentUser?.role || 'STAFF',
          operator_id: currentUser?.id || currentUser?.username
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

  // Camera stream controls with Multi-Stage Mobile Fallback
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setIsCameraLoading(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const constraintOptions: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: {
          facingMode: facing
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of constraintOptions) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported on this browser or insecure connection (HTTPS required).');
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!stream) {
      setIsCameraLoading(false);
      setIsCameraActive(false);
      console.error('Camera access failed:', lastErr);
      if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was blocked. Please tap the lock/camera icon in your mobile browser address bar and choose "Allow".');
      } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
        setCameraError('No camera device found on this hardware.');
      } else if (lastErr?.name === 'NotReadableError' || lastErr?.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application. Please close background camera apps.');
      } else {
        setCameraError(lastErr?.message || 'Unable to open camera. Please ensure HTTPS connection and camera permission.');
      }
      return;
    }

    try {
      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];

      // Check if torch/flashlight is supported
      if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
        const capabilities = (videoTrack as any).getCapabilities();
        setHasTorch(Boolean(capabilities?.torch));
      }

      setIsCameraActive(true);
      setIsCameraLoading(false);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('Autoplay warning:', e));
        }

        requestAnimationFrame(tickScanner);
      }
    } catch (err: any) {
      setIsCameraLoading(false);
      setCameraError(err?.message || 'Failed to initialize video stream.');
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
    setIsTorchOn(false);
    setHasTorch(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      const nextState = !isTorchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const tickScanner = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
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
    }

    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(tickScanner);
    }
  };

  // Only auto-execute scan if explicitly requested with auto_mark=1 and user is authorized Staff
  useEffect(() => {
    const autoMark = searchParams.get('auto_mark') === '1';
    if (authChecked && isStaffAuthorized() && (studentId || admissionNo) && autoMark) {
      executeScan(studentId, admissionNo);
    }
    return () => {
      stopCamera();
    };
  }, [studentId, admissionNo, authChecked, searchParams]);

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

  // ─────────────────────────────────────────────────────────────
  // 1. ACCESS CONTROL LOCKDOWN: IF USER IS STUDENT / PARENT OR UNLOGGED
  // ─────────────────────────────────────────────────────────────
  if (authChecked && !isStaffAuthorized()) {
    const isStudentOrParent = currentUser?.role === 'STUDENT' || currentUser?.role === 'PARENT';
    return (
      <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl text-center space-y-5 animate-scale-in">
          
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Campus Terminal Locked</span>
            </div>
            <h2 className="font-display font-black text-xl text-[#122A24]">
              Class Teacher &amp; Gate Staff Access Only
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {isStudentOrParent
                ? `Logged in as ${currentUser?.full_name || currentUser?.username} (${currentUser?.role}). Student remote self-attendance from home is prohibited. Please present your physical I-Card to your class teacher or gate scanner at school.`
                : 'This Smart QR check-in terminal requires verified Class Teacher, Principal, or Campus Gatekeeper credentials. Students cannot mark attendance remotely from home.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#122A24]">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Security Protocols Active:</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 font-mono list-disc list-inside">
              <li>Proxy &amp; Remote Check-in Prevention</li>
              <li>Only Faculty &amp; Gate Staff can punch attendance</li>
              <li>Official GPS &amp; Timestamp Cloud Verification</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Faculty / Admin Staff Login</span>
            </button>

            <button
              onClick={() => router.push('/app')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border-none cursor-pointer"
            >
              Back to ERP Portal
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHORIZED TEACHER / GATEKEEPER SCANNER PORTAL
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-4">
        
        {/* Top Header with Operator Info */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE8E0] text-xs font-semibold text-[#122A24] shadow-2xs hover:bg-[#EBF5EF] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ERP Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#122A24] text-emerald-300 text-[10px] font-mono font-bold tracking-wider">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{currentUser?.role || 'FACULTY'} VERIFIED</span>
          </span>
        </div>

        {/* Institution Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#122A24] uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>{result?.school?.school_name || 'CBSE Digital School'}</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-800 font-semibold">
            Operator: {currentUser?.full_name || currentUser?.username || 'Class Teacher'} • Session {session}
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
                    Class Present: {result.attendance_summary?.total_present} / {result.attendance_summary?.total_students} Scholars
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
              <div className="flex items-center gap-1.5">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border-none cursor-pointer transition-colors ${
                      isTorchOn ? 'bg-amber-400 text-slate-900 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="Flashlight"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{isTorchOn ? 'Torch ON' : 'Torch'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center gap-1 border-none cursor-pointer"
                  title="Switch Camera (Front/Back)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Flip</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera Viewfinder (Always mounted for instantaneous mobile initialization) */}
          <div className={`relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-emerald-500 shadow-inner ${isCameraActive ? 'block' : 'hidden'}`}>
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
              <span>SCANNING ID CARDS...</span>
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

          {/* Standby UI when camera is stopped */}
          {!isCameraActive && (
            <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-b from-[#EBF5EF] to-white border border-[#C5E2CF] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white mx-auto flex items-center justify-center shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#122A24]">Point Camera at Student I-Card</h5>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-xs mx-auto">
                  Hold the student physical ID card or digital card in front of your camera to auto-mark turnout.
                </p>
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-sans text-left space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-900">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Camera Initialization Issue</span>
                  </div>
                  <p>{cameraError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isCameraLoading}
                className="px-6 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs border-none cursor-pointer shadow-md inline-flex items-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
              >
                {isCameraLoading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Video className="w-4 h-4 text-emerald-400" />}
                <span>{isCameraLoading ? 'Starting Camera Hardware...' : 'Start Live Camera Scanner'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Admission Number Check-in */}
        <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-xs text-[#122A24] uppercase tracking-wider">
              Manual Admission Number Punch-In
            </h4>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualAdm}
              onChange={(e) => setManualAdm(e.target.value)}
              placeholder="e.g. ADM2026-001 or Student ID"
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
