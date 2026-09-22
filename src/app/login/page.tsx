/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import jsQR from 'jsqr';
import {
  ScanLine,
  QrCode,
  Camera,
  SwitchCamera,
  CheckCircle2,
  ExternalLink,
  X,
  Sparkles,
  Check,
  Search,
  Building2,
  ShieldCheck,
  User,
  UserCheck,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Layers,
  Phone,
  RotateCw,
  ArrowLeft,
  HelpCircle,
  Flashlight,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import { APP_INFO } from '@/lib/app-info';

// DYNAMIC MATRIX CODE RAIN / FALLING ALPHABETS CANVAS COMPONENT
function MatrixRain({ theme = 'chalkboard' }: { theme?: 'chalkboard' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = Math.max(canvas.parentElement?.offsetWidth || 0, window.innerWidth));
    let height = (canvas.height = Math.max(canvas.parentElement?.offsetHeight || 0, window.innerHeight));

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789π∑√Ωαβγλθ∞∫≈≠≤≥%&*#@!?$+-=';
    const charArray = characters.split('');
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    const initDrops = () => {
      if (!canvas) return;
      width = canvas.width = Math.max(canvas.parentElement?.offsetWidth || 0, window.innerWidth);
      height = canvas.height = Math.max(canvas.parentElement?.offsetHeight || 0, window.innerHeight);
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -60);
      }
    };
    initDrops();

    const handleResize = () => {
      initDrops();
    };
    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    const fps = 32;
    const interval = 1000 / fps;

    const isLight = theme === 'light';

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);
      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      if (isLight) {
        ctx.fillStyle = 'rgba(250, 248, 245, 0.16)';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = 'rgba(18, 42, 36, 0.12)';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.font = 'bold 13px "Courier New", Courier, monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0) {
          if (isLight) {
            ctx.fillStyle = '#047857';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 6;
            ctx.fillText(text, x, y);

            ctx.fillStyle = '#059669';
            ctx.shadowBlur = 2;
            if (drops[i] > 1) {
              const trailChar = charArray[Math.floor(Math.random() * charArray.length)];
              ctx.fillText(trailChar, x, y - fontSize);
            }
          } else {
            ctx.fillStyle = '#F0FDF4';
            ctx.shadowColor = '#34D399';
            ctx.shadowBlur = 10;
            ctx.fillText(text, x, y);

            ctx.fillStyle = '#10B981';
            ctx.shadowBlur = 4;
            if (drops[i] > 1) {
              const trailChar = charArray[Math.floor(Math.random() * charArray.length)];
              ctx.fillText(trailChar, x, y - fontSize);
            }
          }

          ctx.shadowBlur = 0;
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none z-0 ${
        theme === 'light'
          ? 'fixed inset-0 w-full h-full opacity-35'
          : 'absolute inset-0 w-full h-full opacity-45'
      }`}
      style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
    />
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schoolCode, setSchoolCode] = useState(() => searchParams.get('schoolCode') || searchParams.get('school_code') || searchParams.get('school') || 'DPS2026');
  const [userId, setUserId] = useState(() => searchParams.get('userId') || searchParams.get('username') || searchParams.get('user') || 'admin');
  const [password, setPassword] = useState(() => searchParams.get('password') || searchParams.get('passcode') || searchParams.get('pwd') || '123456');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [buildInfo, setBuildInfo] = useState({
    buildNumber: APP_INFO.buildNumber,
    releaseTag: APP_INFO.releaseTag
  });

  // Forgot Passcode State
  const [viewMode, setViewMode] = useState<'LOGIN' | 'FORGOT_PASSCODE'>('LOGIN');
  const [forgotSchoolCode, setForgotSchoolCode] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<{ message: string; target_email: string; account_name?: string } | null>(null);

  // ── SMART QR SCANNER & VERIFICATION FORM STATE ──
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  
  // Verification Form Modal State
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
      photo?: string;
    };
    faculty?: {
      id: string;
      full_name: string;
      designation: string;
      department?: string;
      staff_code?: string;
      phone?: string;
      photo?: string;
    };
    verifiedStatus?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
    message?: string;
  } | null>(null);

  const [scanManualInput, setScanManualInput] = useState('');
  const [recentScanCount, setRecentScanCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Sound Synthesizer for Audio Feedback
  const playScanBeep = (type: 'success' | 'reject' | 'beep' = 'success') => {
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
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (type === 'success' ? 0.35 : 0.3));
    } catch (_) {}
  };

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

  const handleProcessScanLookup = useCallback(async (identifier: string) => {
    if (!identifier || scanLoading) return;
    setScanLoading(true);
    setCameraError(null);

    try {
      const cleanSchool = (schoolCode || 'DPS2026').trim().toUpperCase();
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: identifier,
          school_id: cleanSchool
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
              id: identifier,
              full_name: 'Scholar Pass',
              class_name: 'Class 9',
              section: 'A',
              admission_no: identifier
            },
            verifiedStatus: 'PENDING'
          });
        }
        playScanBeep('beep');
      } else {
        // Fallback demo student if not found
        setScannedPerson({
          person_type: 'STUDENT',
          student: {
            id: identifier,
            full_name: 'Verified Student Pass',
            class_name: 'Class 10',
            section: 'A',
            admission_no: identifier
          },
          verifiedStatus: 'PENDING'
        });
        playScanBeep('beep');
      }
    } catch (err: any) {
      setCameraError('Network error while looking up record. Please retry.');
    } finally {
      setScanLoading(false);
    }
  }, [scanLoading, schoolCode]);

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
    } catch (_) {}

    handleProcessScanLookup(admOrId);
  }, [handleProcessScanLookup, scannedPerson]);

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
          width: { ideal: 640 },
          height: { ideal: 480 }
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
      setCameraError('Camera access not permitted. You can also type Admission No below.');
    }
  }, [cameraFacing, stopCamera, tickScanner]);

  const [torchOn, setTorchOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleTorch = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities && (track.getCapabilities() as any)) || {};
          if (capabilities.torch) {
            const nextState = !torchOn;
            await (track as any).applyConstraints({
              advanced: [{ torch: nextState }]
            });
            setTorchOn(nextState);
            return;
          }
        }
      }
    } catch (_) {}
    toggleCameraFacing();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (code && code.data) {
          playScanBeep('success');
          handleProcessScanLookup(code.data);
        } else {
          const codeInv = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'onlyInvert'
          });
          if (codeInv && codeInv.data) {
            playScanBeep('success');
            handleProcessScanLookup(codeInv.data);
          } else {
            setCameraError('No QR detected in the selected image. Please try another photo.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (showQrScanner && !scannedPerson) {
      startCamera(cameraFacing);
    } else if (scannedPerson) {
      stopCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showQrScanner, scannedPerson, cameraFacing, startCamera, stopCamera]);

  // Action 1: Confirm "VERIFIED AND PRESENT"
  const handleConfirmVerifiedPresent = async () => {
    if (!scannedPerson) return;
    playScanBeep('success');

    try {
      const cleanSchool = (schoolCode || 'DPS2026').trim().toUpperCase();
      const targetId = scannedPerson.person_type === 'STUDENT'
        ? scannedPerson.student?.admission_no || scannedPerson.student?.id
        : scannedPerson.faculty?.staff_code || scannedPerson.faculty?.id;

      await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetId,
          school_id: cleanSchool,
          action: 'VERIFY_PRESENT'
        })
      });
    } catch (_) {}

    setScannedPerson((prev) => prev ? {
      ...prev,
      verifiedStatus: 'CONFIRMED',
      message: '✓ ATTENDANCE RECORDED: PRESENT'
    } : null);

    setRecentScanCount((c) => c + 1);

    setTimeout(() => {
      setScannedPerson(null);
      if (showQrScanner) {
        startCamera(cameraFacing);
      }
    }, 2400);
  };

  // Action 2: Reject "WRONG PERSON"
  const handleRejectWrongPerson = () => {
    playScanBeep('reject');
    setScannedPerson((prev) => prev ? {
      ...prev,
      verifiedStatus: 'REJECTED',
      message: '❌ SCAN REJECTED: Identification Mismatch / Wrong Person'
    } : null);

    setTimeout(() => {
      setScannedPerson(null);
      if (showQrScanner) {
        startCamera(cameraFacing);
      }
    }, 1800);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('giterp_saved_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schoolCode && !searchParams.get('schoolCode') && !searchParams.get('school')) {
          setSchoolCode(parsed.schoolCode);
        }
        if (parsed.userId && !searchParams.get('userId') && !searchParams.get('username') && !searchParams.get('user')) {
          setUserId(parsed.userId);
        }
        if (typeof parsed.remember === 'boolean') {
          setRemember(parsed.remember);
        }
      }
    } catch (_) {}

    const isLogoutIntent = searchParams.get('logout') === 'true';
    if (!isLogoutIntent) {
      try {
        const rawUser = localStorage.getItem('current_user');
        const token = localStorage.getItem('erp_session_token');
        if (rawUser && token) {
          fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then((r) => r.json())
            .then((d) => {
              if (d && d.success) {
                const parsed = JSON.parse(rawUser);
                const targetSchool = parsed.school_code || parsed.school_id || searchParams.get('school') || 'DPS2026';
                window.location.href = `/app?school=${encodeURIComponent(targetSchool)}`;
              }
            })
            .catch(() => {});
        }
      } catch (_) {}
    }

    fetch(`/api/app-info?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.buildNumber) {
          setBuildInfo({
            buildNumber: data.buildNumber,
            releaseTag: data.releaseTag || APP_INFO.releaseTag
          });
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const executeLogin = async (rawSchool: string, rawUser: string, rawPass: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    const cleanSchoolCode = rawSchool.trim().toUpperCase();
    const cleanUserId = rawUser.trim();
    const cleanPassword = rawPass.trim();

    const isGod = cleanUserId.toLowerCase() === 'blistedx';
    const effectiveSchoolCode = cleanSchoolCode || 'DPS2026';

    if (!cleanUserId && !cleanPassword) {
      setSuccess(`⚡ Unlocking Touchless QR Attendance Kiosk for School: ${effectiveSchoolCode}...`);
      try {
        localStorage.setItem('current_user', JSON.stringify({
          id: 'KIOSK-DEMO',
          username: 'DEMO_KIOSK',
          full_name: 'Universal Touchless Station',
          role: 'KIOSK_DEMO',
          school_id: effectiveSchoolCode
        }));
        localStorage.setItem('current_school', JSON.stringify({
          id: effectiveSchoolCode,
          school_code: effectiveSchoolCode,
          name: 'Delhi Public School (CBSE)'
        }));
      } catch (_) {}

      setTimeout(() => {
        window.location.href = `/kiosk?school=${encodeURIComponent(effectiveSchoolCode)}`;
      }, 300);
      return;
    }

    if (!cleanUserId) {
      setError('User ID / Staff Code / Admission No is required (or leave blank with School Code for Demo QR Kiosk).');
      setLoading(false);
      return;
    }
    if (!cleanPassword) {
      setError('Passcode / Password is required (or leave blank with School Code for Demo QR Kiosk).');
      setLoading(false);
      return;
    }

    try {
      let res: Response | null = null;
      let lastFetchError: any = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              school_code: effectiveSchoolCode,
              username: cleanUserId,
              password: cleanPassword,
              remember: remember
            })
          });
          if (res) break;
        } catch (fetchErr: any) {
          lastFetchError = fetchErr;
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }

      if (!res) {
        throw lastFetchError || new Error('Network timeout');
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {}

      if (res.ok && data && data.success) {
        if (data.user?.is_god_admin || data.user?.role === 'AGENCY_SUPERADMIN' || isGod) {
          setSuccess('⚡ GOD ACCESS GRANTED! Welcome Administrator — Unlocking all schools on platform...');
        } else {
          setSuccess(`Authentication successful! Welcome ${data.user?.full_name || data.user?.username}...`);
        }

        if (remember) {
          try {
            localStorage.setItem('giterp_saved_login', JSON.stringify({
              schoolCode: effectiveSchoolCode,
              userId: cleanUserId,
              remember: true
            }));
          } catch (_) {}
        } else {
          try {
            localStorage.removeItem('giterp_saved_login');
          } catch (_) {}
        }

        localStorage.setItem('current_user', JSON.stringify({
          ...data.user,
          login_role: data.user.role
        }));
        localStorage.setItem('current_school', JSON.stringify(data.school));
        if (data.session_token) {
          localStorage.setItem('erp_session_token', data.session_token);
        }
        setTimeout(() => {
          window.location.href = `/app?school=${encodeURIComponent(data.school?.school_code || effectiveSchoolCode || 'DPS2026')}`;
        }, 150);
      } else {
        setError(data?.error || `Login failed (${res.status}). Please check your School Code, ID, and Passcode.`);
      }
    } catch (err: any) {
      console.error('Login submit error:', err);
      setError('Connection timeout. Please verify your internet connection and click Sign in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qUser = searchParams.get('userId') || searchParams.get('username') || searchParams.get('user');
    const qPass = searchParams.get('password') || searchParams.get('passcode') || searchParams.get('pwd');
    const qSchool = searchParams.get('schoolCode') || searchParams.get('school_code') || searchParams.get('school') || 'DPS2026';
    if (qUser && qPass) {
      executeLogin(qSchool, qUser, qPass);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(schoolCode, userId, password);
  };

  const handleForgotPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(null);

    const cleanSchoolCode = forgotSchoolCode.trim().toUpperCase();
    const cleanUserId = forgotUserId.trim();

    if (!cleanSchoolCode) {
      setForgotError('School Code is required.');
      setForgotLoading(false);
      return;
    }
    if (!cleanUserId) {
      setForgotError('User ID / Admission No / Staff Code is required.');
      setForgotLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_type: 'SCHOOL',
          school_code: cleanSchoolCode,
          username: cleanUserId
        })
      });

      const data = await res.json();
      if (data.success) {
        setForgotSuccess({
          message: data.message || `New passcode generated and sent to ${data.target_email || 'b******x@gmail.com'}`,
          target_email: data.target_email || 'b******x@gmail.com',
          account_name: data.account_name
        });
        setSchoolCode(cleanSchoolCode);
        setUserId(cleanUserId);
      } else {
        setForgotError(data.error || 'Failed to reset passcode. Please check your credentials.');
      }
    } catch (err: any) {
      setForgotError('Connection error: ' + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="auth-split-layout relative overflow-hidden min-h-screen focus:outline-none">
      <div className="md:hidden">
        <MatrixRain theme="light" />
      </div>

      <div className="panel relative overflow-hidden z-10">
        <MatrixRain theme="chalkboard" />

        <svg className="doodle p1 relative z-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="22" r="12" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M18 10c1-4 4-6 7-6" stroke="#C4432B" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="doodle p2 relative z-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="17" width="28" height="6" rx="2" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M10 17v6M16 17v6M22 17v6M28 17v6" stroke="#FFFFFF" strokeWidth="1.4" />
        </svg>

        <Link className="brand relative z-10" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/giterp-logo.png" alt="Giterp Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm bg-[#122A24] border border-white/20 p-1" />
          <span className="brand-text">
            Giterp
            <span>Manage • Integrate • Grow</span>
          </span>
        </Link>

        <div className="panel-mid relative z-10">
          <p className="eyebrow">Restricted Access</p>
          <h1>
            One login,{' '}
            <span className="underline">
              any school
              <svg viewBox="0 0 160 12" preserveAspectRatio="none">
                <path d="M2 8 Q40 2 80 7 T158 5" stroke="#C4432B" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}
            on the platform.
          </h1>
          <p>
            Enter your school code first, then sign in with your User ID / Employee Code and password. Your role and workspace will be assigned automatically.
          </p>
        </div>

        <div className="stamp-mini relative z-10">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="70" stroke="#C4432B" strokeWidth="3" strokeDasharray="4 6" />
            <circle cx="80" cy="80" r="58" stroke="#C4432B" strokeWidth="2" />
            <text x="80" y="93" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="40" fill="#C4432B">
              A+
            </text>
          </svg>
        </div>
      </div>

      <div className="formside relative z-10 overflow-hidden min-h-screen">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(#122A24 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="absolute -right-8 top-1/2 -translate-y-1/2 font-display font-black text-[18vw] leading-none text-[#122A24]/[0.032] tracking-tighter uppercase whitespace-nowrap">
            GITERP
          </div>

          <div
            className="absolute -left-8 -bottom-4 font-display font-extrabold text-[100px] leading-none text-transparent tracking-tight uppercase whitespace-nowrap hidden lg:block"
            style={{
              WebkitTextStroke: '1.5px rgba(18, 42, 36, 0.045)'
            }}
          >
            giterp.os
          </div>

          <div className="absolute right-6 top-0 bottom-0 flex items-center justify-center pointer-events-none hidden md:flex">
            <span className="text-[10px] font-mono tracking-[0.35em] text-[#122A24]/20 uppercase [writing-mode:vertical-rl] rotate-180 select-none">
              GITERP • AUTONOMOUS SCHOOL OPERATING SYSTEM • SECURE GATEWAY
            </span>
          </div>

          <div className="absolute top-7 right-10 text-right hidden md:block">
            <div className="flex items-center justify-end gap-2 text-[11px] font-mono font-semibold tracking-wider text-[#122A24]/40 uppercase">
              <span>SYS.AUTH // GITERP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]/60"></span>
            </div>
            <div className="text-[9.5px] font-mono text-[#122A24]/25 tracking-widest mt-0.5">
              EDTECH ECOSYSTEM • EST. 2026
            </div>
          </div>

          <div className="absolute top-7 left-10 hidden md:block text-[#122A24]/20 font-mono text-[11px] tracking-widest">
            + + + +
          </div>

          <div className="absolute bottom-6 left-10 hidden md:block">
            <div className="text-[10px] font-mono tracking-widest text-[#122A24]/30 uppercase">
              GITERP // MULTI-CAMPUS ENTERPRISE CORE
            </div>
          </div>
        </div>

        <div className="card relative z-10">
          <div className="flex sm:hidden items-center justify-center gap-3 mb-4 pb-3 border-b border-[#E8F0EA]">
            <Link href="/" className="flex items-center gap-3 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/giterp-logo.png"
                alt="Giterp Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-xs bg-[#122A24] border border-[#1C443A] p-1"
              />
              <div className="text-left">
                <span className="font-display font-bold text-lg text-[#122A24] block leading-tight tracking-tight">
                  Giterp
                </span>
                <span className="text-[9.5px] font-mono text-[#2D5A4E] font-medium block uppercase tracking-wider">
                  Manage • Integrate • Grow
                </span>
              </div>
            </Link>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              ⚡ FULLSCREEN PHONE ID SCANNER MODAL (PhonePe / GooglePay Style)
              Header: "Scan any ID Card"
              Subtitle: "Student ID • Faculty ID • Staff Card • Visitor Pass"
              Viewfinder: Rounded purple neon corner brackets
              Buttons: Upload QR & Torch
              Footer: GITERP | SMART ID GATE
              ═════════════════════════════════════════════════════════════ */}
          {showQrScanner && (
            <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between select-none overflow-hidden animate-fadeIn">
              {/* Hidden File Input for "Upload QR" */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Background Live Camera Video */}
              <div className="absolute inset-0 z-0 bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover absolute inset-0 ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Translucent overlay backdrop */}
                <div className="absolute inset-0 bg-black/45" />
              </div>

              {/* Top Navigation & Header */}
              <div className="relative z-20 pt-6 sm:pt-8 px-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrScanner(false);
                      setScannedPerson(null);
                    }}
                    className="p-2 -ml-2 rounded-full hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
                    title="Back to Login"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight font-sans">
                      Scan any ID Card
                    </h1>
                    <p className="text-xs sm:text-[13px] text-white/70 font-sans mt-0.5 tracking-wide">
                      Student ID • Faculty ID • Staff Card • Visitor Pass
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white transition-all cursor-pointer"
                    title="Switch Camera (Front / Back)"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Hold your Student / Faculty ID Card QR code inside the purple square viewfinder to verify attendance.');
                    }}
                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white transition-all cursor-pointer"
                    title="Help"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Center Viewfinder / Scanning Area or Verification Sheet */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                {!scannedPerson ? (
                  <div className="flex flex-col items-center gap-4">
                    {/* Viewfinder Target Box with 4 Neon Purple Curved Brackets */}
                    <div className="relative w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] rounded-[32px] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/10 bg-transparent">
                      {/* Top-Left Corner */}
                      <span className="absolute top-0 left-0 w-11 h-11 border-t-[4px] border-l-[4px] border-[#a855f7] rounded-tl-[26px] pointer-events-none z-20 shadow-[0_0_15px_#a855f7]" />
                      {/* Top-Right Corner */}
                      <span className="absolute top-0 right-0 w-11 h-11 border-t-[4px] border-r-[4px] border-[#a855f7] rounded-tr-[26px] pointer-events-none z-20 shadow-[0_0_15px_#a855f7]" />
                      {/* Bottom-Left Corner */}
                      <span className="absolute bottom-0 left-0 w-11 h-11 border-b-[4px] border-l-[4px] border-[#a855f7] rounded-bl-[26px] pointer-events-none z-20 shadow-[0_0_15px_#a855f7]" />
                      {/* Bottom-Right Corner */}
                      <span className="absolute bottom-0 right-0 w-11 h-11 border-b-[4px] border-r-[4px] border-[#a855f7] rounded-br-[26px] pointer-events-none z-20 shadow-[0_0_15px_#a855f7]" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c084fc] to-transparent shadow-[0_0_15px_#c084fc] animate-pulse top-1/2 -translate-y-1/2" />

                      {scanLoading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30 text-purple-300 font-mono text-xs">
                          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying ID Record...</span>
                        </div>
                      )}
                    </div>

                    {cameraError && (
                      <div className="px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-mono flex items-center gap-2 mt-2">
                        <span>{cameraError}</span>
                        <button
                          type="button"
                          onClick={() => startCamera(cameraFacing)}
                          className="underline font-bold text-white cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ═════════════════════════════════════════════════════════════
                      INTERACTIVE VERIFICATION FORM SHEET (STUDENT / FACULTY)
                      ═════════════════════════════════════════════════════════════ */
                  <div className="w-full max-w-md bg-[#0e241e] border-2 border-emerald-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn text-white">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        {scannedPerson.person_type === 'STUDENT' ? (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold">
                            <Briefcase className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-display font-black text-sm text-white tracking-tight uppercase">
                            {scannedPerson.person_type === 'STUDENT' ? 'Student Identity Verification' : 'Faculty / Staff Verification'}
                          </h4>
                          <span className="text-[9.5px] font-mono text-emerald-300/80 uppercase tracking-wider">
                            ROLE: {scannedPerson.person_type} • REAL-TIME PASS CHECK
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setScannedPerson(null);
                          if (showQrScanner) startCamera(cameraFacing);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Student Details */}
                    {scannedPerson.person_type === 'STUDENT' && scannedPerson.student && (
                      <div className="space-y-2.5 bg-black/40 border border-emerald-900/60 rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/50 pb-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                            STUDENT NAME:
                          </span>
                          <span className="text-base font-black text-white uppercase tracking-tight">
                            {scannedPerson.student.full_name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b border-emerald-900/50 pb-2">
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
                            <span className="text-slate-500 block">Roll / Session:</span>
                            <strong className="text-emerald-300">Roll: {scannedPerson.student.roll_no || '14'} (2026-27)</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Faculty Details */}
                    {scannedPerson.person_type === 'FACULTY' && scannedPerson.faculty && (
                      <div className="space-y-2.5 bg-black/40 border border-emerald-900/60 rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/50 pb-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                            FACULTY NAME:
                          </span>
                          <span className="text-base font-black text-white uppercase tracking-tight">
                            {scannedPerson.faculty.full_name}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/50 pb-2">
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

                    {/* Status Feedback */}
                    {scannedPerson.verifiedStatus === 'CONFIRMED' && (
                      <div className="p-3.5 bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-bounce">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        <span>{scannedPerson.message || '✓ ATTENDANCE CONFIRMED & MARKED PRESENT'}</span>
                      </div>
                    )}

                    {scannedPerson.verifiedStatus === 'REJECTED' && (
                      <div className="p-3.5 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse">
                        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                        <span>{scannedPerson.message || '❌ SCAN REJECTED: Wrong Person Flagged'}</span>
                      </div>
                    )}

                    {/* 2 Action Buttons */}
                    {scannedPerson.verifiedStatus === 'PENDING' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmVerifiedPresent}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>VERIFIED AND PRESENT</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRejectWrongPerson}
                          className="w-full py-3.5 px-4 bg-rose-950 hover:bg-rose-900 border-2 border-rose-600/70 text-rose-200 hover:text-white font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                          <span>WRONG PERSON</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Controls: Upload QR & Torch (Exact Screenshot Look) */}
              {!scannedPerson && (
                <div className="relative z-20 pb-6 pt-2 flex flex-col items-center gap-6">
                  <div className="flex items-center justify-center gap-12">
                    {/* Upload QR Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg group-hover:scale-105">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-sans font-medium text-white/90 tracking-wide">
                        Upload QR
                      </span>
                    </button>

                    {/* Torch Button */}
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-14 h-14 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg group-hover:scale-105 ${
                        torchOn ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/15 hover:bg-white/25 active:bg-white/35 text-white'
                      }`}>
                        <Flashlight className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-sans font-medium text-white/90 tracking-wide">
                        Torch
                      </span>
                    </button>
                  </div>

                  {/* Bottom Footer Logo (Like BHIM | UPI in Screenshot) */}
                  <div className="flex items-center gap-3 text-white/40 font-mono text-[11px] tracking-widest pb-2">
                    <span className="font-bold tracking-widest uppercase text-white/60">GITERP</span>
                    <span className="w-px h-3 bg-white/25" />
                    <span className="font-semibold tracking-wider uppercase text-white/50">SMART ID GATE</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              LOGIN / FORGOT PASSCODE FORM
              ═════════════════════════════════════════════════════════════ */}
          {viewMode === 'LOGIN' ? (
            <>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="kicker">Hall pass required</p>
                  <h2>Sign in</h2>
                  <p className="sub">Enter your school code, user ID and password to proceed.</p>
                </div>

                {/* Small Circular Smart QR Button (Exact User Request) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowQrScanner(!showQrScanner);
                    setScannedPerson(null);
                  }}
                  className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
                    showQrScanner
                      ? 'bg-emerald-500 text-slate-950 border-2 border-emerald-400 shadow-emerald-500/30 scale-105'
                      : 'bg-[#0a231c] hover:bg-[#0f3329] text-emerald-400 border-2 border-emerald-500/80 hover:border-emerald-400 shadow-emerald-950/40 hover:scale-105 active:scale-95'
                  }`}
                  title={showQrScanner ? 'Close QR Scanner' : 'Scan Attendance QR Code'}
                >
                  <ScanLine className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="schoolCode">School Code</label>
                  <input
                    type="text"
                    id="schoolCode"
                    name="schoolCode"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    autoComplete="organization"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="hint">
                    Enter your School Code. Leave User ID &amp; Password blank to open <strong>Touchless QR Attendance Kiosk</strong>.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="userId" id="idLabel">User ID / Staff Code / Admission No</label>
                  <input
                    type="text"
                    id="userId"
                    name="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="username"
                  />
                  <p className="hint" id="idHint">Your official login ID, Employee Code, or Admission Number (Optional for Demo)</p>
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Passcode / Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: '#1B4D3E', fontSize: '11px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="row-between">
                  <label>
                    <input
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />{' '}
                    Keep me signed in
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSchoolCode(schoolCode || 'DPS2026');
                      setForgotUserId(userId || '');
                      setForgotError('');
                      setForgotSuccess(null);
                      setViewMode('FORGOT_PASSCODE');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C4432B',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot passcode?
                  </button>
                </div>

                {error && (
                  <p className="status-msg" style={{ color: '#C4432B', marginBottom: '16px' }}>
                    {error}
                  </p>
                )}

                {success && (
                  <p className="status-msg" style={{ color: '#1C443A', marginBottom: '16px' }}>
                    {success}
                  </p>
                )}

                <button type="submit" className="submit" disabled={loading}>
                  <span className="stamp-icon">✓</span>
                  {loading ? 'Authenticating...' : 'Sign in to ERP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="kicker" style={{ color: '#C4432B' }}>Passcode Recovery</p>
              <h2>Forgot Passcode</h2>
              <p className="sub">
                Enter your School Code and User ID. A new security password will be sent to your registered email.
              </p>

              {forgotSuccess ? (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '20px',
                  margin: '20px 0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    margin: '0 auto 12px auto'
                  }}>
                    ✓
                  </div>
                  <h4 style={{ color: '#065F46', margin: '0 0 6px', fontSize: '16px', fontWeight: 'bold' }}>
                    Passcode Reset Successful!
                  </h4>
                  <p style={{ color: '#047857', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {forgotSuccess.message || `A new security password has been sent to registered email: ${forgotSuccess.target_email || 'b******x@gmail.com'}. Please check your inbox and sign in.`}
                  </p>
                  {forgotSuccess.account_name && (
                    <div style={{ margin: '0 0 16px' }}>
                      <span style={{ color: '#065F46', fontSize: '12px', background: '#D1FAE5', padding: '6px 12px', borderRadius: '6px', fontWeight: '600' }}>
                        Account: {forgotSuccess.account_name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('LOGIN');
                      setPassword('');
                      setError('');
                      setSuccess(forgotSuccess.message || `Enter the new passcode sent to your registered email to sign in.`);
                    }}
                    className="submit"
                    style={{ width: '100%' }}
                  >
                    Sign in with New Passcode →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasscode}>
                  <div className="field">
                    <label htmlFor="forgotSchoolCode">School Code</label>
                    <input
                      type="text"
                      id="forgotSchoolCode"
                      name="forgotSchoolCode"
                      value={forgotSchoolCode}
                      onChange={(e) => setForgotSchoolCode(e.target.value)}
                      autoComplete="organization"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                    <p className="hint">The official code of your school (e.g. DPS2026)</p>
                  </div>

                  <div className="field">
                    <label htmlFor="forgotUserId">User ID / Staff Code / Admission No</label>
                    <input
                      type="text"
                      id="forgotUserId"
                      name="forgotUserId"
                      value={forgotUserId}
                      onChange={(e) => setForgotUserId(e.target.value)}
                      autoComplete="username"
                      required
                    />
                    <p className="hint">Your login ID, employee code, or admission number</p>
                  </div>

                  <div style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    fontSize: '12px',
                    color: '#92400E',
                    lineHeight: '1.4'
                  }}>
                    📧 <strong>Notice:</strong> For security verification, the new password will be dispatched to your registered hidden email (e.g. <strong>b******x@gmail.com</strong>).
                  </div>

                  {forgotError && (
                    <p className="status-msg" style={{ color: '#C4432B', marginBottom: '16px' }}>
                      {forgotError}
                    </p>
                  )}

                  <button type="submit" className="submit" disabled={forgotLoading} style={{ background: '#C4432B' }}>
                    <span className="stamp-icon">🔐</span>
                    {forgotLoading ? 'Generating & Sending Passcode...' : 'Send New Passcode'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('LOGIN');
                        setForgotError('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1C443A',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'underline'
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <Link className="back" href="/">← Back to Giterp</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <Link className="back" href="/request-demo" style={{ margin: 0 }}>
              New school? Request a demo →
            </Link>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/privacy" style={{ fontSize: '12px', color: '#52796F', textDecoration: 'none' }}>
                Privacy
              </Link>
              <Link href="/terms" style={{ fontSize: '12px', color: '#52796F', textDecoration: 'none' }}>
                Terms
              </Link>
            </div>
          </div>

          <div
            style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E2ECE5', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#52796F' }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', marginRight: '6px' }} />
            Build #{buildInfo.buildNumber} • {buildInfo.releaseTag}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full flex items-center justify-center bg-[#122A24] text-white font-mono text-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span className="text-emerald-300 font-medium">Loading Login Portal...</span>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
