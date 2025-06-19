'use client';
import { M3Colors, TestTypeColorValues } from '@/constants/themeConstants';
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

const AnalysisTopControls: React.FC<AnalysisTopControlsProps> = ({
  currentTestType,
  onTestTypeChange,
  placedCrosshairsCount,
  onClearLastPoint,
  onClearAllPoints,
  disabled
}) => {
  return (
    <>
      <div className="mb-5">
        <label htmlFor="test-type-select" className={`block text-sm font-medium ${M3Colors.onSurfaceVariant} mb-1.5`}>
          Select Test Type for Next Point:
        </label>
        <select
          id="test-type-select"
          value={currentTestType}
          onChange={(e) => onTestTypeChange(e.target.value as TestType)}
          disabled={disabled}
          className={`w-full ${TestTypeColorValues[currentTestType].bg} ${TestTypeColorValues[currentTestType].text} p-3.5 border ${M3Colors.outline} rounded-lg ${M3Colors.shadowMd} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          <option value="ALB">ALB</option>
          <option value="ALP">ALP</option>
          <option value="CREATININE">Creatinine</option>
          <option value="WHITE">White Reference Point</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={onClearLastPoint}
          disabled={disabled || placedCrosshairsCount === 0}
          className={`bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300`}
        >
          Clear Last ({placedCrosshairsCount})
        </button>
        <button
          onClick={onClearAllPoints}
          disabled={disabled || placedCrosshairsCount === 0}
          className={`bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300`}
        >
          Clear All
        </button>
      </div>
    </>
  );
};

export default AnalysisTopControls;
