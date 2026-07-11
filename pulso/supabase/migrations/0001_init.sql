create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  full_name text not null,
  relationship text not null,
  date_of_birth date,
  blood_type text,
  allergies text,
  notes text
);
alter table family_members enable row level security;
drop policy if exists "family_members_v1_read" on family_members;
create policy "family_members_v1_read" on family_members for select using (true);
drop policy if exists "family_members_v1_write" on family_members;
create policy "family_members_v1_write" on family_members for all using (true) with check (true);

create table if not exists sickness_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  family_member_id uuid references family_members(id) on delete cascade,
  onset_date date not null,
  resolved_date date,
  symptoms text not null,
  diagnosis text,
  treated_by text,
  notes text
);
alter table sickness_entries enable row level security;
drop policy if exists "sickness_entries_v1_read" on sickness_entries;
create policy "sickness_entries_v1_read" on sickness_entries for select using (true);
drop policy if exists "sickness_entries_v1_write" on sickness_entries;
create policy "sickness_entries_v1_write" on sickness_entries for all using (true) with check (true);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  family_member_id uuid references family_members(id) on delete cascade,
  name text not null,
  dose text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  prescribing_doctor text,
  status text not null default 'active',
  notes text
);
alter table medications enable row level security;
drop policy if exists "medications_v1_read" on medications;
create policy "medications_v1_read" on medications for select using (true);
drop policy if exists "medications_v1_write" on medications;
create policy "medications_v1_write" on medications for all using (true) with check (true);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  family_member_id uuid references family_members(id) on delete cascade,
  appointment_date timestamptz not null,
  doctor_name text not null,
  clinic text,
  reason text not null,
  outcome text,
  follow_up_date date,
  status text not null default 'upcoming'
);
alter table appointments enable row level security;
drop policy if exists "appointments_v1_read" on appointments;
create policy "appointments_v1_read" on appointments for select using (true);
drop policy if exists "appointments_v1_write" on appointments;
create policy "appointments_v1_write" on appointments for all using (true) with check (true);

create table if not exists test_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  family_member_id uuid references family_members(id) on delete cascade,
  reading_date timestamptz not null default now(),
  test_type text not null,
  value numeric not null,
  value_secondary numeric,
  unit text not null,
  notes text,
  flagged boolean not null default false
);
alter table test_readings enable row level security;
drop policy if exists "test_readings_v1_read" on test_readings;
create policy "test_readings_v1_read" on test_readings for select using (true);
drop policy if exists "test_readings_v1_write" on test_readings;
create policy "test_readings_v1_write" on test_readings for all using (true) with check (true);

create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  family_member_id uuid references family_members(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  summary_text text,
  summary_text_source text,
  summary_text_confidence numeric,
  summary_text_review_status text default 'unreviewed',
  warning_flags jsonb,
  warning_flags_source text,
  warning_flags_confidence numeric,
  warning_flags_review_status text default 'unreviewed',
  generated_at timestamptz
);
alter table weekly_reports enable row level security;
drop policy if exists "weekly_reports_v1_read" on weekly_reports;
create policy "weekly_reports_v1_read" on weekly_reports for select using (true);
drop policy if exists "weekly_reports_v1_write" on weekly_reports;
create policy "weekly_reports_v1_write" on weekly_reports for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  actor_label text,
  action text not null,
  table_name text not null,
  record_id uuid,
  payload jsonb
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into family_members (id, full_name, relationship, date_of_birth, blood_type, allergies, notes) values
  ('a1000000-0000-0000-0000-000000000001', 'Maria Santos', 'self', '1985-03-12', 'O+', 'Penicillin', 'Manages hypertension'),
  ('a1000000-0000-0000-0000-000000000002', 'Carlos Santos', 'father', '1948-07-22', 'A+', 'None known', 'Type 2 diabetes, monitored weekly'),
  ('a1000000-0000-0000-0000-000000000003', 'Lucia Santos', 'daughter', '2015-11-05', 'B+', 'Dust mites', 'Mild asthma, uses inhaler as needed');

insert into sickness_entries (family_member_id, onset_date, resolved_date, symptoms, diagnosis, treated_by, notes) values
  ('a1000000-0000-0000-0000-000000000001', '2025-05-10', '2025-05-15', 'Headache, fatigue, elevated BP', 'Hypertensive episode', 'Dr. Reyes', 'Increased amlodipine dose'),
  ('a1000000-0000-0000-0000-000000000002', '2025-04-20', '2025-04-28', 'High fasting glucose, dizziness', 'Poorly controlled DM2', 'Dr. Lim', 'Diet adjustment and metformin dose review'),
  ('a1000000-0000-0000-0000-000000000003', '2025-06-01', null, 'Wheezing, dry cough at night', 'Asthma flare-up', 'Dr. Cruz', 'Nebulization twice daily');

insert into medications (family_member_id, name, dose, frequency, start_date, end_date, prescribing_doctor, status) values
  ('a1000000-0000-0000-0000-000000000001', 'Amlodipine', '10mg', 'Once daily', '2024-01-15', null, 'Dr. Reyes', 'active'),
  ('a1000000-0000-0000-0000-000000000002', 'Metformin', '500mg', 'Twice daily with meals', '2022-06-01', null, 'Dr. Lim', 'active'),
  ('a1000000-0000-0000-0000-000000000003', 'Salbutamol inhaler', '100mcg', 'As needed', '2025-06-01', null, 'Dr. Cruz', 'active');

insert into appointments (family_member_id, appointment_date, doctor_name, clinic, reason, status) values
  ('a1000000-0000-0000-0000-000000000001', '2025-07-15 10:00:00+08', 'Dr. Reyes', 'Makati Medical Center', 'BP follow-up and ECG', 'upcoming'),
  ('a1000000-0000-0000-0000-000000000002', '2025-06-28 09:00:00+08', 'Dr. Lim', 'St. Luke''s Quezon City', 'Quarterly diabetes review and HbA1c', 'upcoming'),
  ('a1000000-0000-0000-0000-000000000003', '2025-06-10 14:00:00+08', 'Dr. Cruz', 'Manila Doctors Hospital', 'Asthma check-up', 'completed');

insert into test_readings (family_member_id, reading_date, test_type, value, value_secondary, unit, flagged) values
  ('a1000000-0000-0000-0000-000000000001', '2025-06-20 08:00:00+08', 'Blood Pressure', 142, 91, 'mmHg', true),
  ('a1000000-0000-0000-0000-000000000001', '2025-06-19 08:10:00+08', 'Blood Pressure', 138, 88, 'mmHg', false),
  ('a1000000-0000-0000-0000-000000000002', '2025-06-20 07:30:00+08', 'Fasting Glucose', 134, null, 'mg/dL', true),
  ('a1000000-0000-0000-0000-000000000002', '2025-06-19 07:45:00+08', 'Fasting Glucose', 118, null, 'mg/dL', false),
  ('a1000000-0000-0000-0000-000000000003', '2025-06-18 20:00:00+08', 'Blood Oxygen (SpO2)', 94, null, '%', true),
  ('a1000000-0000-0000-0000-000000000001', '2025-06-20 08:05:00+08', 'Weight', 68, null, 'kg', false);