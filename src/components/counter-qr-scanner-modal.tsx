/*! EduSuite In-App Counter QR Scanner & Smart Checkout v1.0.0 */
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building2,
  Calendar,
  Check,
  ArrowRight,
  ShieldCheck,
  Receipt,
  RotateCw,
  Sparkles,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { Student, School } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface CounterQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  school?: School | any;
  onPaymentSuccess?: (receipt: any) => void;
}

interface DueItem {
  id: string;
  month: string;
  monthShort: string;
  cycleName: string;
  headName: string;
  amount: number; // in Rupees
  selected: boolean;
}

export function CounterQrScannerModal({
  isOpen,
  onClose,
  student,
  school,
  onPaymentSuccess
}: CounterQrScannerModalProps) {
  const [step, setStep] = useState<'SCAN' | 'CHECKOUT' | 'SUCCESS'>('SCAN');
  const [deskInfo, setDeskInfo] = useState<{ deskId: string; deskTitle: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'ONLINE' | 'CASH'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Generate Month-Wise / Head-Wise Itemized List based on student structure
  const [dueItems, setDueItems] = useState<DueItem[]>([]);

  useEffect(() => {
    if (!student) return;

    const baseMonthlyTuition = (student as any).fee_structure_amount 
      ? Math.round((student as any).fee_structure_amount / 12) 
      : 2000;
    const transportMonthly = student.transport_opted === 'YES' ? 800 : 0;
    const hostelMonthly = (student as any).hostel_opted === 'YES' ? 3000 : 0;

    const months = [
      { name: 'September 2026', short: 'Sep 26' },
      { name: 'October 2026', short: 'Oct 26' },
      { name: 'November 2026', short: 'Nov 26' },
      { name: 'December 2026', short: 'Dec 26' },
      { name: 'January 2027', short: 'Jan 27' },
      { name: 'February 2027', short: 'Feb 27' },
      { name: 'March 2027', short: 'Mar 27' },
    ];

    const items: DueItem[] = [];

    months.forEach((m, idx) => {
      // 1. Tuition
      items.push({
        id: `${m.short}-tuition`,
        month: m.name,
        monthShort: m.short,
        cycleName: `Tuition Fee (${m.short})`,
        headName: 'Tuition Fee',
        amount: baseMonthlyTuition,
        selected: idx === 0 // Select first month by default
      });

      // 2. Transport (if opted)
      if (transportMonthly > 0) {
        items.push({
          id: `${m.short}-transport`,
          month: m.name,
          monthShort: m.short,
          cycleName: `Transport Fee (${m.short})`,
          headName: 'Transport Fee',
          amount: transportMonthly,
          selected: idx === 0
        });
      }

      // 3. Hostel (if opted)
      if (hostelMonthly > 0) {
        items.push({
          id: `${m.short}-hostel`,
          month: m.name,
          monthShort: m.short,
          cycleName: `Hostel / Boarding (${m.short})`,
          headName: 'Hostel Fee',
          amount: hostelMonthly,
          selected: false
        });
      }
    });

    setDueItems(items);
  }, [student]);

  // Camera handling for QR scanning
  useEffect(() => {
    if (isOpen && step === 'SCAN') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not available or permission denied. You can click Quick Desk below.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Trigger when QR is successfully scanned or simulated
  const handleDeskDetected = (deskId: string, deskTitle: string) => {
    stopCamera();
    setDeskInfo({ deskId, deskTitle });
    setStep('CHECKOUT');
  };

  // Toggle single item checkbox
  const toggleItem = (id: string) => {
    setDueItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select all items
  const selectAll = () => {
    setDueItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  // Clear all items
  const clearAll = () => {
    setDueItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  // Calculate totals
  const selectedItems = dueItems.filter((i) => i.selected);
  const totalAmount = selectedItems.reduce((sum, i) => sum + i.amount, 0);

  // Submit payment to Counter backend
  const handleSubmitPayment = async () => {
    if (!student || totalAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const selectedKeys = selectedItems.map((i) => i.id);
      const selectedSummary = selectedItems.map((i) => `${i.cycleName}`).join(', ');

      const res = await fetch('/api/fees/counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          school_id: school?.id || 'DPS2026',
          student_id: student.id,
          desk_id: deskInfo?.deskId || 'DESK_01',
          session: '2026-27',
          amount_paise: totalAmount * 100,
          payment_mode: paymentMode,
          selected_keys: selectedKeys,
          selected_summary: selectedSummary,
          txn_ref: `UPI-${Date.now().toString(36).toUpperCase()}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setCompletedReceipt(data.receipt);
        setStep('SUCCESS');
        if (onPaymentSuccess) {
          onPaymentSuccess(data.receipt);
        }
      } else {
        alert(data.error || 'Payment failed. Please retry.');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0f172a] text-slate-100 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-6 flex flex-col">
        
        {/* Top App Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">In-App Counter Fee Pay</h3>
              <p className="text-xs text-slate-400">CBSE Touchless Smart Counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SCANNER */}
        {step === 'SCAN' && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-full max-w-xs aspect-square bg-slate-950 rounded-2xl border-2 border-emerald-500/50 relative overflow-hidden flex flex-col items-center justify-center shadow-inner mb-4">
              {/* Camera Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite] pointer-events-none z-10" />

              {/* Overlay QR Frame Box */}
              <div className="w-44 h-44 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none z-10 flex items-center justify-center">
                <span className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                  Point at Counter Standee
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-1">
              School fee counter par rakhe <span className="text-emerald-400 font-bold">Universal Standee QR</span> ko scan karein
            </p>
            <p className="text-[11px] text-slate-500 mb-5">
              Aapka Student Code ({student?.admission_no || 'STU-ACTIVE'}) automatic detect hoga.
            </p>

            {cameraError && (
              <div className="mb-4 text-[11px] text-amber-300 bg-amber-950/50 border border-amber-800/60 p-2.5 rounded-xl w-full flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Quick Test Desk Triggers */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                Select / Simulate Counter Desk
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDeskDetected('DESK_01', 'Fee Counter No. 1')}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700 text-slate-200 hover:text-emerald-300 rounded-xl text-xs font-medium transition-all"
                >
                  <span>Counter 1 (Main)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDeskDetected('DESK_02', 'Fee Counter No. 2')}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700 text-slate-200 hover:text-emerald-300 rounded-xl text-xs font-medium transition-all"
                >
                  <span>Counter 2 (Accounts)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHECKOUT & MULTI-SELECT CART */}
        {step === 'CHECKOUT' && (
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            {/* Student Info Card (Auto-Loaded) */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-700/40 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-md">
                  {student?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                    {student?.full_name || 'Student Name'}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      Class {student?.class_name}-{student?.section}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Adm No: {student?.admission_no || '2026/0481'} • Desk: {deskInfo?.deskTitle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-900/50 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Auto-Verified
                </span>
              </div>
            </div>

            {/* Checkbox Dues Cart Header */}
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Select Pending Fee Heads (चुनें):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={clearAll}
                  className="text-[11px] text-slate-400 hover:text-slate-300 font-medium underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Scrollable Checkbox Cart */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 mb-4">
              {dueItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    item.selected
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        item.selected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{item.cycleName}</p>
                      <p className="text-[10px] text-slate-500">{item.month}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Mode Selection */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Payment Mode:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMode === 'UPI'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  UPI / GPay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('ONLINE')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMode === 'ONLINE'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card / NetBanking
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`px-2 py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMode === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Counter Cash
                </button>
              </div>
            </div>

            {/* Cart Summary & Submit Button */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {selectedItems.length} Fee Items Selected
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <button
                disabled={totalAmount <= 0 || isSubmitting}
                onClick={handleSubmitPayment}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition-all"
              >
                {isSubmitting ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Pay & Print at Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS BANNER */}
        {step === 'SUCCESS' && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border-2 border-emerald-500 mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-lg font-black text-white mb-1">Payment Received Successfully!</h3>
            <p className="text-xs text-slate-400 mb-4">
              Receipt No: <span className="font-mono font-bold text-emerald-400">{completedReceipt?.receipt_no || 'REC-2026-001'}</span>
            </p>

            {/* Notice Box */}
            <div className="w-full bg-emerald-950/70 border border-emerald-700/60 rounded-2xl p-4 mb-6 text-left">
              <h5 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                Collect Printed Receipt from Counter:
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aapki payment <span className="font-bold text-white">{deskInfo?.deskTitle || 'Counter Desk 1'}</span> par receive ho gayi hai. Accountant ke system par live receipt send ho chuki hai. Counter se apni <strong>Signed Dual-Copy Receipt</strong> collect kar lein.
              </p>
            </div>

            <button
              onClick={() => {
                setStep('SCAN');
                onClose();
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Done / Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
