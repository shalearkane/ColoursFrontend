import { TestType } from '@/types';

// M3 Expressive Medical Color Palette
export const M3Colors = {
  // Primary: Trust & Reliability for Medical Context
  primary: 'bg-blue-600', // Softer, more expressive blue
  onPrimary: 'text-white',
  primaryContainer: 'bg-blue-100',
  onPrimaryContainer: 'text-blue-900',

  // Secondary: Supporting Medical Actions
  secondary: 'bg-cyan-600', // Expressive cyan for medical tech
  onSecondary: 'text-white',
  secondaryContainer: 'bg-cyan-50',
  onSecondaryContainer: 'text-cyan-900',

  // Tertiary: Accent for Medical Indicators
  tertiary: 'bg-teal-600',
  onTertiary: 'text-white',
  tertiaryContainer: 'bg-teal-50',
  onTertiaryContainer: 'text-teal-900',

  // Error: Medical Alerts
  error: 'bg-red-600',
  onError: 'text-white',
  errorContainer: 'bg-red-50',
  onErrorContainer: 'text-red-800',

  // Surface: Clean Medical Environment
  surface: 'bg-neutral-50', // Warmer neutral for M3 Expressive
  surfaceContainer: 'bg-neutral-100',
  surfaceContainerHigh: 'bg-neutral-200',
  onSurface: 'text-neutral-900',
  onSurfaceVariant: 'text-neutral-700',

  // Outline & Shadows
  outline: 'border-neutral-300',
  outlineVariant: 'border-neutral-200',
  shadow: 'shadow-lg',
  shadowMd: 'shadow-md',

  // M3 Expressive Enhancements
  primaryFixed: 'bg-blue-90', // For large surfaces
  primaryFixedDim: 'bg-blue-80',
  inversePrimary: 'bg-blue-300',
  surfaceTint: 'bg-blue-600'
};

// M3 Expressive Test Type Colors - Medical & Accessible
export const TestTypeColorValues: Record<TestType, { bg: string; text: string; container: string; onContainer: string }> = {
  WHITE: {
    bg: 'bg-neutral-600',
    text: 'text-white',
    container: 'bg-neutral-100',
    onContainer: 'text-neutral-900'
  },
  ALB: {
    bg: 'bg-green-600', // Protein marker - life/growth
    text: 'text-white',
    container: 'bg-green-100',
    onContainer: 'text-green-900'
  },
  ALP: {
    bg: 'bg-blue-600', // Enzyme marker - matches primary
    text: 'text-white',
    container: 'bg-blue-100',
    onContainer: 'text-blue-900'
  },
  CREATININE: {
    bg: 'bg-purple-600', // Kidney marker - distinctive
    text: 'text-white',
    container: 'bg-purple-100',
    onContainer: 'text-purple-900'
  }
};

// M3 Expressive Touch Target Sizes
export const TouchTargets = {
  minimum: '44px', // Minimum touch target
  comfortable: '48px', // Comfortable touch target
  large: '56px', // Large touch target for primary actions
  button: '40px' // Button height minimum
};

// M3 Expressive Motion Tokens
export const MotionTokens = {
  // Duration
  short1: '50ms',
  short2: '100ms',
  short3: '150ms',
  short4: '200ms',
  medium1: '250ms',
  medium2: '300ms',
  medium3: '350ms',
  medium4: '400ms',
  long1: '450ms',
  long2: '500ms',

  // Easing
  standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  standardDecel: 'cubic-bezier(0.0, 0.0, 0, 1.0)',
  standardAccel: 'cubic-bezier(0.3, 0.0, 1.0, 1.0)',
  emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  emphasizedDecel: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  emphasizedAccel: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)'
};

// M3 Expressive Typography Scale
export const TypographyScale = {
  displayLarge: 'text-6xl font-normal', // 57px
  displayMedium: 'text-5xl font-normal', // 45px
  displaySmall: 'text-4xl font-normal', // 36px
  headlineLarge: 'text-3xl font-normal', // 32px
  headlineMedium: 'text-2xl font-normal', // 28px
  headlineSmall: 'text-xl font-normal', // 24px
  titleLarge: 'text-lg font-medium', // 22px
  titleMedium: 'text-base font-medium', // 16px
  titleSmall: 'text-sm font-medium', // 14px
  bodyLarge: 'text-base font-normal', // 16px
  bodyMedium: 'text-sm font-normal', // 14px
  bodySmall: 'text-xs font-normal', // 12px
  labelLarge: 'text-sm font-medium', // 14px
  labelMedium: 'text-xs font-medium', // 12px
  labelSmall: 'text-xs font-medium' // 11px
};
