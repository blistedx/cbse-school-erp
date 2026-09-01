/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MobileRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const schoolParam = searchParams.get('school');
    const target = schoolParam ? `/app?school=${encodeURIComponent(schoolParam)}` : '/app';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#122A24] flex items-center justify-center text-white font-mono text-xs">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span>Redirecting to ERP Workspace...</span>
      </div>
    </div>
  );
}

export default function MobileRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#122A24] flex items-center justify-center text-white font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mr-2" />
          Loading...
        </div>
      }
    >
      <MobileRedirectContent />
    </Suspense>
  );
}
