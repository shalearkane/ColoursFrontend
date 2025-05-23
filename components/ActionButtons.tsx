'use client';
import { M3Colors } from '@/constants/themeConstants';
import React from 'react';

interface ActionButtonsProps {
  onRetakeImage: () => void;
  onSendDataToServer: () => void;
  canAnalyze: boolean;
  isLoadingAnalysis: boolean;
  placedCrosshairsCount: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRetakeImage,
  onSendDataToServer,
  canAnalyze,
  isLoadingAnalysis,
  placedCrosshairsCount
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onRetakeImage}
        disabled={isLoadingAnalysis}
        className={`flex-1 ${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition hover:bg-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        Retake Image
      </button>
      <button
        onClick={onSendDataToServer}
        disabled={!canAnalyze || isLoadingAnalysis}
        className={`flex-1 ${M3Colors.primary} ${M3Colors.onPrimary} font-semibold py-3 px-4 rounded-full ${M3Colors.shadowMd} transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400`}
      >
        {isLoadingAnalysis ? 'Analyzing...' : `Analyze ${placedCrosshairsCount > 0 ? `(${placedCrosshairsCount} Points)` : ''}`}
      </button>
    </div>
  );
};

export default ActionButtons;
