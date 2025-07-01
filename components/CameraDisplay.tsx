'use client';

import Image from 'next/image';
import React, { RefObject } from 'react';

import { CROSSHAIR_SIZE, CROSSHAIR_SVG_PATH } from '@/constants/appConstants';
import { M3Colors, TestTypeColorValues, TypographyScale } from '@/constants/themeConstants';
import { ConcentrationResponse, PlacedCrosshair } from '@/types';

/**
 * Camera display component for biomedical test strip analysis.
 *
 * Displays either live camera feed or captured image with interactive crosshairs.
 * Crosshairs show color-coded analysis results and concentration values.
 *
 * @component
 * @example
 * ```tsx
 * <CameraDisplay
 *   videoRef={videoRef}
 *   capturedImageDataUrl={imageUrl}
 *   placedCrosshairs={crosshairs}
 *   analysisResults={results}
 *   onImageAreaClick={handleClick}
 * />
 * ```
 */
interface CameraDisplayProps {
  /** Reference to the video element for live camera feed */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Base64 data URL of the captured image, null if showing live feed */
  capturedImageDataUrl: string | null;
  /** Array of crosshair positions with analysis point data */
  placedCrosshairs: PlacedCrosshair[];
  /** Optional analysis results to display on crosshairs */
  analysisResults?: ConcentrationResponse[] | null;
  /** Handler for clicks on the image area to place new crosshairs */
  onImageAreaClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Color scheme mapping for analysis result types
 */
const RESULT_COLOR_MAP = {
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  low: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  normal: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  default: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
} as const;

/**
 * Gets styling classes for crosshair labels based on analysis results
 */
const getResultColors = (pointIndex: number, results?: ConcentrationResponse[] | null) => {
  const result = results?.find((r) => r.pointIndex === pointIndex);
  return RESULT_COLOR_MAP[result?.remarks as keyof typeof RESULT_COLOR_MAP] || RESULT_COLOR_MAP.default;
};

/**
 * Formats concentration value for display
 * @param pointIndex - Index of the analysis point
 * @param results - Array of analysis results
 * @returns Formatted concentration string or empty if no result
 */
const getConcentrationDisplay = (pointIndex: number, results?: ConcentrationResponse[] | null): string => {
  const result = results?.find((r) => r.pointIndex === pointIndex);
  if (!result || result.concentration === -1 || result.remarks === 'none') {
    return result ? 'N/A' : '';
  }
  return Math.round(result.concentration).toString();
};

/**
 * Hue rotation values for crosshair color tinting
 */
const HUE_ROTATION_MAP = {
  high: 0, // Red tint
  low: 45, // Yellow tint
  normal: 120, // Green tint
  none: 200 // Gray tint
} as const;

/**
 * Gets CSS hue rotation value for crosshair tinting
 */
const getHueRotation = (pointIndex: number, results?: ConcentrationResponse[] | null): number => {
  const result = results?.find((r) => r.pointIndex === pointIndex);
  return HUE_ROTATION_MAP[result?.remarks as keyof typeof HUE_ROTATION_MAP] || 0;
};

/**
 * Calculates crosshair position relative to the outer container
 * Accounts for container padding to ensure accurate placement
 */
const getCrosshairPosition = (x: number, y: number) => ({
  left: `calc(1.5rem + ${x} * (100% - 3.0rem))`,
  top: `calc(1rem + ${y} * (100% - 2rem))`
});

const CameraDisplay: React.FC<CameraDisplayProps> = React.memo(
  ({ videoRef, capturedImageDataUrl, placedCrosshairs, analysisResults, onImageAreaClick }) => {
    const hasResults = Boolean(analysisResults?.length);

    return (
      <div className="relative px-0 py-2">
        <div
          className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto ${M3Colors.surfaceContainer} rounded-2xl sm:rounded-3xl overflow-hidden relative border ${M3Colors.outline} ${M3Colors.shadowMd} landscape-camera`}
          style={{ touchAction: 'manipulation', aspectRatio: '4/3' }}
        >
          {!capturedImageDataUrl ? (
            <LiveCameraView videoRef={videoRef} />
          ) : (
            <CapturedImageView imageDataUrl={capturedImageDataUrl} onImageAreaClick={onImageAreaClick} />
          )}
        </div>

        {/* Crosshairs rendered outside container to prevent clipping */}
        {capturedImageDataUrl &&
          placedCrosshairs.map((crosshair) => (
            <CrosshairOverlay key={crosshair.id} crosshair={crosshair} analysisResults={analysisResults} hasResults={hasResults} />
          ))}
      </div>
    );
  }
);

/**
 * Live camera view component
 */
const LiveCameraView: React.FC<{ videoRef: RefObject<HTMLVideoElement | null> }> = ({ videoRef }) => (
  <>
    <video ref={videoRef} playsInline muted className="w-full h-full object-cover" aria-label="Camera feed" />
    <Image
      src={CROSSHAIR_SVG_PATH}
      height={100}
      width={100}
      alt="Aiming Guide"
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
      style={{
        maxHeight: `${CROSSHAIR_SIZE}%`,
        maxWidth: `${CROSSHAIR_SIZE}%`,
        objectFit: 'contain',
        zIndex: 20
      }}
    />
  </>
);

/**
 * Captured image view component with click handling
 */
const CapturedImageView: React.FC<{
  imageDataUrl: string;
  onImageAreaClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ imageDataUrl, onImageAreaClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const syntheticEvent = {
        currentTarget: e.currentTarget,
        clientX: centerX,
        clientY: centerY
      } as React.MouseEvent<HTMLDivElement>;

      onImageAreaClick(syntheticEvent);
    }
  };

  return (
    <div
      className="w-full h-full relative cursor-crosshair"
      style={{ touchAction: 'manipulation' }}
      onClick={onImageAreaClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Captured image area, click or press Enter/Space to place analysis point at center"
    >
      <Image src={imageDataUrl} width={100} height={100} className="w-full h-full object-cover" alt="Captured Test Strip" />
    </div>
  );
};

/**
 * Individual crosshair overlay with labels
 */
const CrosshairOverlay: React.FC<{
  crosshair: PlacedCrosshair;
  analysisResults?: ConcentrationResponse[] | null;
  hasResults: boolean;
}> = ({ crosshair, analysisResults, hasResults }) => {
  const resultColors = getResultColors(crosshair.pointIndex, analysisResults);
  const concentrationValue = getConcentrationDisplay(crosshair.pointIndex, analysisResults);
  const position = getCrosshairPosition(crosshair.x, crosshair.y);

  return (
    <div
      className="absolute flex flex-col items-center justify-center"
      style={{
        height: `${CROSSHAIR_SIZE * 0.75}%`,
        width: `${CROSSHAIR_SIZE * 0.75}%`,
        ...position,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 50
      }}
      aria-hidden="true"
    >
      {/* Crosshair image */}
      <Image
        height={100}
        width={100}
        src={CROSSHAIR_SVG_PATH}
        alt="crosshair"
        className="opacity-70"
        style={{
          objectFit: 'contain',
          filter: hasResults
            ? `drop-shadow(0 1px 2px rgba(0,0,0,0.4)) hue-rotate(${getHueRotation(crosshair.pointIndex, analysisResults)}deg)`
            : `drop-shadow(0 1px 2px rgba(0,0,0,0.4))`,
          zIndex: 51
        }}
      />

      {/* Point index label - always at top */}
      <span
        className={`absolute ${TypographyScale.labelSmall} font-bold ${TestTypeColorValues[crosshair.testType].text} ${TestTypeColorValues[crosshair.testType].bg} rounded-full shadow-sm border border-gray-300`}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -170%)',
          minWidth: '16px',
          minHeight: '16px',
          padding: '1px 2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          lineHeight: '1',
          zIndex: 52
        }}
      >
        {crosshair.pointIndex}
      </span>

      {/* Concentration results - only shown after analysis */}
      {hasResults && concentrationValue && <ConcentrationLabel value={concentrationValue} colors={resultColors} />}
    </div>
  );
};

/**
 * Concentration value label with units
 */
const ConcentrationLabel: React.FC<{
  value: string;
  colors: { bg: string; text: string; border: string };
}> = ({ value, colors }) => (
  <div
    className="absolute flex flex-col items-center"
    style={{
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, 30%)',
      zIndex: 52
    }}
  >
    <span
      className={`${TypographyScale.labelSmall} font-bold ${colors.text} ${colors.bg} rounded-2xl shadow-md border-2 ${colors.border} min-w-max backdrop-blur-sm`}
      style={{
        padding: '2px 4px',
        minHeight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {value}
    </span>
    {value !== 'N/A' && (
      <span
        className="text-gray-600 font-medium mt-1 bg-white/80 rounded-full text-center whitespace-nowrap"
        style={{
          padding: '1px 3px',
          fontSize: '8px',
          lineHeight: '1'
        }}
      >
        mg/dL
      </span>
    )}
  </div>
);

CameraDisplay.displayName = 'CameraDisplay';
LiveCameraView.displayName = 'LiveCameraView';
CapturedImageView.displayName = 'CapturedImageView';
CrosshairOverlay.displayName = 'CrosshairOverlay';
ConcentrationLabel.displayName = 'ConcentrationLabel';

export default CameraDisplay;
