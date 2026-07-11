export type Relationship = "self" | "father" | "mother" | "daughter" | "son" | "parent" | "child" | "other";

export type FamilyMember = {
  id: string;
  full_name: string;
  relationship: Relationship | string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string | null;
  notes: string | null;
  created_at?: string;
};

export type SicknessEntry = {
  id: string;
  family_member_id: string;
  onset_date: string;
  resolved_date: string | null;
  symptoms: string;
  diagnosis: string | null;
  treated_by: string | null;
  notes: string | null;
  created_at?: string;
};

export type Medication = {
  id: string;
  family_member_id: string;
  name: string;
  dose: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  prescribing_doctor: string | null;
  status: "active" | "stopped";
  notes?: string | null;
  created_at?: string;
};

export type Appointment = {
  id: string;
  family_member_id: string;
  appointment_date: string;
  doctor_name: string;
  clinic: string | null;
  reason: string;
  outcome: string | null;
  follow_up_date: string | null;
  status: "upcoming" | "completed" | "cancelled";
  created_at?: string;
};

export type TestReading = {
  id: string;
  family_member_id: string;
  reading_date: string;
  test_type: string;
  value: number;
  value_secondary: number | null;
  unit: string;
  notes: string | null;
  flagged: boolean;
  created_at?: string;
};

export type WarningFlag = {
  severity: "critical" | "warning" | "stable";
  label: string;
  detail: string;
  readingId?: string;
  readingDate?: string;
};

export type WeeklyReport = {
  id: string;
  family_member_id: string;
  week_start: string;
  week_end: string;
  summary_text: string | null;
  summary_text_source: string | null;
  summary_text_confidence: number | null;
  summary_text_review_status: string | null;
  warning_flags: WarningFlag[] | null;
  warning_flags_source: string | null;
  warning_flags_confidence: number | null;
  warning_flags_review_status: string | null;
  generated_at: string | null;
  created_at?: string;
};

export type PulsoData = {
  family_members: FamilyMember[];
  sickness_entries: SicknessEntry[];
  medications: Medication[];
  appointments: Appointment[];
  test_readings: TestReading[];
  weekly_reports: WeeklyReport[];
};

export const TEST_TYPES = [
  { label: "Fasting Glucose", unit: "mg/dL" },
  { label: "Blood Pressure", unit: "mmHg" },
  { label: "Blood Oxygen (SpO2)", unit: "%" },
  { label: "Weight", unit: "kg" },
];

export const today = () => new Date().toISOString().slice(0, 10);

export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function flagReading(input: Pick<TestReading, "test_type" | "value" | "value_secondary">): boolean {
  const type = input.test_type.toLowerCase();
  if (type.includes("blood pressure")) {
    return input.value > 140 || (input.value_secondary ?? 0) > 90;
  }
  if (type.includes("glucose")) {
    return input.value > 126;
  }
  if (type.includes("spo2") || type.includes("oxygen")) {
    return input.value < 95;
  }
  return false;
}

export function analyzeReadings(readings: TestReading[]): WarningFlag[] {
  const flags: WarningFlag[] = [];
  const sorted = [...readings].sort((a, b) => a.reading_date.localeCompare(b.reading_date));

  for (const reading of sorted) {
    const type = reading.test_type.toLowerCase();
    if (type.includes("blood pressure")) {
      if (reading.value > 180) {
        flags.push({ severity: "critical", label: "Critical blood pressure", detail: `${reading.value}/${reading.value_secondary ?? "-"} mmHg is above the critical systolic threshold.`, readingId: reading.id, readingDate: reading.reading_date });
      } else if (reading.value > 140 || (reading.value_secondary ?? 0) > 90) {
        flags.push({ severity: "warning", label: "High blood pressure", detail: `${reading.value}/${reading.value_secondary ?? "-"} mmHg exceeded 140/90.`, readingId: reading.id, readingDate: reading.reading_date });
      }
    }

    if (type.includes("glucose")) {
      if (reading.value > 300) {
        flags.push({ severity: "critical", label: "Critical fasting glucose", detail: `${reading.value} mg/dL is above the critical threshold.`, readingId: reading.id, readingDate: reading.reading_date });
      } else if (reading.value > 126) {
        flags.push({ severity: "warning", label: "High fasting glucose", detail: `${reading.value} mg/dL exceeded 126 mg/dL.`, readingId: reading.id, readingDate: reading.reading_date });
      }
    }

    if (type.includes("spo2") || type.includes("oxygen")) {
      if (reading.value < 90) {
        flags.push({ severity: "critical", label: "Critical SpO2", detail: `${reading.value}% is below 90%.`, readingId: reading.id, readingDate: reading.reading_date });
      } else if (reading.value < 95) {
        flags.push({ severity: "warning", label: "Low SpO2", detail: `${reading.value}% is below 95%.`, readingId: reading.id, readingDate: reading.reading_date });
      }
    }
  }

  const weights = sorted.filter((reading) => reading.test_type.toLowerCase().includes("weight"));
  if (weights.length >= 2) {
    const first = weights[0].value;
    const last = weights[weights.length - 1].value;
    if (first > 0 && Math.abs(last - first) / first > 0.1) {
      flags.push({ severity: "warning", label: "Weight changed over 10%", detail: `Weight changed from ${first} kg to ${last} kg in the recent period.` });
    }
  }

  if (flags.length === 0 && readings.length > 0) {
    flags.push({ severity: "stable", label: "No warning thresholds crossed", detail: `${readings.length} readings were reviewed with no rule-based warnings.` });
  }

  const rank = { critical: 0, warning: 1, stable: 2 };
  return flags.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function fallbackSummary(memberName: string, readings: TestReading[], flags: WarningFlag[]) {
  if (readings.length === 0) {
    return "No entries recorded this week. Add readings, medications, appointments, or sickness notes before generating the next report.";
  }

  const glucose = readings.filter((reading) => reading.test_type.toLowerCase().includes("glucose"));
  const highGlucose = glucose.filter((reading) => reading.value > 126);
  const warnings = flags.filter((flag) => flag.severity !== "stable");

  if (glucose.length > 0 && highGlucose.length > 0) {
    return `${memberName} had ${highGlucose.length} of ${glucose.length} fasting glucose readings above 126 mg/dL this week. Share this trend with the doctor, especially if symptoms such as dizziness, unusual thirst, or fatigue are present.`;
  }

  if (warnings.length > 0) {
    return `${memberName} had ${warnings.length} warning item${warnings.length === 1 ? "" : "s"} this week. Review the highlighted readings and bring them to the next appointment.`;
  }

  return `${memberName}'s recorded readings stayed within the v1 rule thresholds this week. Keep tracking regularly so changes are easier to spot.`;
}

export const seedData: PulsoData = {
  family_members: [
    { id: "a1000000-0000-0000-0000-000000000001", full_name: "Maria Santos", relationship: "self", date_of_birth: "1985-03-12", blood_type: "O+", allergies: "Penicillin", notes: "Manages hypertension" },
    { id: "a1000000-0000-0000-0000-000000000002", full_name: "Carlos Santos", relationship: "father", date_of_birth: "1948-07-22", blood_type: "A+", allergies: "None known", notes: "Type 2 diabetes, monitored weekly" },
    { id: "a1000000-0000-0000-0000-000000000003", full_name: "Lucia Santos", relationship: "daughter", date_of_birth: "2015-11-05", blood_type: "B+", allergies: "Dust mites", notes: "Mild asthma, uses inhaler as needed" },
  ],
  sickness_entries: [
    { id: "sick-1", family_member_id: "a1000000-0000-0000-0000-000000000001", onset_date: "2026-06-10", resolved_date: "2026-06-15", symptoms: "Headache, fatigue, elevated BP", diagnosis: "Hypertensive episode", treated_by: "Dr. Reyes", notes: "Increased amlodipine dose" },
    { id: "sick-2", family_member_id: "a1000000-0000-0000-0000-000000000002", onset_date: "2026-06-20", resolved_date: "2026-06-28", symptoms: "High fasting glucose, dizziness", diagnosis: "Poorly controlled DM2", treated_by: "Dr. Lim", notes: "Diet adjustment and metformin dose review" },
    { id: "sick-3", family_member_id: "a1000000-0000-0000-0000-000000000003", onset_date: "2026-07-01", resolved_date: null, symptoms: "Wheezing, dry cough at night", diagnosis: "Asthma flare-up", treated_by: "Dr. Cruz", notes: "Nebulization twice daily" },
  ],
  medications: [
    { id: "med-1", family_member_id: "a1000000-0000-0000-0000-000000000001", name: "Amlodipine", dose: "10mg", frequency: "Once daily", start_date: "2024-01-15", end_date: null, prescribing_doctor: "Dr. Reyes", status: "active" },
    { id: "med-2", family_member_id: "a1000000-0000-0000-0000-000000000002", name: "Metformin", dose: "500mg", frequency: "Twice daily with meals", start_date: "2022-06-01", end_date: null, prescribing_doctor: "Dr. Lim", status: "active" },
    { id: "med-3", family_member_id: "a1000000-0000-0000-0000-000000000003", name: "Salbutamol inhaler", dose: "100mcg", frequency: "As needed", start_date: "2025-06-01", end_date: null, prescribing_doctor: "Dr. Cruz", status: "active" },
  ],
  appointments: [
    { id: "appt-1", family_member_id: "a1000000-0000-0000-0000-000000000001", appointment_date: "2026-07-15T10:00:00+08:00", doctor_name: "Dr. Reyes", clinic: "Makati Medical Center", reason: "BP follow-up and ECG", outcome: null, follow_up_date: null, status: "upcoming" },
    { id: "appt-2", family_member_id: "a1000000-0000-0000-0000-000000000002", appointment_date: "2026-07-18T09:00:00+08:00", doctor_name: "Dr. Lim", clinic: "St. Luke's Quezon City", reason: "Quarterly diabetes review and HbA1c", outcome: null, follow_up_date: null, status: "upcoming" },
    { id: "appt-3", family_member_id: "a1000000-0000-0000-0000-000000000003", appointment_date: "2026-06-10T14:00:00+08:00", doctor_name: "Dr. Cruz", clinic: "Manila Doctors Hospital", reason: "Asthma check-up", outcome: "Continue inhaler as needed", follow_up_date: null, status: "completed" },
  ],
  test_readings: [
    { id: "read-c-1", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-02T07:30:00+08:00", test_type: "Fasting Glucose", value: 134, value_secondary: null, unit: "mg/dL", notes: "Before breakfast", flagged: true },
    { id: "read-c-2", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-03T07:30:00+08:00", test_type: "Fasting Glucose", value: 118, value_secondary: null, unit: "mg/dL", notes: null, flagged: false },
    { id: "read-c-3", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-04T07:30:00+08:00", test_type: "Fasting Glucose", value: 142, value_secondary: null, unit: "mg/dL", notes: null, flagged: true },
    { id: "read-c-4", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-05T07:30:00+08:00", test_type: "Fasting Glucose", value: 121, value_secondary: null, unit: "mg/dL", notes: null, flagged: false },
    { id: "read-c-5", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-06T07:30:00+08:00", test_type: "Fasting Glucose", value: 129, value_secondary: null, unit: "mg/dL", notes: null, flagged: true },
    { id: "read-c-6", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-07T07:30:00+08:00", test_type: "Fasting Glucose", value: 124, value_secondary: null, unit: "mg/dL", notes: null, flagged: false },
    { id: "read-c-7", family_member_id: "a1000000-0000-0000-0000-000000000002", reading_date: "2026-07-08T07:30:00+08:00", test_type: "Fasting Glucose", value: 116, value_secondary: null, unit: "mg/dL", notes: null, flagged: false },
    { id: "read-l-1", family_member_id: "a1000000-0000-0000-0000-000000000003", reading_date: "2026-07-06T20:00:00+08:00", test_type: "Blood Oxygen (SpO2)", value: 94, value_secondary: null, unit: "%", notes: "After coughing", flagged: true },
    { id: "read-l-2", family_member_id: "a1000000-0000-0000-0000-000000000003", reading_date: "2026-07-07T20:00:00+08:00", test_type: "Blood Oxygen (SpO2)", value: 97, value_secondary: null, unit: "%", notes: null, flagged: false },
  ],
  weekly_reports: [],
};
