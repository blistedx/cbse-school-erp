/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Barcode,
  Layers,
  Sparkles,
  User,
  Calendar,
  X,
  Check,
  MessageCircle,
  ArrowRightLeft,
  BookMarked,
  RotateCcw
} from 'lucide-react';
import { School, Student, BookItem, BookCirculationRecord } from '@/lib/types';
import { openWhatsAppDirect } from '@/lib/whatsapp';

export interface DashboardLibraryProps {
  selectedSchool?: School | null;
  students: Student[];
  selectedSession?: string;
  showAdminToast?: (msg: string) => void;
}

export function DashboardLibrary({
  selectedSchool,
  students = [],
  selectedSession = '2026-27',
  showAdminToast
}: DashboardLibraryProps) {
  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPrintRegister, setShowPrintRegister] = useState(false);

  // Form states for adding a book
  const [newBookIsbn, setNewBookIsbn] = useState('978-93-5292-140-5');
  const [newBookTitle, setNewBookTitle] = useState('CBSE Mathematics Exemplar Class 10');
  const [newBookAuthor, setNewBookAuthor] = useState('NCERT Editorial Board');
  const [newBookCategory, setNewBookCategory] = useState('CBSE Reference');
  const [newBookRack, setNewBookRack] = useState('Rack M-04 / Shelf 2');
  const [newBookCopies, setNewBookCopies] = useState(15);
  const [newBookPrice, setNewBookPrice] = useState(380);

  // Form states for issuing a book with Class & Section Filters
  const [issueFilterClass, setIssueFilterClass] = useState<string>('ALL');
  const [issueFilterSection, setIssueFilterSection] = useState<string>('ALL');
  const [issueScholarSearch, setIssueScholarSearch] = useState<string>('');
  const [issueStudentId, setIssueStudentId] = useState(students[0]?.id || '');
  const [issueBookId, setIssueBookId] = useState('');

  // Available Classes and Sections
  const availableClasses = useMemo(() => {
    const set = new Set(students.map(s => s.class_name).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const availableSections = useMemo(() => {
    const set = new Set(students.map(s => s.section).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students for Book Issuing
  const filteredIssueStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = issueFilterClass === 'ALL' || s.class_name === issueFilterClass;
      const matchSection = issueFilterSection === 'ALL' || (s.section || 'A') === issueFilterSection;
      const q = issueScholarSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_no || '').toLowerCase().includes(q) ||
        String(s.roll_no || '').includes(q);
      return matchClass && matchSection && matchSearch;
    });
  }, [students, issueFilterClass, issueFilterSection, issueScholarSearch]);

  // Initial Seed Books
  const [books, setBooks] = useState<BookItem[]>([
    {
      id: 'BK-001',
      isbn: '978-81-7450-488-3',
      title: 'Mathematics Class 10 (NCERT Standard)',
      author: 'NCERT Board of Studies',
      category: 'Mathematics',
      rack_no: 'Rack M-01 / Shelf 3',
      total_copies: 35,
      available_copies: 28,
      publisher: 'NCERT New Delhi',
      price: 180
    },
    {
      id: 'BK-002',
      isbn: '978-81-7450-655-9',
      title: 'Science & Technology (Physics, Chem, Bio)',
      author: 'Dr. S. K. Jain & NCERT Panel',
      category: 'Science',
      rack_no: 'Rack S-02 / Shelf 1',
      total_copies: 40,
      available_copies: 31,
      publisher: 'NCERT New Delhi',
      price: 210
    },
    {
      id: 'BK-003',
      isbn: '978-93-8946-123-4',
      title: 'A Brief History of Time & Cosmos',
      author: 'Stephen Hawking',
      category: 'General Science',
      rack_no: 'Rack G-05 / Shelf 4',
      total_copies: 12,
      available_copies: 9,
      publisher: 'Bantam Books',
      price: 499
    },
    {
      id: 'BK-004',
      isbn: '978-93-5144-880-9',
      title: 'Wings of Fire: An Autobiography',
      author: 'Dr. A. P. J. Abdul Kalam',
      category: 'Biography',
      rack_no: 'Rack B-01 / Shelf 2',
      total_copies: 20,
      available_copies: 14,
      publisher: 'Universities Press',
      price: 350
    },
    {
      id: 'BK-005',
      isbn: '978-81-2501-923-1',
      title: 'Gitanjali (Song Offerings)',
      author: 'Rabindranath Tagore',
      category: 'Literature',
      rack_no: 'Rack L-03 / Shelf 5',
      total_copies: 15,
      available_copies: 13,
      publisher: 'Macmillan Publishers',
      price: 240
    },
    {
      id: 'BK-006',
      isbn: '978-93-5253-112-8',
      title: 'Computer Applications with Python',
      author: 'Sumita Arora',
      category: 'Computer Science',
      rack_no: 'Rack CS-02 / Shelf 2',
      total_copies: 30,
      available_copies: 22,
      publisher: 'Dhanpat Rai & Co.',
      price: 520
    }
  ]);

  // Initial Seed Circulation Records
  const [circulations, setCirculations] = useState<BookCirculationRecord[]>([
    {
      id: 'CIRC-01',
      book_id: 'BK-001',
      book_title: 'Mathematics Class 10 (NCERT Standard)',
      isbn: '978-81-7450-488-3',
      student_id: students[0]?.id || 'STU-01',
      student_name: students[0]?.full_name || 'Aarav Sharma',
      class_name: students[0]?.class_name || 'Class 10',
      section: students[0]?.section || 'A',
      issue_date: '2026-08-15',
      due_date: '2026-08-29',
      fine_amount: 15,
      status: 'OVERDUE'
    },
    {
      id: 'CIRC-02',
      book_id: 'BK-004',
      book_title: 'Wings of Fire: An Autobiography',
      isbn: '978-93-5144-880-9',
      student_id: students[1]?.id || 'STU-02',
      student_name: students[1]?.full_name || 'Priya Verma',
      class_name: students[1]?.class_name || 'Class 9',
      section: students[1]?.section || 'B',
      issue_date: '2026-08-22',
      due_date: '2026-09-05',
      fine_amount: 0,
      status: 'ISSUED'
    }
  ]);

  // Unique Categories
  const categories = useMemo(() => {
    const set = new Set(books.map(b => b.category));
    return ['ALL', ...Array.from(set)];
  }, [books]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.rack_no.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [books, selectedCategory, searchQuery]);

  // KPIs
  const totalTitles = books.length;
  const totalVolumeCopies = books.reduce((acc, b) => acc + b.total_copies, 0);
  const totalIssued = circulations.filter(c => c.status === 'ISSUED' || c.status === 'OVERDUE').length;
  const totalOverdue = circulations.filter(c => c.status === 'OVERDUE').length;
  const totalFinePending = circulations
    .filter(c => c.status === 'OVERDUE')
    .reduce((acc, c) => acc + c.fine_amount, 0);

  // Handle Add Book
  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    const newBook: BookItem = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      isbn: newBookIsbn,
      title: newBookTitle,
      author: newBookAuthor,
      category: newBookCategory,
      rack_no: newBookRack,
      total_copies: Number(newBookCopies),
      available_copies: Number(newBookCopies),
      publisher: 'CBSE Approved Publication',
      price: Number(newBookPrice)
    };

    setBooks(prev => [newBook, ...prev]);
    setShowAddBookModal(false);
    if (showAdminToast) showAdminToast(`"${newBookTitle}" added to Library Catalog!`);
  };

  // Handle Issue Book
  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === issueStudentId) || students[0];
    const bk = books.find(b => b.id === (issueBookId || books[0]?.id));

    if (!st || !bk) return;
    if (bk.available_copies <= 0) {
      alert('All copies of this title are currently issued!');
      return;
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const newRecord: BookCirculationRecord = {
      id: `CIRC-${Date.now().toString().slice(-4)}`,
      book_id: bk.id,
      book_title: bk.title,
      isbn: bk.isbn,
      student_id: st.id,
      student_name: st.full_name,
      class_name: st.class_name,
      section: st.section || 'A',
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      fine_amount: 0,
      status: 'ISSUED'
    };

    setCirculations(prev => [newRecord, ...prev]);
    setBooks(prev =>
      prev.map(b => (b.id === bk.id ? { ...b, available_copies: b.available_copies - 1 } : b))
    );

    setShowIssueModal(false);
    if (showAdminToast) showAdminToast(`Book issued to ${st.full_name} (Due: ${dueDate.toLocaleDateString()})`);
  };

  // Handle Return Book
  const handleReturnBook = (circId: string) => {
    const circ = circulations.find(c => c.id === circId);
    if (!circ) return;

    setCirculations(prev =>
      prev.map(c =>
        c.id === circId
          ? {
              ...c,
              status: 'RETURNED',
              return_date: new Date().toISOString().split('T')[0]
            }
          : c
      )
    );

    setBooks(prev =>
      prev.map(b => (b.id === circ.book_id ? { ...b, available_copies: b.available_copies + 1 } : b))
    );

    if (showAdminToast) showAdminToast(`"${circ.book_title}" marked RETURNED successfully.`);
  };

  // Handle WhatsApp Overdue Reminder
  const handleSendWhatsAppOverdue = (circ: BookCirculationRecord) => {
    const st = students.find(s => s.id === circ.student_id);
    const phone = st?.parent_phone || st?.phone || '';
    const text =
      `📚 *LIBRARY OVERDUE NOTICE — ${selectedSchool?.school_name?.toUpperCase() || 'DELHI PUBLIC SCHOOL'}*\n\n` +
      `Dear Parent,\n\n` +
      `This is to inform that the library book borrowed by your ward:\n` +
      `👤 *Scholar:* ${circ.student_name} (${circ.class_name} - ${circ.section})\n` +
      `📖 *Book Title:* ${circ.book_title}\n` +
      `📅 *Issued On:* ${circ.issue_date}\n` +
      `⚠️ *Scheduled Due Date:* ${circ.due_date}\n` +
      `💰 *Accrued Overdue Fine:* ₹${circ.fine_amount} (₹5/day)\n\n` +
      `Kindly instruct your ward to return the book to the Central Library tomorrow to prevent escalation of overdue charges.\n\n` +
      `_Librarian Desk, ${selectedSchool?.school_name || 'Delhi Public School'}_`;

    openWhatsAppDirect(phone, text);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Action Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
            <BookOpen className="w-6 h-6 text-emerald-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#122A24]">
                Digital Library &amp; Circulation Desk
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                CBSE ACCREDITED
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E]">
              Barcode tracking, 14-day circulation cycles, automated ₹5/day overdue fine calculation &amp; WhatsApp reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPrintRegister(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Register</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <span>Issue Book</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddBookModal(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Total Catalog Titles</span>
          <div className="text-2xl font-display font-black text-[#122A24] mt-1">
            {totalTitles}{' '}
            <span className="text-xs font-mono font-normal text-slate-500">({totalVolumeCopies} copies)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">In Active Circulation</span>
          <div className="text-2xl font-display font-black text-emerald-800 mt-1">
            {totalIssued}{' '}
            <span className="text-xs font-mono font-normal text-slate-500">Issued Books</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Overdue Books</span>
          <div className="text-2xl font-display font-black text-rose-700 mt-1">
            {totalOverdue}{' '}
            <span className="text-xs font-mono font-normal text-rose-500">Exceeded 14 Days</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-2xs">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block">Pending Late Fines</span>
          <div className="text-2xl font-display font-black text-amber-700 mt-1 font-mono">
            ₹{totalFinePending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Catalog vs Active Circulation vs Return History */}
      <div className="flex items-center gap-2 border-b border-[#DCE8E0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'catalog'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          📖 Book Catalog Repository ({filteredBooks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('circulation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'circulation'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🔄 Active Borrowers &amp; Returns ({circulations.filter(c => c.status !== 'RETURNED').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            activeTab === 'history'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          📜 Archive / Return Ledger
        </button>
      </div>

      {/* TAB 1: BOOK CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, author, barcode or ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-emerald-600 font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                    <th className="py-3 px-4">BOOK IDENTIFIER &amp; TITLE</th>
                    <th className="py-3 px-4">AUTHOR &amp; PUBLISHER</th>
                    <th className="py-3 px-4">CATEGORY &amp; RACK LOCATION</th>
                    <th className="py-3 px-4 text-center">AVAILABILITY</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF2ED]">
                  {filteredBooks.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122A24] text-xs flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{b.title}</span>
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>ISBN: {b.isbn}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{b.author}</div>
                        <div className="text-[10.5px] text-slate-500">{b.publisher || 'NCERT/CBSE'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {b.category}
                        </span>
                        <div className="text-[10.5px] font-mono text-[#2D5A4E] mt-1 font-semibold">{b.rack_no}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-bold text-xs text-[#122A24]">
                          {b.available_copies} / {b.total_copies}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            b.available_copies > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {b.available_copies > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setIssueBookId(b.id);
                            setShowIssueModal(true);
                          }}
                          disabled={b.available_copies <= 0}
                          className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors border-none cursor-pointer disabled:opacity-40"
                        >
                          Issue
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE CIRCULATION */}
      {activeTab === 'circulation' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                  <th className="py-3 px-4">BORROWER SCHOLAR</th>
                  <th className="py-3 px-4">BOOK DETAILS</th>
                  <th className="py-3 px-4 text-center">ISSUE &amp; DUE DATE</th>
                  <th className="py-3 px-4 text-center">STATUS &amp; FINE</th>
                  <th className="py-3 px-4 text-right">DESK ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF2ED]">
                {circulations
                  .filter(c => c.status !== 'RETURNED')
                  .map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#122A24] text-xs">{c.student_name}</div>
                        <div className="text-[10.5px] font-mono text-slate-500">
                          {c.class_name} (Sec {c.section}) • ID: {c.student_id}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.book_title}</div>
                        <div className="text-[10.5px] font-mono text-slate-400">ISBN: {c.isbn}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <div>Issued: {c.issue_date}</div>
                        <div className="text-rose-700 font-bold">Due: {c.due_date}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {c.status === 'OVERDUE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> OVERDUE (Fine: ₹{c.fine_amount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ON TIME
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'OVERDUE' && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppOverdue(c)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Send WhatsApp Overdue Notice to Guardian"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Notice</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleReturnBook(c.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs transition-colors border-none cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>Return</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RETURN ARCHIVE LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-xs text-[#122A24] uppercase font-mono">
              Archived Book Returns &amp; Audit Log
            </span>
          </div>

          <div className="space-y-2">
            {circulations
              .filter(c => c.status === 'RETURNED')
              .map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-bold text-[#122A24]">{c.book_title}</span>
                    <span className="text-slate-500 font-mono text-[11px] block">
                      Returned by {c.student_name} ({c.class_name}) on {c.return_date || 'Today'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10.5px] font-bold">
                    ✓ Returned &amp; Stock Restored
                  </span>
                </div>
              ))}
            {circulations.filter(c => c.status === 'RETURNED').length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-mono">
                No returned books archived in current session yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW BOOK */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[#122A24]">Add New Library Title</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBookModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={e => setNewBookTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={newBookAuthor}
                    onChange={e => setNewBookAuthor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ISBN / Barcode</label>
                  <input
                    type="text"
                    value={newBookIsbn}
                    onChange={e => setNewBookIsbn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newBookCategory}
                    onChange={e => setNewBookCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack / Shelf No</label>
                  <input
                    type="text"
                    value={newBookRack}
                    onChange={e => setNewBookRack(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={newBookCopies}
                    onChange={e => setNewBookCopies(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Book Price (₹)</label>
                  <input
                    type="number"
                    value={newBookPrice}
                    onChange={e => setNewBookPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold rounded-xl shadow-xs border-none cursor-pointer"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE BOOK DESK */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[#122A24]">Issue Book to Scholar</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-3.5 text-xs">
              {/* Class & Section Filter Docket */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-[#122A24] uppercase font-mono block">
                  1. Filter Roster By Class &amp; Section
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">Class</label>
                    <select
                      value={issueFilterClass}
                      onChange={e => setIssueFilterClass(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white focus:outline-emerald-600"
                    >
                      <option value="ALL">All Classes ({availableClasses.length})</option>
                      {availableClasses.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">Section</label>
                    <select
                      value={issueFilterSection}
                      onChange={e => setIssueFilterSection(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white focus:outline-emerald-600"
                    >
                      <option value="ALL">All Sections</option>
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search scholar name or admission no..."
                    value={issueScholarSearch}
                    onChange={e => setIssueScholarSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-emerald-600 font-sans"
                  />
                </div>
              </div>

              {/* Scholar Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Select Scholar *</label>
                  <span className="text-[10.5px] font-mono text-emerald-800 font-bold">
                    {filteredIssueStudents.length} Scholars Listed
                  </span>
                </div>
                <select
                  value={issueStudentId}
                  onChange={e => setIssueStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  {filteredIssueStudents.length === 0 && (
                    <option value="">No scholars found matching filter</option>
                  )}
                  {filteredIssueStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} — {st.class_name} (Section {st.section || 'A'} • Adm: {st.admission_no || st.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Book Title *</label>
                <select
                  value={issueBookId || books[0]?.id}
                  onChange={e => setIssueBookId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-emerald-600 bg-white"
                >
                  {books.map(bk => (
                    <option key={bk.id} value={bk.id} disabled={bk.available_copies <= 0}>
                      {bk.title} ({bk.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-mono">
                Standard Circulation Period: <strong>14 Days</strong>.<br />
                Overdue fine of <strong>₹5 per day</strong> applies automatically after due date.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold rounded-xl shadow-xs border-none cursor-pointer"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CIRCULATION REGISTER MODAL */}
      {showPrintRegister && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="font-bold text-sm text-[#122A24]">Official Library Register</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#122A24] text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 inline mr-1" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintRegister(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-5 rounded-2xl space-y-4 font-serif text-slate-800">
              <div className="text-center border-b pb-3 space-y-1">
                <h2 className="font-black text-xl uppercase tracking-wider text-[#122A24]">
                  {selectedSchool?.school_name || 'DELHI PUBLIC SCHOOL'}
                </h2>
                <div className="text-xs font-mono text-slate-500">
                  CENTRAL LIBRARY &amp; RESOURCE CENTER • CIRCULATION REGISTER
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Academic Session: {selectedSession} • Generated: {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold">
                    <th className="p-2">SCHOLAR</th>
                    <th className="p-2">TITLE</th>
                    <th className="p-2 text-center">ISSUE DATE</th>
                    <th className="p-2 text-center">DUE DATE</th>
                    <th className="p-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                  {circulations.map(c => (
                    <tr key={c.id}>
                      <td className="p-2 font-sans font-semibold">
                        {c.student_name} ({c.class_name})
                      </td>
                      <td className="p-2 font-sans">{c.book_title}</td>
                      <td className="p-2 text-center">{c.issue_date}</td>
                      <td className="p-2 text-center">{c.due_date}</td>
                      <td className="p-2 text-center font-bold">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-8 grid grid-cols-2 gap-4 text-center text-xs font-sans border-t border-slate-200">
                <div>
                  <div className="h-8"></div>
                  <div className="border-t border-slate-300 pt-1 font-bold">Librarian Signature</div>
                </div>
                <div>
                  <div className="h-8"></div>
                  <div className="border-t border-slate-300 pt-1 font-bold">Principal / Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
