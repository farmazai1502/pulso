export type Relationship = 'self' | 'parent' | 'child' | 'other';
export type MedicationStatus = 'active' | 'stopped';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type ReviewStatus = 'unreviewed' | 'approved' | 'flagged';

export interface FamilyMember {
  id: string;
  user_id?: string;
  created_at: string;
  full_name: string;
  relationship: Relationship;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string;
  notes?: string;
}

export interface SicknessEntry {
  id: string;
  user_id?: string;
  created_at: string;
  family_member_id: string;
  onset_date: string;
  resolved_date?: string;
  symptoms: string;
  diagnosis?: string;
  treated_by?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  user_id?: string;
  created_at: string;
  family_member_id: string;
  name: string;
  dose: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribing_doctor?: string;
  status: MedicationStatus;
  notes?: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  created_at: string;
  family_member_id: string;
  appointment_date: string;
  doctor_name: string;
  clinic?: string;
  reason: string;
  outcome?: string;
  follow_up_date?: string;
  status: AppointmentStatus;
}

export type TestType = 'Blood Pressure' | 'Fasting Glucose' | 'Weight' | 'Blood Oxygen (SpO2)' | 'Heart Rate' | 'Temperature' | 'Other';

export interface TestReading {
  id: string;
  user_id?: string;
  created_at: string;
  family_member_id: string;
  reading_date: string;
  test_type: string;
  value: number;
  value_secondary?: number;
  unit: string;
  notes?: string;
  flagged: boolean;
}

export interface WarningFlag {
  test_type: string;
  reading_date: string;
  value: number;
  value_secondary?: number;
  unit: string;
  level: 'critical' | 'warning';
  reason: string;
}

export interface WeeklyReport {
  id: string;
  user_id?: string;
  created_at: string;
  family_member_id: string;
  week_start: string;
  week_end: string;
  summary_text?: string;
  summary_text_source?: string;
  summary_text_confidence?: number;
  summary_text_review_status?: ReviewStatus;
  warning_flags?: WarningFlag[];
  warning_flags_source?: string;
  warning_flags_confidence?: number;
  warning_flags_review_status?: ReviewStatus;
  generated_at?: string;
}

export const TEST_TYPE_UNITS: Record<string, { unit: string; hasSecondary?: boolean; secondaryLabel?: string }> = {
  'Blood Pressure': { unit: 'mmHg', hasSecondary: true, secondaryLabel: 'Diastolic' },
  'Fasting Glucose': { unit: 'mg/dL' },
  'Weight': { unit: 'kg' },
  'Blood Oxygen (SpO2)': { unit: '%' },
  'Heart Rate': { unit: 'bpm' },
  'Temperature': { unit: '°C' },
  'Other': { unit: '' },
};
