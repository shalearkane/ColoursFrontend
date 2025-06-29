'use client';
import { CROSSHAIR_SIZE, CROSSHAIR_SVG_PATH } from '@/constants/appConstants';
import { M3Colors, TestTypeColorValues } from '@/constants/themeConstants';
import { PlacedCrosshair } from '@/types';
import Image from 'next/image';
import React, { RefObject } from 'react';

interface CameraDisplayProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  capturedImageDataUrl: string | null;
  placedCrosshairs: PlacedCrosshair[];
  onImageAreaClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const CameraDisplay: React.FC<CameraDisplayProps> = ({ videoRef, capturedImageDataUrl, placedCrosshairs, onImageAreaClick }) => {
  return (
    <div
      className={`aspect-[4/3] ${M3Colors.surfaceContainer} rounded-xl overflow-hidden mb-6 relative border ${M3Colors.outline} ${M3Colors.shadowMd}`}
    >
      {!capturedImageDataUrl ? (
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
              objectFit: 'contain'
            }}
          />
        </>
      ) : (
        <div
          className="w-full h-full relative cursor-crosshair"
          onClick={onImageAreaClick}
          role="button"
          tabIndex={0}
          aria-label="Captured image area, click to place points"
        >
          <Image src={capturedImageDataUrl} width={100} height={100} className="w-full h-full object-cover" alt="Captured Test Strip" />
          {placedCrosshairs.map((ch) => (
            <div
              key={ch.id}
              className="absolute flex flex-col items-center justify-center"
              style={{
                height: `${CROSSHAIR_SIZE * 0.75}%`,
                width: `${CROSSHAIR_SIZE * 0.75}%`,
                left: `${ch.x * 100}%`,
                top: `${ch.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none' // Prevent crosshair from intercepting clicks meant for the image div
              }}
              aria-hidden="true" // Decorative element
            >
              <Image
                height={100}
                width={100}
                src={CROSSHAIR_SVG_PATH}
                alt="crosshair" // Decorative, alt text provided by parent context if needed
                className="opacity-70"
                style={{ objectFit: 'contain', filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.4))` }}
              />
              <span
                className={`absolute font-bold text-xs ${TestTypeColorValues[ch.testType].text} ${TestTypeColorValues[ch.testType].bg} rounded-full px-1.5 py-0.5 shadow-sm`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -170%)' // Position number above the crosshair center
                }}
              >
                {ch.pointIndex}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraDisplay;
