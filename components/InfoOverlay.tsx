'use client';
import { M3Colors } from '@/constants/themeConstants';
import React, { useEffect, useRef } from 'react';

interface InfoOverlayProps {
  onStartAnalysis: () => void;
}

const InfoOverlay: React.FC<InfoOverlayProps> = React.memo(({ onStartAnalysis }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the button when overlay opens
    buttonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onStartAnalysis();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onStartAnalysis]);
  return (
    <div className={`fixed inset-0 ${M3Colors.surfaceContainer} flex items-center justify-center z-50 p-4 sm:p-6`}>
      <div className={`${M3Colors.surface} p-6 sm:p-8 rounded-2xl ${M3Colors.shadow} max-w-md w-full text-center`}>
        <h2 className={`text-2xl sm:text-3xl font-semibold mb-4 ${M3Colors.onSurface}`}>Test Analyzer</h2>
        <p className={`${M3Colors.onSurfaceVariant} mb-8 text-sm sm:text-base`}>
          Allow camera access. Align the test strip using the on-screen guide. After capturing, tap on the image to place points for each test
          area.
        </p>
        <button
          ref={buttonRef}
          onClick={onStartAnalysis}
          className={`${M3Colors.primary} ${M3Colors.onPrimary} font-medium py-3 px-8 rounded-full text-base sm:text-lg transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
        >
          Start Analysis
        </button>
      </div>
    </div>
  );
});

InfoOverlay.displayName = 'InfoOverlay';

export default InfoOverlay;
