'use client';
import { M3Colors, MotionTokens, TouchTargets, TypographyScale } from '@/constants/themeConstants';
import React, { forwardRef } from 'react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

/**
 * M3 Expressive Touch-Optimized Button Component
 *
 * Features:
 * - Responsive touch targets (44px+ minimum)
 * - M3 motion and interaction patterns
 * - Proper accessibility and focus states
 * - Optimized for medical app context
 */
const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ variant = 'primary', size = 'medium', className = '', children, disabled, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return `${M3Colors.primary} ${M3Colors.onPrimary} font-semibold`;
        case 'secondary':
          return `${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} font-medium`;
        case 'tertiary':
          return `${M3Colors.tertiaryContainer} ${M3Colors.onTertiaryContainer} font-medium`;
        default:
          return `${M3Colors.primary} ${M3Colors.onPrimary} font-semibold`;
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return { minHeight: TouchTargets.minimum, padding: '6px 12px', fontSize: TypographyScale.labelMedium };
        case 'medium':
          return { minHeight: TouchTargets.comfortable, padding: '10px 20px', fontSize: TypographyScale.titleMedium };
        case 'large':
          return { minHeight: TouchTargets.large, padding: '12px 24px', fontSize: TypographyScale.titleMedium };
        default:
          return { minHeight: TouchTargets.comfortable, padding: '10px 20px', fontSize: TypographyScale.titleMedium };
      }
    };

    const handleInteraction = (scale: string) => (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.transform = `scale(${scale})`;
      }
    };

    return (
      <button
        ref={ref}
        className={`
          rounded-full ${M3Colors.shadowMd} transition-transform ease-out
          focus:outline-none focus:ring-4 focus:ring-blue-300
          disabled:opacity-70 disabled:cursor-not-allowed
          ${getVariantStyles()}
          ${className}
        `}
        style={{
          ...getSizeStyles(),
          transitionDuration: MotionTokens.medium2,
          transitionTimingFunction: MotionTokens.emphasized
        }}
        onMouseDown={handleInteraction('0.95')}
        onMouseUp={handleInteraction('1')}
        onMouseLeave={handleInteraction('1')}
        onTouchStart={handleInteraction('0.95')}
        onTouchEnd={handleInteraction('1')}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
