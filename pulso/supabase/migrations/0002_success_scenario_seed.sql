insert into test_readings (id, family_member_id, reading_date, test_type, value, value_secondary, unit, notes, flagged) values
  ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', '2026-07-02 07:30:00+08', 'Fasting Glucose', 134, null, 'mg/dL', 'Before breakfast', true),
  ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', '2026-07-03 07:30:00+08', 'Fasting Glucose', 118, null, 'mg/dL', null, false),
  ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', '2026-07-04 07:30:00+08', 'Fasting Glucose', 142, null, 'mg/dL', null, true),
  ('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', '2026-07-05 07:30:00+08', 'Fasting Glucose', 121, null, 'mg/dL', null, false),
  ('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', '2026-07-06 07:30:00+08', 'Fasting Glucose', 129, null, 'mg/dL', null, true),
  ('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', '2026-07-07 07:30:00+08', 'Fasting Glucose', 124, null, 'mg/dL', null, false),
  ('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', '2026-07-08 07:30:00+08', 'Fasting Glucose', 116, null, 'mg/dL', null, false),
  ('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', '2026-07-06 20:00:00+08', 'Blood Oxygen (SpO2)', 94, null, '%', 'After coughing', true),
  ('b2000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', '2026-07-07 20:00:00+08', 'Blood Oxygen (SpO2)', 97, null, '%', null, false)
on conflict (id) do update set
  reading_date = excluded.reading_date,
  test_type = excluded.test_type,
  value = excluded.value,
  value_secondary = excluded.value_secondary,
  unit = excluded.unit,
  notes = excluded.notes,
  flagged = excluded.flagged;

insert into appointments (id, family_member_id, appointment_date, doctor_name, clinic, reason, status) values
  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', '2026-07-18 09:00:00+08', 'Dr. Lim', 'St. Luke''s Quezon City', 'Quarterly diabetes review and HbA1c', 'upcoming'),
  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', '2026-07-20 14:00:00+08', 'Dr. Cruz', 'Manila Doctors Hospital', 'Asthma follow-up', 'upcoming')
on conflict (id) do update set
  appointment_date = excluded.appointment_date,
  doctor_name = excluded.doctor_name,
  clinic = excluded.clinic,
  reason = excluded.reason,
  status = excluded.status;
