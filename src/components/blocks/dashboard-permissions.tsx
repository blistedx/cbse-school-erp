/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Eye,
  Edit,
  PlusCircle,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Lock,
  Layers,
  CalendarCheck,
  Coins,
  Award,
  BookOpen,
  Bus,
  FileText,
  Radio,
  Bell,
  HeartHandshake,
  FolderDown,
  ChevronRight,
  Sliders,
  Check,
  Search,
  CheckCheck,
  XCircle,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { ManagedRole, ModulePermission, RolePermissionMatrix, DEFAULT_ROLE_PERMISSIONS } from '@/lib/types';

interface DashboardPermissionsProps {
  initialPermissions?: RolePermissionMatrix;
  schoolId?: string;
  onSavePermissions?: (updated: RolePermissionMatrix) => Promise<void> | void;
  onPreviewRole?: (role: string) => void;
  showToast?: (msg: string) => void;
}

interface ModuleDefinition {
  id: string;
  name: string;
  category: 'Academics' | 'Administrative' | 'Operations' | 'Communication';
  icon: any;
  description: string;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'students',
    name: 'Students SIS & Admissions',
    category: 'Academics',
    icon: GraduationCap,
    description: 'Scholar dossiers, admission demographics, enrollment profiles & roll lists'
  },
  {
    id: 'siblings',
    name: 'Siblings & Families',
    category: 'Academics',
    icon: HeartHandshake,
    description: 'Household linkages, emergency contacts, parent linkage & family groupings'
  },
  {
    id: 'teachers',
    name: 'Faculty & Staff Registry',
    category: 'Administrative',
    icon: Users,
    description: 'Teacher staff directory, subject assignments, department allocations'
  },
  {
    id: 'classes',
    name: 'Classes & Sections',
    category: 'Academics',
    icon: Layers,
    description: 'Class rosters, section capacities, class teacher designations & timetables'
  },
  {
    id: 'subjects',
    name: 'Subjects & Curriculum',
    category: 'Academics',
    icon: BookOpen,
    description: 'CBSE subject codes, theory/practical breakdown & syllabus tracking'
  },
  {
    id: 'attendance',
    name: 'Daily Attendance Register',
    category: 'Academics',
    icon: CalendarCheck,
    description: 'Daily roll-call tracking, biometric sync, leave remark entries'
  },
  {
    id: 'exams',
    name: 'CBSE Exams & Broadsheets',
    category: 'Academics',
    icon: Award,
    description: 'Assessment scoring, periodic test marks, term report cards & broadsheets'
  },
  {
    id: 'fees',
    name: 'Fee Management & Ledgers',
    category: 'Administrative',
    icon: Coins,
    description: 'Fee collection invoices, online dues payment, payment receipts & discounts'
  },
  {
    id: 'homework',
    name: 'Homework & Digital Diary',
    category: 'Academics',
    icon: FileText,
    description: 'Daily subject assignments, submission portal, teacher reviews & remarks'
  },
  {
    id: 'approvals',
    name: 'Leave & Gate Approvals',
    category: 'Operations',
    icon: CheckCircle2,
    description: 'Student leave applications, gate passes, medical excuses & administrative approvals'
  },
  {
    id: 'notices',
    name: 'Notice Board & Circulars',
    category: 'Communication',
    icon: Bell,
    description: 'School circulars, event announcements, holiday notices & official bulletins'
  },
  {
    id: 'broadcast',
    name: 'Emergency Broadcast',
    category: 'Communication',
    icon: Radio,
    description: 'Urgent SMS / notification push to parents & staff for campus advisories'
  },
  {
    id: 'transport',
    name: 'Transport & GPS Fleet',
    category: 'Operations',
    icon: Bus,
    description: 'Bus route stops, live transit tracking, driver emergency contact numbers'
  },
  {
    id: 'reports',
    name: 'Reports & Dossiers',
    category: 'Administrative',
    icon: FileText,
    description: 'CBSE performance dossiers, attendance trends, cohort analytics'
  },
  {
    id: 'data_hub',
    name: 'Data Hub',
    category: 'Operations',
    icon: FolderDown,
    description: 'Comprehensive dataset export, system backup, and bulk ingestion center'
  }
];

export function DashboardPermissions({
  initialPermissions = DEFAULT_ROLE_PERMISSIONS,
  schoolId = 'DPS2026',
  onSavePermissions,
  onPreviewRole,
  showToast
}: DashboardPermissionsProps) {
  const [selectedRole, setSelectedRole] = useState<ManagedRole>('TEACHER');
  const [permissions, setPermissions] = useState<RolePermissionMatrix>(initialPermissions);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Academics' | 'Administrative' | 'Operations' | 'Communication'>('All');

  // Toggle individual permission flag
  const togglePermission = (role: ManagedRole, moduleId: string, field: keyof ModulePermission) => {
    setPermissions(prev => {
      const currentRolePerms = prev[role] || {};
      const currentModPerms: ModulePermission = currentRolePerms[moduleId] || {
        can_view: false,
        can_edit: false,
        can_add: false,
        can_delete: false
      };

      const updatedModPerms: ModulePermission = {
        ...currentModPerms,
        [field]: !currentModPerms[field]
      };

      // If can_view is toggled off, editing/adding/deleting also turn off
      if (field === 'can_view' && !updatedModPerms.can_view) {
        updatedModPerms.can_edit = false;
        updatedModPerms.can_add = false;
        updatedModPerms.can_delete = false;
      }

      // If can_edit, can_add, or can_delete is toggled on, can_view must be on
      if (field !== 'can_view' && updatedModPerms[field]) {
        updatedModPerms.can_view = true;
      }

      return {
        ...prev,
        [role]: {
          ...currentRolePerms,
          [moduleId]: updatedModPerms
        }
      };
    });
    setSavedSuccess(false);
  };

  // Quick preset templates
  const applyPreset = (presetType: 'strict' | 'standard' | 'collaborative' | 'full' | 'hide') => {
    setPermissions(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const role = selectedRole;

      if (presetType === 'strict') {
        // Read-only for this role: keep current view, disable edit/add/delete
        MODULE_DEFINITIONS.forEach(mod => {
          const current = updated[role]?.[mod.id] || { can_view: false, can_edit: false, can_add: false, can_delete: false };
          updated[role][mod.id] = {
            can_view: current.can_view,
            can_edit: false,
            can_add: false,
            can_delete: false
          };
        });
      } else if (presetType === 'standard') {
        // Reset to default standard
        updated[role] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]));
      } else if (presetType === 'collaborative') {
        // Grant broader view & edit rights
        MODULE_DEFINITIONS.forEach(mod => {
          const isAcademic = ['students', 'classes', 'subjects', 'attendance', 'exams', 'homework', 'approvals', 'notices'].includes(mod.id);
          if (role === 'TEACHER') {
            updated[role][mod.id] = {
              can_view: true,
              can_edit: isAcademic,
              can_add: isAcademic,
              can_delete: ['homework', 'notices'].includes(mod.id)
            };
          } else if (role === 'PARENT') {
            const isParentMod = ['siblings', 'attendance', 'fees', 'exams', 'homework', 'approvals', 'notices', 'broadcast'].includes(mod.id);
            updated[role][mod.id] = {
              can_view: isParentMod,
              can_edit: ['siblings', 'approvals', 'fees'].includes(mod.id),
              can_add: ['approvals', 'fees'].includes(mod.id),
              can_delete: false
            };
          } else if (role === 'STUDENT') {
            const isStudentMod = ['attendance', 'exams', 'homework', 'fees', 'notices'].includes(mod.id);
            updated[role][mod.id] = {
              can_view: isStudentMod,
              can_edit: mod.id === 'homework',
              can_add: mod.id === 'homework',
              can_delete: false
            };
          }
        });
      } else if (presetType === 'full') {
        // Grant all permissions for currently filtered or all modules
        MODULE_DEFINITIONS.forEach(mod => {
          updated[role][mod.id] = { can_view: true, can_edit: true, can_add: true, can_delete: true };
        });
      } else if (presetType === 'hide') {
        // Revoke all permissions
        MODULE_DEFINITIONS.forEach(mod => {
          updated[role][mod.id] = { can_view: false, can_edit: false, can_add: false, can_delete: false };
        });
      }

      return updated;
    });

    if (showToast) {
      const labels: Record<string, string> = {
        strict: 'Strict Read-Only',
        standard: 'Standard CBSE Default',
        collaborative: 'Collaborative Access',
        full: 'Full Access (All Modules)',
        hide: 'All Modules Restricted'
      };
      showToast(`Applied ${labels[presetType]} preset for ${selectedRole}`);
    }
  };

  // Quick module toggle helpers
  const setModuleAccessLevel = (role: ManagedRole, moduleId: string, level: 'hide' | 'view_only' | 'full') => {
    setPermissions(prev => {
      const currentRolePerms = prev[role] || {};
      let updatedModPerms: ModulePermission;

      if (level === 'hide') {
        updatedModPerms = { can_view: false, can_edit: false, can_add: false, can_delete: false };
      } else if (level === 'view_only') {
        updatedModPerms = { can_view: true, can_edit: false, can_add: false, can_delete: false };
      } else {
        updatedModPerms = { can_view: true, can_edit: true, can_add: true, can_delete: true };
      }

      return {
        ...prev,
        [role]: {
          ...currentRolePerms,
          [moduleId]: updatedModPerms
        }
      };
    });
    setSavedSuccess(false);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSavePermissions) {
        await onSavePermissions(permissions);
      } else {
        const res = await fetch('/api/school/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_id: schoolId,
            permissions
          })
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to save permissions');
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('giterp_role_permissions', JSON.stringify(permissions));
      }

      setSavedSuccess(true);
      if (showToast) {
        showToast('Role permissions updated successfully across all school modules!');
      }
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      if (showToast) {
        showToast(`Save error: ${e.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const currentRolePerms = permissions[selectedRole] || {};

  // Compute live stats for current role
  const roleStats = useMemo(() => {
    let viewCount = 0;
    let editCount = 0;
    let addCount = 0;
    let deleteCount = 0;

    MODULE_DEFINITIONS.forEach(mod => {
      const p = currentRolePerms[mod.id];
      if (p?.can_view) viewCount++;
      if (p?.can_edit) editCount++;
      if (p?.can_add) addCount++;
      if (p?.can_delete) deleteCount++;
    });

    return { viewCount, editCount, addCount, deleteCount, total: MODULE_DEFINITIONS.length };
  }, [currentRolePerms]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return MODULE_DEFINITIONS.filter(mod => {
      const matchesCategory = categoryFilter === 'All' || mod.category === categoryFilter;
      const matchesSearch = !searchQuery.trim() || 
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Role metadata definition
  const ROLES_LIST = [
    {
      id: 'TEACHER' as ManagedRole,
      title: 'Faculty & Teachers',
      badge: 'Staff',
      icon: GraduationCap,
      description: 'Instructors, class mentors & academic staff',
      activeColor: 'bg-[#122A24] text-white border-[#122A24]'
    },
    {
      id: 'STUDENT' as ManagedRole,
      title: 'Enrolled Students',
      badge: 'Learner',
      icon: Users,
      description: 'Pupils accessing diary, attendance & exams',
      activeColor: 'bg-[#122A24] text-white border-[#122A24]'
    },
    {
      id: 'PARENT' as ManagedRole,
      title: 'Parents & Guardians',
      badge: 'Family',
      icon: HeartHandshake,
      description: 'Family accounts managing fees, leave & reports',
      activeColor: 'bg-[#122A24] text-white border-[#122A24]'
    }
  ];

  return (
    <div className="space-y-6 text-[#122A24]">
      {/* ─────────────────────────────────────────────────────────────
          1. Header Banner — Premium, Clear, Non-Colliding Design
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative shield glow in background (non-intrusive) */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.035] text-[#122A24]"
        >
          <ShieldCheck className="w-64 h-64" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-[#EBF5EF] border border-[#C5E2CF] flex items-center justify-center text-[#1C443A] shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                Role Permissions &amp; Access Controls
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF] flex items-center gap-1">
                <span>⚡</span> Admin Authority
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#2D5A4E] max-w-3xl leading-relaxed">
              Define granular privileges for what <strong>Teachers</strong>, <strong>Students</strong>, and <strong>Parents</strong> can <strong>View</strong> (See), <strong>Edit &amp; Modify</strong>, <strong>Add/Create</strong>, and <strong>Delete</strong> across all 15 institutional modules.
            </p>
          </div>

          {/* Header Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer border-none disabled:opacity-50 group"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                  <span>Save Role Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {savedSuccess && (
        <div className="p-4 bg-[#EBF5EF] border border-[#C5E2CF] text-[#1C443A] text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
            <span>Role-Based Access Control matrix updated. Changes take immediate effect for all active school sessions.</span>
          </div>
          <span className="text-[10px] font-mono bg-white px-2.5 py-1 rounded-md border border-[#C5E2CF] font-bold text-[#1C443A]">
            LIVE SYNCED
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. Segmented Role Selector Cards (Grid, No Horiz Overflow)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ROLES_LIST.map(roleItem => {
          const Icon = roleItem.icon;
          const isSelected = selectedRole === roleItem.id;
          
          // Count viewable modules for this specific role
          const viewCount = MODULE_DEFINITIONS.filter(
            m => permissions[roleItem.id]?.[m.id]?.can_view
          ).length;

          return (
            <button
              key={roleItem.id}
              type="button"
              onClick={() => setSelectedRole(roleItem.id)}
              className={`p-4 rounded-2xl text-left transition-all border cursor-pointer relative flex items-center gap-3.5 ${
                isSelected
                  ? 'bg-[#122A24] text-white border-[#122A24] shadow-md ring-2 ring-[#122A24]/10'
                  : 'bg-white hover:bg-[#F9FCFA] text-[#122A24] border-[#DCE8E0] hover:border-[#C5E2CF]'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                isSelected
                  ? 'bg-white/10 border-white/20 text-emerald-300'
                  : 'bg-[#EBF5EF] border-[#C5E2CF] text-[#1C443A]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-display font-bold text-sm tracking-tight truncate">
                    {roleItem.title}
                  </span>
                  <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {roleItem.badge}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 truncate ${
                  isSelected ? 'text-emerald-100/80' : 'text-slate-500'
                }`}>
                  {viewCount} of 15 modules visible
                </p>
              </div>

              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 absolute top-3 right-3 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Presets & Simulator Toolbar (Dedicated Clean Row)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE8E0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Role summary badge + active metrics */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
            {selectedRole} PRIVILEGES:
          </span>
          <div className="flex items-center gap-1.5 bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#DCE8E0] font-mono text-[11px] font-bold text-blue-700">
            <Eye className="w-3.5 h-3.5" />
            <span>{roleStats.viewCount} Visible</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#DCE8E0] font-mono text-[11px] font-bold text-amber-700">
            <Edit className="w-3.5 h-3.5" />
            <span>{roleStats.editCount} Edit</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#DCE8E0] font-mono text-[11px] font-bold text-emerald-700">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{roleStats.addCount} Add</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F4F8F5] px-2.5 py-1 rounded-xl border border-[#DCE8E0] font-mono text-[11px] font-bold text-rose-700">
            <Trash2 className="w-3.5 h-3.5" />
            <span>{roleStats.deleteCount} Delete</span>
          </div>
        </div>

        {/* Right: Presets & Simulation CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase hidden sm:inline">
            Presets:
          </span>

          {/* Strict Read-Only */}
          <button
            type="button"
            onClick={() => applyPreset('strict')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Keep module visibility but set all edit, add, and delete flags to off"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Strict Read-Only</span>
          </button>

          {/* Standard CBSE */}
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Reset to recommended CBSE role defaults"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Standard CBSE</span>
          </button>

          {/* Collaborative */}
          <button
            type="button"
            onClick={() => applyPreset('collaborative')}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Grant broader edit and contribution permissions"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Collaborative</span>
          </button>

          {/* Preview Role Simulator */}
          {onPreviewRole && (
            <button
              type="button"
              onClick={() => onPreviewRole(selectedRole)}
              className="px-3 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ml-auto sm:ml-0"
              title={`Switch active ERP session to preview as ${selectedRole}`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-300" />
              <span>Preview as {selectedRole}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Permission Matrix Grid with Search & Category Filters
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
        {/* Table / Grid Controls Header */}
        <div className="p-4 sm:p-5 bg-[#F9FCFA] border-b border-[#E8F0EA] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
              <span>{selectedRole} Access &amp; Modification Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle granular permissions below for each institutional module.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono font-bold text-[#1C443A] bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] self-start md:self-auto">
            <span className="flex items-center gap-1 text-blue-700">
              <Eye className="w-3.5 h-3.5" /> See (View)
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <Edit className="w-3.5 h-3.5" /> Edit
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <PlusCircle className="w-3.5 h-3.5" /> Add
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </span>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E8F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(['All', 'Academics', 'Administrative', 'Operations', 'Communication'] as const).map(cat => {
              const count = cat === 'All' 
                ? MODULE_DEFINITIONS.length 
                : MODULE_DEFINITIONS.filter(m => m.category === cat).length;
              const isCatActive = categoryFilter === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    isCatActive
                      ? 'bg-[#122A24] text-white border-[#122A24]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isCatActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search module..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F9FCFA] border border-[#DCE8E0] text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#122A24] focus:border-[#122A24]"
            />
          </div>
        </div>

        {/* Modules List */}
        <div className="divide-y divide-[#E8F0EA]">
          {filteredModules.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No modules match the filter &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredModules.map(mod => {
              const Icon = mod.icon;
              const modPerm = currentRolePerms[mod.id] || {
                can_view: false,
                can_edit: false,
                can_add: false,
                can_delete: false
              };

              const isFullyRestricted = !modPerm.can_view && !modPerm.can_edit && !modPerm.can_add && !modPerm.can_delete;
              const isFullAccess = modPerm.can_view && modPerm.can_edit && modPerm.can_add && modPerm.can_delete;
              const isViewOnly = modPerm.can_view && !modPerm.can_edit && !modPerm.can_add && !modPerm.can_delete;

              return (
                <div
                  key={mod.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    modPerm.can_view ? 'bg-white hover:bg-[#F9FCFA]' : 'bg-slate-50/60'
                  }`}
                >
                  {/* Module Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-transform ${
                      modPerm.can_view
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-[#122A24]">
                          {mod.name}
                        </h4>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                          {mod.category}
                        </span>

                        {/* Status Badge */}
                        {isFullyRestricted ? (
                          <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Hidden
                          </span>
                        ) : isFullAccess ? (
                          <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Full Access
                          </span>
                        ) : isViewOnly ? (
                          <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            View Only
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Custom
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Right side: 4 Granular Control Toggles + Quick Row Shortcut */}
                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto flex-wrap sm:flex-nowrap">
                    {/* 4 Permission Buttons in a Clean Card */}
                    <div className="flex items-center gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0]">
                      {/* 1. Can View / See */}
                      <button
                        type="button"
                        onClick={() => togglePermission(selectedRole, mod.id, 'can_view')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          modPerm.can_view
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                        title={modPerm.can_view ? 'Visible in Navigation (Click to Hide)' : 'Hidden from Navigation (Click to Show)'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>See</span>
                        {modPerm.can_view && <Check className="w-3 h-3 text-white ml-0.5" />}
                      </button>

                      {/* 2. Can Edit / Modify */}
                      <button
                        type="button"
                        onClick={() => togglePermission(selectedRole, mod.id, 'can_edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          modPerm.can_edit
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                        title={modPerm.can_edit ? 'Can Modify Records (Click to Lock)' : 'Cannot Modify Records (Click to Allow)'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                        {modPerm.can_edit && <Check className="w-3 h-3 text-white ml-0.5" />}
                      </button>

                      {/* 3. Can Add / Create */}
                      <button
                        type="button"
                        onClick={() => togglePermission(selectedRole, mod.id, 'can_add')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          modPerm.can_add
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                        title={modPerm.can_add ? 'Can Create New Entries (Click to Block)' : 'Cannot Create Entries (Click to Allow)'}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add</span>
                        {modPerm.can_add && <Check className="w-3 h-3 text-white ml-0.5" />}
                      </button>

                      {/* 4. Can Delete */}
                      <button
                        type="button"
                        onClick={() => togglePermission(selectedRole, mod.id, 'can_delete')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          modPerm.can_delete
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                        title={modPerm.can_delete ? 'Can Delete Records (Click to Restrict)' : 'Deletion Forbidden (Click to Allow)'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                        {modPerm.can_delete && <Check className="w-3 h-3 text-white ml-0.5" />}
                      </button>
                    </div>

                    {/* Quick Row Shortcut */}
                    <div className="flex items-center gap-1">
                      {isFullyRestricted ? (
                        <button
                          type="button"
                          onClick={() => setModuleAccessLevel(selectedRole, mod.id, 'view_only')}
                          className="px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                          title="Quick allow View"
                        >
                          Allow View
                        </button>
                      ) : isFullAccess ? (
                        <button
                          type="button"
                          onClick={() => setModuleAccessLevel(selectedRole, mod.id, 'hide')}
                          className="px-2 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                          title="Quick restrict all"
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModuleAccessLevel(selectedRole, mod.id, 'full')}
                          className="px-2 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                          title="Quick allow Full Access"
                        >
                          Grant All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. Footer Bar with Save & Reset Actions
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-[#F9FCFA] border-t border-[#E8F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Changes take immediate effect upon saving &amp; synchronize with school database.</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => applyPreset('standard')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Apply &amp; Save Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
