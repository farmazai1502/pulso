# Pulso – Data Model

## family_members
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid nullable | owner, set at lock-down |
| full_name | text | required |
| relationship | text | self / parent / child / other |
| date_of_birth | date | |
| blood_type | text | |
| allergies | text | |
| notes | text | |
| created_at | timestamptz | |

## sickness_entries
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_member_id | uuid FK → family_members | cascade delete |
| user_id | uuid nullable | |
| onset_date | date | required |
| resolved_date | date | nullable = ongoing |
| symptoms | text | required |
| diagnosis | text | |
| treated_by | text | |
| notes | text | |

## medications
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_member_id | uuid FK | |
| user_id | uuid nullable | |
| name | text | required |
| dose | text | required |
| frequency | text | required |
| start_date | date | required |
| end_date | date | nullable |
| prescribing_doctor | text | |
| status | text | active / stopped |

## appointments
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_member_id | uuid FK | |
| user_id | uuid nullable | |
| appointment_date | timestamptz | required |
| doctor_name | text | required |
| clinic | text | |
| reason | text | required |
| outcome | text | |
| follow_up_date | date | |
| status | text | upcoming / completed / cancelled |

## test_readings
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_member_id | uuid FK | |
| user_id | uuid nullable | |
| reading_date | timestamptz | |
| test_type | text | Blood Pressure / Glucose / Weight / SpO2 / etc. |
| value | numeric | primary value (systolic for BP) |
| value_secondary | numeric | diastolic for BP; nullable |
| unit | text | mmHg / mg/dL / kg / % |
| notes | text | |
| flagged | boolean | set by rule engine |

## weekly_reports
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_member_id | uuid FK | |
| user_id | uuid nullable | |
| week_start / week_end | date | |
| summary_text | text | **AI field** |
| summary_text_source | text | "openai/gpt-4o" |
| summary_text_confidence | numeric | 0–1 |
| summary_text_review_status | text | unreviewed / approved / flagged |
| warning_flags | jsonb | **AI-assisted field** — rule engine primary |
| warning_flags_source | text | "rule-engine" or "openai" |
| warning_flags_confidence | numeric | |
| warning_flags_review_status | text | |
| generated_at | timestamptz | |

## audit_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| actor_label | text | display name or "anonymous" |
| action | text | created / updated / deleted / report_generated |
| table_name | text | |
| record_id | uuid | |
| payload | jsonb | before/after snapshot |
| created_at | timestamptz | |

## RLS
- v1: all tables open (select + all) — demo-first.
- Lock-down sprint: replace with `auth.uid() = user_id` policies + membership checks for shared access.
