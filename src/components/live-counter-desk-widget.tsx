/*! EduSuite Accountant Live Counter Desk Widget v1.0.0 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Printer,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Receipt,
  UserCheck
} from 'lucide-react';
import { School } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { DualCopyFeeReceiptModal } from '@/components/dual-copy-fee-receipt-modal';

interface LiveCounterDeskWidgetProps {
  school?: School | any;
  currentDeskId?: string;
}

interface CounterQueueItem {
  id: string;
  deskId: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  amountPaise: number;
  paymentMode: string;
  receiptNo: string;
  selectedHeadsSummary: string;
  timestamp: number;
  printed: boolean;
  receiptData: any;
}

// Web Audio API Cashier Chime Synthesizer
function playCashierChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Note 1: E6 (1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Note 2: B6 (1975.53 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.53, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.7);
  } catch {
    // AudioContext blocked by browser autoplay policy until interaction
  }
}

export function LiveCounterDeskWidget({
  school,
  currentDeskId = 'COUNTER_ALL'
}: LiveCounterDeskWidgetProps) {
  const [deskId, setDeskId] = useState(currentDeskId);
  const [queue, setQueue] = useState<CounterQueueItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [newIncomingPulse, setNewIncomingPulse] = useState(false);

  const schoolId = school?.id || 'DPS2026';

  // Fetch initial queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/fees/counter?action=queue&desk_id=${deskId}&school_id=${schoolId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.queue)) {
        setQueue(data.queue);
      }
    } catch (e) {
      console.warn('Failed to load counter queue:', e);
    }
  }, [deskId, schoolId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Connect SSE Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    try {
      eventSource = new EventSource(`/api/fees/counter?action=stream&desk_id=${deskId}&school_id=${schoolId}`);
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'NEW_COUNTER_PAYMENT') {
            const newItem: CounterQueueItem = parsed.payload;
            if (deskId === 'COUNTER_ALL' || newItem.deskId === deskId) {
              setQueue((prev) => [newItem, ...prev.filter((q) => q.id !== newItem.id)]);
              if (soundEnabled) playCashierChime();
              setNewIncomingPulse(true);
              setTimeout(() => setNewIncomingPulse(false), 3000);
            }
          } else if (parsed.type === 'RECEIPT_PRINTED') {
            const { receiptNo } = parsed.payload;
            setQueue((prev) =>
              prev.map((q) => (q.receiptNo === receiptNo ? { ...q, printed: true } : q))
            );
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Fallback polling every 5s if SSE disconnects
        if (!fallbackInterval) {
          fallbackInterval = setInterval(fetchQueue, 5000);
        }
      };
    } catch {
      fallbackInterval = setInterval(fetchQueue, 5000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [deskId, schoolId, soundEnabled, fetchQueue]);

  const handlePrintClick = async (item: CounterQueueItem) => {
    // Format receipt data for DualCopyFeeReceiptModal
    const formattedReceipt = {
      ...item.receiptData,
      receipt_no: item.receiptNo,
      student_id: item.studentId,
      student_name: item.studentName,
      admission_no: item.admissionNo,
      class_name: item.className,
      section: item.section,
      amount_paise: item.amountPaise,
      amount: item.amountPaise / 100,
      payment_mode: item.paymentMode,
      created_at: new Date(item.timestamp).toISOString(),
      remarks: item.selectedHeadsSummary
    };

    setSelectedReceiptForPrint(formattedReceipt);
    setIsReceiptModalOpen(true);

    // Mark printed in backend
    try {
      await fetch('/api/fees/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_printed',
          school_id: schoolId,
          receipt_no: item.receiptNo
        })
      });
      setQueue((prev) =>
        prev.map((q) => (q.receiptNo === item.receiptNo ? { ...q, printed: true } : q))
      );
    } catch {}
  };

  const unprintedItems = queue.filter((q) => !q.printed);

  return (
    <>
      <div className="w-full bg-[#122A24] border-2 border-emerald-500/40 rounded-2xl shadow-xl text-slate-100 overflow-hidden mb-6 transition-all">
        {/* Top Live Bar */}
        <div className="px-5 py-3.5 bg-[#0b1c18] border-b border-emerald-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center justify-center ${
              newIncomingPulse 
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 animate-bounce' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Live Fee Counter Stream
                </h3>
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isConnected ? 'LIVE SSE' : 'POLLING'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Incoming student payments from Universal Desk QR Standees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter by desk */}
            <select
              value={deskId}
              onChange={(e) => setDeskId(e.target.value)}
              aria-label="Filter by Counter Desk"
              className="bg-slate-900 border border-emerald-900/80 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="COUNTER_ALL">All Counter Desks</option>
              <option value="DESK_01">Counter Desk 1</option>
              <option value="DESK_02">Counter Desk 2</option>
              <option value="DESK_03">Counter Desk 3</option>
              <option value="RECEPTION">Reception Desk</option>
            </select>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime Sound Enabled' : 'Muted'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                soundEnabled
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700 hover:bg-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchQueue}
              title="Manual Refresh"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Expand / Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Counter Summary Stats Strip */}
        <div className="px-5 py-2 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong>{unprintedItems.length}</strong> Pending Print Receipts
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>{queue.length}</strong> Total Today
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/90 font-mono">
            Auto-Printing Active
          </span>
        </div>

        {/* Queue List */}
        {isExpanded && (
          <div className="p-4 bg-[#0d221d] max-h-72 overflow-y-auto space-y-2.5">
            {queue.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
                <Receipt className="w-8 h-8 text-emerald-600/40 mb-2" />
                <p className="font-medium text-slate-300">No Counter Transactions Yet</p>
                <p className="text-[11px] text-slate-500">
                  When parents scan the desk QR and pay, incoming entries will pop up here in real-time.
                </p>
              </div>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                    item.printed
                      ? 'bg-slate-900/40 border-emerald-950 text-slate-400'
                      : 'bg-emerald-950/80 border-emerald-500 text-slate-100 shadow-md shadow-black/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                      item.printed ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white'
                    }`}>
                      {item.studentName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.studentName}</span>
                        <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">
                          Class {item.className}-{item.section}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Adm: {item.admissionNo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className="text-emerald-300 font-medium">{item.selectedHeadsSummary}</span> •{' '}
                        <span className="font-mono text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {formatCurrency(item.amountPaise / 100)}
                      </span>
                      <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {item.paymentMode} • {item.deskId}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePrintClick(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
                        item.printed
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/60'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {item.printed ? 'Re-Print' : 'Print Dual Receipt'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Dual Copy Receipt Print Modal */}
      {isReceiptModalOpen && selectedReceiptForPrint && (
        <DualCopyFeeReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receipt={selectedReceiptForPrint}
          selectedSchool={school}
        />
      )}
    </>
  );
}
