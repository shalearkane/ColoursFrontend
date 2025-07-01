export type TestType = 'CREATININE' | 'ALB' | 'ALP' | 'WHITE';

export interface PlacedCrosshair {
  id: string;
  x: number; // Relative X (0 to 1)
  y: number; // Relative Y (0 to 1)
  testType: TestType;
  pointIndex: number; // 1-based index
}

export interface ConcentrationResponse {
  pointIndex: number;
  test_type: TestType;
  concentration: number;
  remarks: 'none' | 'low' | 'normal' | 'high';
}

// Props for ResultsModal component
export interface ResultsModalProps {
  results: ConcentrationResponse[];
  onClose: () => void;
}
