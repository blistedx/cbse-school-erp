/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';
import { School } from '@/lib/types';

export interface ReportColumn {
  header: string;
  key?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: any, idx: number) => React.ReactNode;
}

export interface InstitutionalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  session?: string;
  reportTitle: string;
  reportSubtitle?: string;
  filterSummary?: { label: string; value: string }[];
  statsSummary?: { label: string; value: string | number }[];
  columns: ReportColumn[];
  data: any[];
  onDownloadCSV?: () => void;
}

export function InstitutionalReportModal({
  isOpen,
  onClose,
  school,
  session = '2026-27',
  reportTitle,
  reportSubtitle,
  filterSummary = [],
  statsSummary = [],
  columns,
  data = [],
  onDownloadCSV
}: InstitutionalReportModalProps) {
  if (!isOpen) return null;

  const schoolName = (school as any)?.name || school?.school_name || 'Delhi Public School, Sector 12';
  const schoolCode = school?.school_code || school?.id || 'DPS2026';
  const affNo = school?.affiliation_no || (school as any)?.affiliation_number || 'CBSE/AFF/2026/0894';
  const schoolAddress = school?.address || 'Pocket 4, Institutional Area, City Campus, Delhi NCR - 110075';
  const schoolPhone = school?.phone || (school as any)?.contact_phone || '+91 11 2805 1200';
  const schoolEmail = school?.email || (school as any)?.contact_email || 'info@dps2026.edu.in';
  const principalName = school?.principal_name || 'Dr. Aniruddh Shastri (Principal)';

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const refNo = `REF: ${schoolCode}/RPT/${session}/${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrint = () => {
    window.print();
  };

  const cleanReportTitle = (reportTitle || 'REPORT').replace(/CBSE\s*/gi, '').trim() || 'REPORT';
  const cleanReportSubtitle = reportSubtitle ? reportSubtitle.replace(/CBSE\s*/gi, '').trim() : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* ─────────────────────────────────────────────────────────────
          PRINT-SPECIFIC CSS INJECTION
          ───────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-sheet,
          #printable-report-sheet * {
            visibility: visible !important;
          }
          #printable-report-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-[#EBF5EF] rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-[#C5E2CF] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-[#122A24] text-white p-4 px-6 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div>
            <div className="text-[11px] font-mono text-emerald-300 uppercase font-bold tracking-wider">
              Official Document Engine
            </div>
            <h2 className="font-display font-bold text-base text-white">
              {cleanReportTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#122A24] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
            >
              <Printer className="w-4 h-4 text-[#122A24]" />
              <span>Print Official PDF (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors border-none cursor-pointer p-0"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-[#EBF5EF]/60">
          
          {/* ─────────────────────────────────────────────────────────
              THE OFFICIAL PRINTABLE A4 REPORT SHEET
              ───────────────────────────────────────────────────────── */}
          <div
            id="printable-report-sheet"
            className="w-full max-w-[950px] bg-white text-[#122A24] p-6 sm:p-8 rounded-2xl shadow-lg border border-[#DCE8E0] space-y-5 font-sans text-xs"
          >
            
            {/* 1. INSTITUTIONAL LETTERHEAD */}
            <div className="border-b-2 border-[#122A24] pb-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                
                {/* School Logo / Crest Placeholder */}
                <div className="w-14 h-14 rounded-2xl bg-[#122A24] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-8 h-8 text-emerald-400" />
                </div>

                {/* Central School Identity */}
                <div className="text-center flex-1 space-y-1">
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#122A24] tracking-tight uppercase">
                    {schoolName}
                  </h1>
                  <p className="text-[11px] font-bold text-[#1C443A] uppercase tracking-wider">
                    OFFICIAL REPORT
                  </p>
                  <p className="text-[10px] text-slate-500">
                    School Code: <strong>{schoolCode}</strong> &bull; {schoolAddress} &bull; Ph: {schoolPhone}
                  </p>
                </div>

                {/* Document Ref & Timestamp */}
                <div className="text-right shrink-0 font-mono text-[10px] text-[#2D5A4E] space-y-0.5 border-l border-slate-200 pl-3">
                  <div className="font-bold text-[#122A24]">{refNo}</div>
                  <div>Session: <strong>{session}</strong></div>
                  <div>Date: <strong>{currentDate}</strong></div>
                  <div>Time: {currentTime}</div>
                </div>

              </div>
            </div>

            {/* 2. REPORT TITLE & BANNER */}
            <div className="bg-[#F4F8F5] border border-[#DCE8E0] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display font-bold text-sm sm:text-base text-[#122A24] uppercase tracking-wide">
                  {cleanReportTitle}
                </h2>
                {cleanReportSubtitle && (
                  <p className="text-[11px] text-[#2D5A4E] mt-0.5 font-medium">
                    {cleanReportSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-md bg-[#122A24] text-white font-mono font-bold text-[10.5px]">
                  Total Records: {data.length}
                </span>
              </div>
            </div>

            {/* 3. FILTERS & METADATA SUMMARY */}
            {(filterSummary.length > 0 || statsSummary.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono bg-[#FAFCFA] p-3 rounded-xl border border-[#E8F0EA]">
                {filterSummary.map((f, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="text-slate-400 text-[9.5px] uppercase block font-semibold">{f.label}</span>
                    <span className="font-bold text-[#122A24]">{f.value}</span>
                  </div>
                ))}
                {statsSummary.map((s, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <span className="text-slate-400 text-[9.5px] uppercase block font-semibold">{s.label}</span>
                    <span className="font-bold text-emerald-800">{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 4. HIGH-CONTRAST STRUCTURED DATA TABLE */}
            <div className="border border-[#122A24] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead className="bg-[#122A24] text-white font-mono font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-white/20 w-8 text-center">#</th>
                    {columns.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        className={`py-2.5 px-3 border-r border-white/20 last:border-r-0 ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                        style={{ width: col.width }}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="p-8 text-center text-slate-500 font-mono text-xs"
                      >
                        No records found matching the applied criteria.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#F9FCFA]'}
                      >
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-500 text-[10px]">
                          {rIdx + 1}
                        </td>
                        {columns.map((col, cIdx) => {
                          const val = col.render ? col.render(row, rIdx) : (col.key ? row[col.key] : '—');
                          return (
                            <td
                              key={cIdx}
                              className={`py-2 px-3 border-r border-slate-200 last:border-r-0 ${
                                col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center font-mono' : 'text-left'
                              }`}
                            >
                              {val !== undefined && val !== null ? val : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. STATUTORY VERIFICATION & SIGNATURE BLOCKS */}
            <div className="pt-8 border-t border-slate-300 space-y-6">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>
                  * This is an official institutional report generated from Giterp Multi-School Enterprise ERP Core.
                </div>
                <div>
                  Page 1 of 1 &bull; Status: <strong>VERIFIED &amp; LOCKED</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-6 text-center text-xs">
                <div className="space-y-12">
                  <div className="border-b border-slate-400 w-36 mx-auto" />
                  <div>
                    <div className="font-bold text-[#122A24]">Prepared By</div>
                    <div className="text-[10px] text-slate-500 font-mono">Administrative Clerk / Staff</div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-slate-400 w-36 mx-auto" />
                  <div>
                    <div className="font-bold text-[#122A24]">Checked &amp; Verified</div>
                    <div className="text-[10px] text-slate-500 font-mono">Head of Academics / Supervisor</div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="border-b border-slate-400 w-36 mx-auto" />
                  <div>
                    <div className="font-bold text-[#122A24]">{principalName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Authorized Signatory &amp; Seal</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
