# Pulso – Product Requirements Document

## Problem
Adults managing their own health plus elderly parents and/or children have no single place to track medical history, medications, appointments, and periodic self-test readings. Scattered notes mean missed patterns and late detection of worsening conditions.

## Target Users
- Adults tracking personal health
- Adults who are primary caretakers for elderly parents or young children
- Professional caretakers managing multiple individuals

## Core Objects
| Object | Purpose |
|---|---|
| Family Member | Person whose health is being tracked |
| Sickness Entry | Episode of illness with symptoms, diagnosis, treatment |
| Medication | Current or past prescription with dose and frequency |
| Appointment | Doctor visit (past or upcoming) |
| Test Reading | Numeric self-test result (BP, glucose, weight, SpO2, etc.) |
| Weekly Report | Generated health summary with early-warning flags |

## MVP Must-Haves (v1)
- [ ] Create/edit/delete family member profiles
- [ ] Log sickness history entries per member
- [ ] Log medications (name, dose, frequency, active/stopped)
- [ ] Log doctor appointments (past and upcoming)
- [ ] Enter self-test readings with type, value, unit, and date
- [ ] Dashboard with trend charts per member (one chart per test type)
- [ ] Generate weekly report: rule-based early-warning flags + AI narrative summary
- [ ] All screens visible without login (demo-first)

## Non-Goals (v1)
- Medication reminders / push notifications
- File/photo uploads for lab results
- Multi-user shared access and roles
- PDF export
- Wearable integrations

## Success Criterion
A caretaker opens the app, selects "Carlos Santos (Father)", sees 7 days of fasting glucose readings on a chart, clicks **Generate Weekly Report**, and within 5 seconds receives a report flagging that 3 of 7 readings exceeded 126 mg/dL — with a plain-language AI summary they can show a doctor.
