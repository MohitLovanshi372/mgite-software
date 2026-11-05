/**
 * GestureAccuracyTimeSeries
 * Data point interface for real-time accuracy and clarity telemetry over the last 60 seconds.
 */

export interface GestureAccuracyPoint {
  /** Timestamp in ms (Date.now()) */
  timestamp: number;
  /** Normalized accuracy score (0.0 to 1.0 or percentage 0 to 100) */
  accuracy: number;
  /** Gesture recognition confidence (0.0 to 1.0) */
  confidence: number;
  /** Gesture contour clarity / stability index (0.0 to 1.0) */
  clarity: number;
  /** Detected gesture name */
  gesture: string;
  /** Whether hand was detected/tracked */
  isTracking: boolean;
}

export interface GestureAccuracyStats {
  averageAccuracy: number;
  peakAccuracy: number;
  currentClarity: number;
  sampleCount: number;
  clarityRating: 'POOR' | 'MODERATE' | 'NOMINAL' | 'OPTIMAL' | 'PRISTINE';
}
