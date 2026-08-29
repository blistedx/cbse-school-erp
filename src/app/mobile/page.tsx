'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#122A24] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span>Loading EduGit ERP Mobile...</span>
      </div>
    </div>
  );
}
