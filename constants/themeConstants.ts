import { TestType } from '@/types';

export const M3Colors = {
  primary: 'bg-indigo-600',
  onPrimary: 'text-white',
  secondaryContainer: 'bg-indigo-100',
  onSecondaryContainer: 'text-indigo-800',
  tertiary: 'bg-purple-600',
  onTertiary: 'text-white',
  error: 'bg-red-600',
  onError: 'text-white',
  errorContainer: 'bg-red-100',
  onErrorContainer: 'text-red-700',
  surface: 'bg-white',
  surfaceContainer: 'bg-gray-50',
  onSurface: 'text-gray-900',
  onSurfaceVariant: 'text-gray-700',
  outline: 'border-gray-300',
  shadow: 'shadow-lg',
  shadowMd: 'shadow-md'
};

export const TestTypeColorValues: Record<TestType, { bg: string; text: string }> = {
  WHITE: { bg: 'bg-gray-500', text: 'text-white' },
  ALB: { bg: 'bg-green-600', text: 'text-white' },
  ALP: { bg: 'bg-blue-600', text: 'text-white' },
  CREATININE: { bg: 'bg-violet-600', text: 'text-white' }
};
