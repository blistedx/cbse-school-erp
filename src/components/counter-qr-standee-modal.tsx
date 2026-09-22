/*! EduSuite Universal Counter Standee Generator v1.0.0 */
'use client';

import React, { useState, useRef } from 'react';
import {
  QrCode,
  Printer,
  X,
  Building2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Receipt,
  Download,
  Layers,
  HelpCircle
} from 'lucide-react';
import { School } from '@/lib/types';

interface CounterQrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  school?: School | any;
}

export function CounterQrStandeeModal({
  isOpen,
  onClose,
  school
}: CounterQrStandeeModalProps) {
  const [deskId, setDeskId] = useState('DESK_01');
  const [deskTitle, setDeskTitle] = useState('Fee Counter No. 1');
  const standeeRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const schoolName = school?.name || 'DELHI PUBLIC SCHOOL (CBSE)';
  const schoolId = school?.id || 'DPS2026';
  const affiliationNo = school?.affiliation_no || school?.cbse_affiliation_no || 'CBSE-AFF-2130048';
  const schoolAddress = school?.address || 'Knowledge Park III, Institutional Area, Greater Noida';

  // Standard JSON payload embedded in QR
  const qrPayload = JSON.stringify({
    app: 'CBSE_SCHOOL_ERP',
    type: 'COUNTER_DESK',
    schoolId,
    deskId,
    deskTitle
  });

  // Generates dynamic SVG QR code url via standard Google/QuickChart QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}&margin=10&color=122a24`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-[#0f172a] text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Universal Fee Counter Standee</h3>
              <p className="text-xs text-slate-400">Printable Acrylic / Counter Desk QR Standee</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Standee
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desk Selector Bar */}
        <div className="px-6 py-3 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Desk / Counter:</span>
            <select
              value={deskId}
              onChange={(e) => {
                setDeskId(e.target.value);
                if (e.target.value === 'DESK_01') setDeskTitle('Fee Counter No. 1');
                else if (e.target.value === 'DESK_02') setDeskTitle('Fee Counter No. 2');
                else if (e.target.value === 'DESK_03') setDeskTitle('Fee Counter No. 3');
                else if (e.target.value === 'RECEPTION') setDeskTitle('Reception Desk');
                else setDeskTitle(`Counter ${e.target.value}`);
              }}
              className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="DESK_01">Counter No. 1 (Main Fee Desk)</option>
              <option value="DESK_02">Counter No. 2 (Accounts Wing)</option>
              <option value="DESK_03">Counter No. 3 (Fast Track)</option>
              <option value="RECEPTION">Reception / Front Office</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            Universal QR: All students auto-detected on scan
          </div>
        </div>

        {/* Standee Preview for Screen & Print */}
        <div className="p-6 bg-slate-950/50 flex justify-center">
          <div
            ref={standeeRef}
            id="counter-standee-printable"
            className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border-4 border-[#122A24] p-6 flex flex-col items-center text-center relative"
          >
            {/* Top School Header */}
            <div className="w-full flex flex-col items-center border-b-2 border-dashed border-emerald-800/30 pb-4 mb-4">
              <div className="w-12 h-12 bg-[#122A24] text-emerald-400 rounded-full flex items-center justify-center mb-2 shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black tracking-tight text-[#122A24] uppercase leading-snug">
                {schoolName}
              </h2>
              <p className="text-[10px] text-slate-600 font-medium tracking-wide">
                Affiliation No: {affiliationNo} | {schoolAddress}
              </p>
              
              {/* Standee Badge */}
              <div className="mt-2.5 px-3 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[11px] font-bold tracking-wider uppercase">
                {deskTitle}
              </div>
            </div>

            {/* QR Card Section */}
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center mb-4 shadow-inner">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                Scan via Parent App
              </span>
              <p className="text-[10px] text-slate-500 mb-3">
                Open ERP Mobile App → Tap <span className="font-semibold text-emerald-800">"Scan Counter QR"</span>
              </p>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="Universal Fee Counter QR"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded">
                CODE: {deskId} • {schoolId}
              </div>
            </div>

            {/* How It Works Steps */}
            <div className="w-full bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-left">
              <p className="text-[11px] font-bold text-emerald-950 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                4 Easy Steps (4 आसान चरण):
              </p>
              <div className="space-y-1 text-[10px] text-slate-700">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-800">1.</span>
                  <span><strong>Scan QR:</strong> Apni Parent App se is QR ko scan karein.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-800">2.</span>
                  <span><strong>Auto-Detect:</strong> Aapke bachhe ka naam aur pending fees turant load ho jayegi.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-800">3.</span>
                  <span><strong>Select & Pay:</strong> Pending mahino ke heads tick karke UPI/Online pay karein.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-800">4.</span>
                  <span><strong>Instant Receipt:</strong> Counter se apni printed dual-copy receipt collect karein.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-[9px] text-slate-400">
              <span>CBSE Unified Fees Desk v3.0</span>
              <span>100% Touchless & Instant</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Place this acrylic standee near Counter Cashier desk.</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Now
          </button>
        </div>

      </div>
    </div>
  );
}
