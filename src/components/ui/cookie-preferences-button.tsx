/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React from 'react';

interface Props {
  className?: string;
  label?: string;
}

export default function CookiePreferencesButton({
  className = 'hover:text-[var(--ink-navy)] border-none bg-transparent cursor-pointer p-0 text-inherit text-xs transition-colors',
  label = 'Cookie Preferences'
}: Props) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className} aria-label="Open cookie and privacy consent preferences">
      {label}
    </button>
  );
}
