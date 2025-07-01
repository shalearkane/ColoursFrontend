'use client';
import TouchButton from '@/components/TouchButton';
import React from 'react';

interface ActionButtonsProps {
  onRetakeImage: () => void;
  onSendDataToServer: () => void;
  onEditPoints?: () => void;
  canAnalyze: boolean;
  isLoadingAnalysis: boolean;
  placedCrosshairsCount: number;
  isPostAnalysis?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(
  ({ onRetakeImage, onSendDataToServer, onEditPoints, canAnalyze, isLoadingAnalysis, placedCrosshairsCount, isPostAnalysis = false }) => {
    if (isPostAnalysis) {
      // Post-analysis mode: Show Retake Image and Edit Points
      return (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <TouchButton onClick={onRetakeImage} disabled={isLoadingAnalysis} variant="secondary" size="large" className="flex-1">
            Retake Image
          </TouchButton>
          <TouchButton
            onClick={onEditPoints}
            disabled={isLoadingAnalysis}
            variant="tertiary"
            size="large"
            className="flex-1 !bg-orange-600 !text-white"
          >
            Edit Points
          </TouchButton>
        </div>
      );
    }

    // Pre-analysis mode: Show Retake Image and Analyze
    return (
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <TouchButton onClick={onRetakeImage} disabled={isLoadingAnalysis} variant="secondary" size="large" className="flex-1">
          Retake Image
        </TouchButton>
        <TouchButton onClick={onSendDataToServer} disabled={!canAnalyze || isLoadingAnalysis} variant="primary" size="large" className="flex-1">
          {isLoadingAnalysis ? 'Analyzing...' : `Analyze ${placedCrosshairsCount > 0 ? `(${placedCrosshairsCount} Points)` : ''}`}
        </TouchButton>
      </div>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
