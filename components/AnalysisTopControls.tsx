'use client';
import TouchButton from '@/components/TouchButton';
import { M3Colors, TestTypeColorValues, TouchTargets, TypographyScale } from '@/constants/themeConstants';
import { TestType } from '@/types';
import React from 'react';

interface AnalysisTopControlsProps {
  currentTestType: TestType;
  onTestTypeChange: (testType: TestType) => void;
  placedCrosshairsCount: number;
  onClearLastPoint: () => void;
  onClearAllPoints: () => void;
  disabled: boolean;
}

const AnalysisTopControls: React.FC<AnalysisTopControlsProps> = React.memo(
  ({ currentTestType, onTestTypeChange, placedCrosshairsCount, onClearLastPoint, onClearAllPoints, disabled }) => {
    return (
      <>
        <div className="mb-3 sm:mb-4">
          <label htmlFor="test-type-select" className={`block ${TypographyScale.titleSmall} ${M3Colors.onSurfaceVariant} mb-2 sm:mb-3`}>
            Select Test Type for Next Point:
          </label>
          <select
            id="test-type-select"
            value={currentTestType}
            onChange={(e) => onTestTypeChange(e.target.value as TestType)}
            disabled={disabled}
            className={`w-full ${TestTypeColorValues[currentTestType].bg} ${TestTypeColorValues[currentTestType].text} border ${M3Colors.outline} rounded-xl sm:rounded-2xl ${M3Colors.shadowMd} focus:outline-none focus:ring-2 focus:ring-blue-500 ${TypographyScale.bodyMedium} sm:${TypographyScale.bodyLarge} disabled:opacity-70 disabled:cursor-not-allowed`}
            style={{
              minHeight: TouchTargets.comfortable,
              padding: '12px 16px'
            }}
          >
            <option value="WHITE">White Reference Point</option>
            <option value="ALB">ALB</option>
            <option value="ALP">ALP</option>
            <option value="CREATININE">Creatinine</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <TouchButton
            onClick={onClearLastPoint}
            disabled={disabled || placedCrosshairsCount === 0}
            variant="tertiary"
            size="medium"
            className="!bg-amber-600 !text-white w-full"
          >
            <span className="block sm:hidden">Clear Last ({placedCrosshairsCount})</span>
            <span className="hidden sm:block">Clear Last ({placedCrosshairsCount})</span>
          </TouchButton>
          <TouchButton
            onClick={onClearAllPoints}
            disabled={disabled || placedCrosshairsCount === 0}
            variant="tertiary"
            size="medium"
            className="!bg-amber-700 !text-white w-full"
          >
            Clear All
          </TouchButton>
        </div>
      </>
    );
  }
);

AnalysisTopControls.displayName = 'AnalysisTopControls';

export default AnalysisTopControls;
