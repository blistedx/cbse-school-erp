'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  GraduationCap,
  Users,
  CreditCard,
  Building2,
  Bell,
  CalendarCheck,
  BookOpen,
  Bus,
  Award,
  Settings,
  FileText,
  ChevronRight,
  Receipt,
  RotateCw
} from 'lucide-react';
import { Student, Teacher, ClassRoom, Notice, FeeInvoice } from '@/lib/types';
import { ReceiptRecord } from '@/lib/fees-engine/types';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  invoices?: FeeInvoice[];
  receipts?: ReceiptRecord[];
  classes: ClassRoom[];
  notices: Notice[];
  schoolId?: string;
  onNavigateTab: (tab: string) => void;
  onSelectStudent?: (s: Student) => void;
  onSelectTeacher?: (t: Teacher) => void;
  onSelectReceipt?: (r: ReceiptRecord | FeeInvoice | any) => void;
}

type SearchCategory = 'ALL' | 'STUDENTS' | 'RECEIPTS' | 'TEACHERS' | 'CLASSES' | 'NOTICES' | 'MODULES';

interface SearchResultItem {
  id: string;
  category: 'STUDENT' | 'TEACHER' | 'RECEIPT' | 'CLASS' | 'NOTICE' | 'MODULE';
  title: string;
  subtitle: string;
  tag?: string;
  tagColor?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  action: () => void;
}

const ERP_MODULES = [
  { id: 'overview', title: 'Dashboard Overview', desc: 'School KPI, Turnout & Live Analytics', icon: Building2, tab: 'overview' },
  { id: 'fees', title: 'Fee Master & Billing Desk', desc: 'Collect Fees, Print A4 Dual Receipts, Structure & Dues', icon: Receipt, tab: 'fees' },
  { id: 'students', title: 'Scholars Directory', desc: 'Manage Student Profiles, Admissions & Roll Numbers', icon: GraduationCap, tab: 'students' },
  { id: 'teachers', title: 'Faculty & Staff Directory', desc: 'Teachers, Biometrics, Designations & Qualifications', icon: Users, tab: 'teachers' },
  { id: 'attendance', title: 'Attendance Register', desc: 'Daily Classroom Attendance & Staff Biometric Logs', icon: CalendarCheck, tab: 'attendance' },
  { id: 'classes', title: 'Class & Timetable Matrix', desc: 'Class Sections, Rooms & Class Teachers', icon: Building2, tab: 'classes' },
  { id: 'subjects', title: 'Curriculum & Subjects', desc: 'CBSE Syllabus, Subject Codes & Academic Tracks', icon: BookOpen, tab: 'subjects' },
  { id: 'exams', title: 'Assessments & Marksheets', desc: 'CBSE Report Cards, Term Exams & Grading', icon: Award, tab: 'exams' },
  { id: 'homework', title: 'Daily Coursework & Homework', desc: 'Homework Assignments, Syllabi & Notes', icon: FileText, tab: 'homework' },
  { id: 'transport', title: 'Bus & Transport Fleet', desc: 'Bus Routes, Stops, Telemetry & Vehicles', icon: Bus, tab: 'transport' },
  { id: 'notices', title: 'Circulars & Notice Board', desc: 'Official Campus Bulletins & Directives', icon: Bell, tab: 'notices' },
  { id: 'broadcast', title: 'Broadcast & Push Alerts', desc: 'Send Instant SMS, Push Notifications & Direct Dispatch', icon: Bell, tab: 'broadcast' },
  { id: 'reports', title: 'Institutional Reports', desc: 'Comprehensive PDF/Excel Dossiers & Analytics', icon: FileText, tab: 'reports' },
  { id: 'certificates', title: 'Document & Certificate Desk', desc: 'TC, Character Certificate & Bonafide Issuance', icon: FileText, tab: 'certificates' },
  { id: 'data_hub', title: 'Import / Export Data Hub', desc: 'Bulk Excel/CSV Uploads & Ledger Backups', icon: FileText, tab: 'data_hub' },
  { id: 'settings', title: 'School Settings & CBSE Profile', desc: 'OASIS, UDISE+, Board Info & Configuration', icon: Settings, tab: 'settings' },
];

export function OmniSearchModal({
  isOpen,
  onClose,
  students = [],
  teachers = [],
  invoices = [],
  receipts = [],
  classes = [],
  notices = [],
  schoolId,
  onNavigateTab,
  onSelectStudent,
  onSelectTeacher,
  onSelectReceipt
}: OmniSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveReceipts, setLiveReceipts] = useState<ReceiptRecord[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setLiveReceipts([]);
    }
  }, [isOpen]);

  // Global shortcut listener: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live query fee-master API for receipts when query is typed
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setLiveReceipts([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const res = await fetch(`/api/fee-master?action=search_receipt&q=${encodeURIComponent(trimmed)}${schoolId ? `&school_id=${schoolId}` : ''}`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.receipts)) {
          setLiveReceipts(data.receipts);
        }
      } catch (err) {
        // silent fallback
      } finally {
        setIsSearchingApi(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, schoolId]);

  // Merged unique receipts from props and live query
  const allReceipts = useMemo(() => {
    const map = new Map<string, any>();
    (receipts || []).forEach(r => {
      if (r && r.receipt_no) map.set(r.receipt_no.toLowerCase(), r);
    });
    (liveReceipts || []).forEach(r => {
      if (r && r.receipt_no) map.set(r.receipt_no.toLowerCase(), r);
    });
    return Array.from(map.values());
  }, [receipts, liveReceipts]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Helper: Push Receipts & Invoices
    const pushReceipts = (limit = 20) => {
      // 1. Receipts from fee engine
      const matchedReceipts = allReceipts.filter(r => {
        if (!r) return false;
        if (!q) return true;
        const rNo = (r.receipt_no || '').toLowerCase();
        const sName = (r.student_name || '').toLowerCase();
        const adm = (r.admission_no || r.student_id || '').toLowerCase();
        const mode = (r.payment_mode || '').toLowerCase();
        const ref = (r.txn_ref || r.cheque_no || '').toLowerCase();
        const cls = (r.class_name || '').toLowerCase();
        return rNo.includes(q) || sName.includes(q) || adm.includes(q) || mode.includes(q) || ref.includes(q) || cls.includes(q);
      }).slice(0, limit);

      matchedReceipts.forEach(r => {
        const amtRupees = (r.amount_paise ? r.amount_paise / 100 : Number(r.amount || 0)).toLocaleString('en-IN');
        results.push({
          id: `rec-${r.receipt_no}`,
          category: 'RECEIPT',
          title: `Fee Receipt #${r.receipt_no}`,
          subtitle: `Scholar: ${r.student_name} (${r.class_name || 'Class'} - ${r.section || 'A'}, Adm: ${r.admission_no || '—'}) • Paid: ₹${amtRupees} via ${r.payment_mode || 'CASH'} on ${r.payment_date || '—'}`,
          tag: `₹${amtRupees} Paid`,
          tagColor: r.is_cancelled ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Receipt,
          iconColor: 'text-emerald-700',
          iconBg: 'bg-emerald-50',
          action: () => {
            if (onSelectReceipt) {
              onSelectReceipt(r);
            } else {
              onNavigateTab('fees');
            }
            onClose();
          }
        });
      });

      // 2. Static Invoices (if any)
      const matchedInvoices = (invoices || []).filter(inv => {
        if (!inv) return false;
        if (!q) return false;
        const invNo = (inv.invoice_no || inv.id || '').toLowerCase();
        const sName = (inv.student_name || '').toLowerCase();
        const status = (inv.status || '').toLowerCase();
        return invNo.includes(q) || sName.includes(q) || status.includes(q);
      }).slice(0, 10);

      matchedInvoices.forEach(inv => {
        // Skip duplicate if receipt already showed
        if (results.some(r => r.id === `rec-${inv.invoice_no}`)) return;
        const amt = Number(inv.amount || (inv as any).total_amount || 0).toLocaleString('en-IN');
        results.push({
          id: `inv-${inv.id}`,
          category: 'RECEIPT',
          title: `Fee Invoice #${inv.invoice_no || inv.id}`,
          subtitle: `Scholar: ${inv.student_name || 'Scholar'} • Amount: ₹${amt} • Status: ${inv.status || 'DUE'} • Due: ${inv.due_date || '—'}`,
          tag: `₹${amt} ${inv.status || 'Invoice'}`,
          tagColor: inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Receipt,
          iconColor: 'text-emerald-700',
          iconBg: 'bg-emerald-50',
          action: () => {
            if (onSelectReceipt) {
              onSelectReceipt(inv);
            } else {
              onNavigateTab('fees');
            }
            onClose();
          }
        });
      });
    };

    // Helper: Push Students
    const pushStudents = (limit = 20) => {
      const matchedStudents = students.filter(s => {
        if (!s) return false;
        if (!q) return true;
        const anyS = s as any;
        const name = (s.full_name || '').toLowerCase();
        const adm = (s.admission_no || s.id || '').toLowerCase();
        const roll = String(s.roll_no || '').toLowerCase();
        const cls = (s.class_name || '').toLowerCase();
        const sec = (s.section || '').toLowerCase();
        const father = (s.father_name || s.guardian_name || '').toLowerCase();
        const phone = (s.guardian_phone || anyS.emergency_contact_phone || anyS.father_phone || '').toLowerCase();
        const email = (s.guardian_email || '').toLowerCase();
        const apaar = (anyS.apaar_id || '').toLowerCase();
        const aadhaar = (anyS.aadhaar_no || '').toLowerCase();
        return name.includes(q) || adm.includes(q) || roll.includes(q) || cls.includes(q) || sec.includes(q) || father.includes(q) || phone.includes(q) || email.includes(q) || apaar.includes(q) || aadhaar.includes(q);
      }).slice(0, limit);

      matchedStudents.forEach(s => {
        results.push({
          id: `stu-${s.id}`,
          category: 'STUDENT',
          title: s.full_name,
          subtitle: `Class ${s.class_name} (${s.section || 'A'}) • Roll ${s.roll_no || '—'} • Adm: ${s.admission_no || s.id} • Parent: ${s.father_name || s.guardian_name || 'N/A'}`,
          tag: s.fee_status === 'PAID' ? 'Fee Paid' : 'Fee Due',
          tagColor: s.fee_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
          icon: GraduationCap,
          iconColor: 'text-blue-700',
          iconBg: 'bg-blue-50',
          action: () => {
            onNavigateTab('students');
            if (onSelectStudent) onSelectStudent(s);
            onClose();
          }
        });
      });
    };

    // Helper: Push Teachers
    const pushTeachers = (limit = 15) => {
      const matchedTeachers = teachers.filter(t => {
        if (!t) return false;
        if (!q) return true;
        const name = (t.full_name || '').toLowerCase();
        const code = (t.staff_code || t.id || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        const desig = (t.designation || '').toLowerCase();
        const subj = (t.subject_specialization || '').toLowerCase();
        const phone = (t.phone || '').toLowerCase();
        const email = (t.email || '').toLowerCase();
        return name.includes(q) || code.includes(q) || dept.includes(q) || desig.includes(q) || subj.includes(q) || phone.includes(q) || email.includes(q);
      }).slice(0, limit);

      matchedTeachers.forEach(t => {
        results.push({
          id: `tch-${t.id}`,
          category: 'TEACHER',
          title: t.full_name,
          subtitle: `${t.designation || 'Faculty'} • Dept: ${t.department || 'General'} • Code: ${t.staff_code || t.id} • ${t.phone || t.email || ''}`,
          tag: t.subject_specialization || t.department || 'Faculty',
          tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Users,
          iconColor: 'text-purple-700',
          iconBg: 'bg-purple-50',
          action: () => {
            onNavigateTab('teachers');
            if (onSelectTeacher) onSelectTeacher(t);
            onClose();
          }
        });
      });
    };

    // Helper: Push Classes
    const pushClasses = (limit = 10) => {
      const matchedClasses = classes.filter(c => {
        if (!c) return false;
        if (!q) return true;
        const name = (c.class_name || '').toLowerCase();
        const sec = (c.section || '').toLowerCase();
        const code = (c.class_code || c.id || '').toLowerCase();
        const teacher = (c.class_teacher || '').toLowerCase();
        const room = (c.room_no || '').toLowerCase();
        return name.includes(q) || sec.includes(q) || code.includes(q) || teacher.includes(q) || room.includes(q);
      }).slice(0, limit);

      matchedClasses.forEach(c => {
        results.push({
          id: `cls-${c.id}`,
          category: 'CLASS',
          title: `Class ${c.class_name} - Section ${c.section || 'A'}`,
          subtitle: `Class Teacher: ${c.class_teacher || 'Unassigned'} • Room: ${c.room_no || 'N/A'} • Capacity: ${c.capacity || 40} Scholars`,
          tag: 'Academic Cohort',
          tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Building2,
          iconColor: 'text-blue-700',
          iconBg: 'bg-blue-50',
          action: () => {
            onNavigateTab('classes');
            onClose();
          }
        });
      });
    };

    // Helper: Push Notices
    const pushNotices = (limit = 10) => {
      const matchedNotices = notices.filter(n => {
        if (!n) return false;
        if (!q) return true;
        const title = (n.title || '').toLowerCase();
        const content = (n.content || '').toLowerCase();
        const aud = (n.target_audience || '').toLowerCase();
        const by = (n.posted_by || '').toLowerCase();
        return title.includes(q) || content.includes(q) || aud.includes(q) || by.includes(q);
      }).slice(0, limit);

      matchedNotices.forEach(n => {
        results.push({
          id: `not-${n.id}`,
          category: 'NOTICE',
          title: n.title,
          subtitle: `${n.content?.slice(0, 90)}... • Issued by: ${n.posted_by || 'Admin'}`,
          tag: n.target_audience || 'All Campus',
          tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Bell,
          iconColor: 'text-amber-700',
          iconBg: 'bg-amber-50',
          action: () => {
            onNavigateTab('notices');
            onClose();
          }
        });
      });
    };

    // Helper: Push Modules
    const pushModules = (limit = 20) => {
      const matchedModules = ERP_MODULES.filter(mod => {
        if (!q) return true;
        return mod.title.toLowerCase().includes(q) || mod.desc.toLowerCase().includes(q) || mod.tab.toLowerCase().includes(q);
      }).slice(0, limit);

      matchedModules.forEach(mod => {
        results.push({
          id: `mod-${mod.id}`,
          category: 'MODULE',
          title: mod.title,
          subtitle: mod.desc,
          tag: 'ERP Module',
          tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: mod.icon,
          iconColor: 'text-emerald-700',
          iconBg: 'bg-emerald-50',
          action: () => {
            onNavigateTab(mod.tab);
            onClose();
          }
        });
      });
    };

    // CATEGORY ROUTING
    if (activeCategory === 'RECEIPTS') {
      pushReceipts(50);
    } else if (activeCategory === 'STUDENTS') {
      pushStudents(50);
    } else if (activeCategory === 'TEACHERS') {
      pushTeachers(50);
    } else if (activeCategory === 'CLASSES') {
      pushClasses(50);
    } else if (activeCategory === 'NOTICES') {
      pushNotices(50);
    } else if (activeCategory === 'MODULES') {
      pushModules(50);
    } else {
      // ALL CATEGORIES:
      if (q) {
        // If user is searching a receipt code (contains rec-, dps, invoice, numbers): prioritize receipts!
        if (q.includes('rec') || q.includes('inv') || /\d{3,}/.test(q)) {
          pushReceipts(15);
          pushStudents(10);
        } else {
          pushStudents(12);
          pushReceipts(8);
        }
        pushTeachers(8);
        pushClasses(6);
        pushNotices(6);
        pushModules(6);
      } else {
        // When query is empty: show key modules first, then recent scholars and receipts
        pushModules(6);
        pushStudents(6);
        pushReceipts(4);
        pushTeachers(4);
      }
    }

    return results;
  }, [query, activeCategory, students, teachers, allReceipts, invoices, classes, notices, onNavigateTab, onClose, onSelectStudent, onSelectTeacher, onSelectReceipt]);

  // Handle Keyboard Navigation (Arrow Up, Arrow Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
      }
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3.5 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#DCE8E0] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Search Bar Input */}
        <div className="p-3.5 sm:p-4 border-b border-[#DCE8E0] flex items-center gap-3 bg-[#F9FCFA]">
          <Search className="w-5 h-5 text-emerald-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search receipts (e.g. DPS2-REC...), scholars, faculty, classes, modules..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-semibold text-[#122A24] focus:outline-none placeholder:text-slate-400"
          />
          {isSearchingApi && (
            <RotateCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-[#DCE8E0] rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="px-3.5 sm:px-4 py-2 border-b border-[#E8F0EA] bg-[#F4F8F5] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Results' },
            { id: 'RECEIPTS', label: `Receipts & Invoices (${allReceipts.length || invoices.length})` },
            { id: 'STUDENTS', label: `Scholars (${students.length})` },
            { id: 'TEACHERS', label: `Faculty (${teachers.length})` },
            { id: 'CLASSES', label: `Classes (${classes.length})` },
            { id: 'NOTICES', label: `Circulars (${notices.length})` },
            { id: 'MODULES', label: 'ERP Modules' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as SearchCategory)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#122A24] text-white border-[#122A24]'
                  : 'bg-white text-slate-600 border-[#DCE8E0] hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 max-h-[60vh]">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#EBF5EF] border border-emerald-300/80 shadow-2xs' : 'hover:bg-[#F9FCFA] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl ${item.iconBg} ${item.iconColor} border border-black/5 flex items-center justify-center shrink-0`}>
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#122A24] truncate">
                          {item.title}
                        </span>
                        {item.tag && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${item.tagColor}`}>
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                    <span className="text-[11px] font-mono font-semibold hidden sm:inline text-emerald-800">
                      {item.category === 'RECEIPT' ? 'Open Receipt →' : 'Jump →'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600 text-sm">No records found matching "{query}"</p>
              <p className="mt-1">Try searching by receipt number (e.g. DPS2-REC-508646-640), scholar name, admission ID, or faculty staff code.</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-2.5 sm:p-3 border-t border-[#E8F0EA] bg-[#F9FCFA] flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>ENTER</strong> Open</span>
            <span><strong>ESC</strong> Close</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-bold hidden sm:inline">
            {searchResults.length} items found
          </span>
        </div>
      </div>
    </div>
  );
}
