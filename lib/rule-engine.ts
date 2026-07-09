import { TestReading, WarningFlag } from './types';

export function evaluateReading(reading: {
  test_type: string;
  value: number;
  value_secondary?: number | null;
  unit: string;
}): { flagged: boolean; flag_reason?: string } {
  const { test_type, value, value_secondary } = reading;

  if (test_type === 'Blood Pressure') {
    if (value > 180) return { flagged: true, flag_reason: `Critical: Systolic ${value} mmHg > 180` };
    if (value > 140 || (value_secondary != null && value_secondary > 90)) {
      return { flagged: true, flag_reason: `Systolic ${value} > 140 or Diastolic ${value_secondary} > 90` };
    }
  }

  if (test_type === 'Fasting Glucose') {
    if (value > 300) return { flagged: true, flag_reason: `Critical: Glucose ${value} mg/dL > 300` };
    if (value > 126) return { flagged: true, flag_reason: `Glucose ${value} mg/dL > 126` };
  }

  if (test_type === 'Blood Oxygen (SpO2)') {
    if (value < 90) return { flagged: true, flag_reason: `Critical: SpO2 ${value}% < 90` };
    if (value < 95) return { flagged: true, flag_reason: `SpO2 ${value}% < 95` };
  }

  return { flagged: false };
}

export function generateWarningFlags(readings: TestReading[]): WarningFlag[] {
  const flags: WarningFlag[] = [];

  // Group by test type for weight change detection
  const weightReadings = readings
    .filter(r => r.test_type === 'Weight')
    .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime());

  if (weightReadings.length >= 2) {
    const first = weightReadings[0];
    const last = weightReadings[weightReadings.length - 1];
    const changePct = Math.abs((last.value - first.value) / first.value) * 100;
    if (changePct > 10) {
      flags.push({
        test_type: 'Weight',
        reading_date: last.reading_date,
        value: last.value,
        unit: 'kg',
        level: 'warning',
        reason: `Weight changed by ${changePct.toFixed(1)}% over the period (${first.value} → ${last.value} kg)`,
      });
    }
  }

  // Flag individual readings
  for (const r of readings) {
    const { test_type, value, value_secondary, unit, reading_date } = r;

    if (test_type === 'Blood Pressure') {
      if (value > 180) {
        flags.push({ test_type, reading_date, value, value_secondary: value_secondary ?? undefined, unit, level: 'critical', reason: `Critical hypertension: Systolic ${value} mmHg > 180` });
      } else if (value > 140 || (value_secondary != null && value_secondary > 90)) {
        flags.push({ test_type, reading_date, value, value_secondary: value_secondary ?? undefined, unit, level: 'warning', reason: `High BP: ${value}/${value_secondary} mmHg (threshold 140/90)` });
      }
    }

    if (test_type === 'Fasting Glucose') {
      if (value > 300) {
        flags.push({ test_type, reading_date, value, unit, level: 'critical', reason: `Critical glucose: ${value} mg/dL > 300` });
      } else if (value > 126) {
        flags.push({ test_type, reading_date, value, unit, level: 'warning', reason: `High fasting glucose: ${value} mg/dL > 126` });
      }
    }

    if (test_type === 'Blood Oxygen (SpO2)') {
      if (value < 90) {
        flags.push({ test_type, reading_date, value, unit, level: 'critical', reason: `Critical hypoxia: SpO2 ${value}% < 90` });
      } else if (value < 95) {
        flags.push({ test_type, reading_date, value, unit, level: 'warning', reason: `Low SpO2: ${value}% < 95` });
      }
    }
  }

  // Sort: critical first
  return flags.sort((a, b) => (a.level === 'critical' ? -1 : 1) - (b.level === 'critical' ? -1 : 1));
}
