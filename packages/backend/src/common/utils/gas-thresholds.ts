import { AlertLevel } from '../../schemas';

/**
 * Gas threshold configuration for monitoring
 * Based on Requirements 6.3:
 * - Methane: normal 0-500, warning 500-1000, danger >1000 ppm
 * - CO2: normal 0-2000, warning 2000-3000, danger >3000 ppm
 * - NH3: normal 0-15, warning 15-25, danger >25 ppm
 */
export const GAS_THRESHOLDS = {
  methane: {
    normal: { min: 0, max: 500 },
    warning: { min: 500, max: 1000 },
    danger: { min: 1000, max: Infinity },
  },
  co2: {
    normal: { min: 0, max: 2000 },
    warning: { min: 2000, max: 3000 },
    danger: { min: 3000, max: Infinity },
  },
  nh3: {
    normal: { min: 0, max: 15 },
    warning: { min: 15, max: 25 },
    danger: { min: 25, max: Infinity },
  },
} as const;

export interface GasReading {
  methanePpm: number;
  co2Ppm: number;
  nh3Ppm: number;
}

/**
 * Calculate the alert level based on gas readings
 * Returns the highest alert level among all gas types
 *
 * @param reading - Gas sensor reading with methane, CO2, and NH3 values
 * @returns AlertLevel - 'normal', 'warning', or 'danger'
 *
 * Property 19: Gas Threshold Calculation Correctness
 * - "danger" if methanePpm > 1000 OR co2Ppm > 3000 OR nh3Ppm > 25
 * - "warning" if (methanePpm > 500 OR co2Ppm > 2000 OR nh3Ppm > 15) AND not danger
 * - "normal" otherwise
 */
export function calculateAlertLevel(reading: GasReading): AlertLevel {
  const { methanePpm, co2Ppm, nh3Ppm } = reading;

  // Check for danger level first (highest priority)
  const isDanger =
    methanePpm > GAS_THRESHOLDS.methane.warning.max ||
    co2Ppm > GAS_THRESHOLDS.co2.warning.max ||
    nh3Ppm > GAS_THRESHOLDS.nh3.warning.max;

  if (isDanger) {
    return AlertLevel.DANGER;
  }

  // Check for warning level
  const isWarning =
    methanePpm > GAS_THRESHOLDS.methane.normal.max ||
    co2Ppm > GAS_THRESHOLDS.co2.normal.max ||
    nh3Ppm > GAS_THRESHOLDS.nh3.normal.max;

  if (isWarning) {
    return AlertLevel.WARNING;
  }

  // Default to normal
  return AlertLevel.NORMAL;
}

/**
 * Get the alert level for a specific gas type and value
 *
 * @param gasType - Type of gas ('methane', 'co2', or 'nh3')
 * @param value - The gas reading value in ppm
 * @returns AlertLevel for the specific gas
 */
export function getGasAlertLevel(
  gasType: 'methane' | 'co2' | 'nh3',
  value: number,
): AlertLevel {
  const thresholds = GAS_THRESHOLDS[gasType];

  if (value > thresholds.warning.max) {
    return AlertLevel.DANGER;
  }

  if (value > thresholds.normal.max) {
    return AlertLevel.WARNING;
  }

  return AlertLevel.NORMAL;
}

/**
 * Check if a reading exceeds danger thresholds
 *
 * @param reading - Gas sensor reading
 * @returns boolean - true if any gas exceeds danger threshold
 */
export function isDangerLevel(reading: GasReading): boolean {
  return calculateAlertLevel(reading) === AlertLevel.DANGER;
}

/**
 * Get a human-readable description of the alert level
 *
 * @param level - The alert level
 * @returns string description
 */
export function getAlertLevelDescription(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.DANGER:
      return 'Critical gas levels detected - immediate action required';
    case AlertLevel.WARNING:
      return 'Elevated gas levels detected - monitor closely';
    case AlertLevel.NORMAL:
      return 'Gas levels within normal range';
    default:
      return 'Unknown alert level';
  }
}
