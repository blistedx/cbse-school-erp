/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import { useState, useEffect } from 'react';

export function useMobileDetection(breakpointWidth = 768) {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    const checkResolution = () => {
      const isMobile = window.innerWidth < breakpointWidth;
      setIsMobileScreen(isMobile);
    };

    checkResolution();
    window.addEventListener('resize', checkResolution, { passive: true });
    return () => window.removeEventListener('resize', checkResolution);
  }, [breakpointWidth]);

  return {
    isMobileScreen,
    shouldRenderMobile: isMounted ? isMobileScreen : false,
    isMounted
  };
}

