/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PrincipalSidebar } from '@/components/principal/principal-sidebar';
import { SchoolSessionHeader } from '@/components/common/school-session-header';

export default function PrincipalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [schoolName, setSchoolName] = useState<string>('Delhi Public School');
  const [principalName, setPrincipalName] = useState<string>('Abhishek Shukla');
  const [principalAvatar, setPrincipalAvatar] = useState<string>('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Client-Side Route Guard
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('current_user');
      const token = localStorage.getItem('erp_session_token');

      if (!storedUser && !token) {
        router.push('/login');
        return;
      }

      let parsedUser: any = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (_) {}
      }

      const role = (parsedUser?.role || parsedUser?.login_role || '').toUpperCase();
      const isAllowed = ['PRINCIPAL', 'SUPERADMIN', 'AGENCY_SUPERADMIN', 'GOD_ACCESS'].includes(role);

      if (!isAllowed) {
        router.push('/login?error=principal_required');
        return;
      }

      if (parsedUser?.full_name) {
        setPrincipalName(parsedUser.full_name);
      }

      const storedSchool = localStorage.getItem('current_school');
      let parsedSchool: any = null;
      if (storedSchool) {
        try {
          parsedSchool = JSON.parse(storedSchool);
          if (parsedSchool?.name || parsedSchool?.school_name) setSchoolName(parsedSchool.name || parsedSchool.school_name);
        } catch (_) {}
      }

      const avatar = parsedUser?.photo || parsedUser?.avatar || parsedSchool?.principal_avatar;
      if (avatar) {
        setPrincipalAvatar(avatar);
      }

      setIsAuthorized(true);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Fetch pending approvals count for sidebar badge
  const fetchPendingBadge = async () => {
    try {
      const res = await fetch('/api/principal/approvals?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.counts) {
          setPendingApprovalsCount(data.counts.pending || 0);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchPendingBadge();
    }
  }, [isAuthorized]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingBadge();
    // Dispatch a custom event so child page can reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('principal:refresh'));
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#F4F8F5] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#122A24] border border-[#1C443A] flex items-center justify-center text-emerald-400 font-bold shadow-lg animate-pulse">
          DPS
        </div>
        <div className="text-xs font-mono text-[#2D5A4E] mt-3">
          Verifying Principal Executive Credentials...
        </div>
      </div>
    );
  }

  const getBreadcrumbTitle = () => {
    if (pathname === '/principal') return 'Executive Overview';
    if (pathname.includes('/approvals')) return 'Statutory Approvals';
    if (pathname.includes('/students')) return 'Scholars Directory';
    if (pathname.includes('/faculty')) return 'Faculty & Staff Roster';
    if (pathname.includes('/reports')) return 'Institutional Reports';
    if (pathname.includes('/notices')) return 'Circulars & Official Broadcasts';
    if (pathname.includes('/profile')) return 'Principal Office & Credentials';
    return 'Principal Panel';
  };

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#122A24] flex flex-col font-sans antialiased">
      {/* Unified Enterprise Top School Header */}
      <SchoolSessionHeader
        panelName="Principal"
        activeTab={pathname.replace('/principal/', '').replace('/principal', 'overview')}
        tabTitle={getBreadcrumbTitle()}
        selectedSchool={{
          id: 'DPS2026',
          school_name: schoolName,
          name: schoolName,
          city: 'Lucknow',
          address: 'Amrapali Yojna, Dubagga'
        } as any}
        currentUser={{
          full_name: principalName,
          role: 'Principal',
          avatar: principalAvatar
        }}
        onToggleSidebar={() => setIsMobileOpen(prev => !prev)}
        onRefresh={handleManualRefresh}
        isLoading={isRefreshing}
      />

      <div className="flex-1 flex min-w-0 relative">
        {/* Sidebar */}
        <PrincipalSidebar
          schoolName={schoolName}
          principalName={principalName}
          principalAvatar={principalAvatar}
          pendingApprovalsCount={pendingApprovalsCount}
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
