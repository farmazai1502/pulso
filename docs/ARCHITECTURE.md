# Pulso – Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Backend / DB:** Supabase (Postgres + RLS + Storage)
- **AI:** OpenAI GPT-4o via server-side API route (key never in client)
- **Hosting:** Vercel

## What to Build Now vs. Later
| Now (v1) | Later |
|---|---|
| Family member CRUD | Shared caretaker access + roles |
| All five log types (CRUD) | File uploads for lab results |
| Dashboard charts | Mobile push reminders |
| Weekly report (rules + AI) | PDF export |
| Open RLS (demo-first) | Auth + per-user RLS lock-down |

## Key User Action — Step-by-Step Flow
1. **Caretaker enters a glucose reading** via the Test Readings form.
2. Form POSTs to a Next.js server action → validates type, value, unit.
3. Row inserted into `test_readings` with `family_member_id` and timestamp.
4. Dashboard re-fetches and re-renders the glucose trend chart.
5. Caretaker clicks **Generate Weekly Report**.
6. Server action queries all entries for the member across the past 7 days.
7. Rule engine flags readings outside safe thresholds (BP >140/90, glucose >126, SpO2 <95).
8. Flagged data + raw entries sent to GPT-4o; narrative stored with `source`, `confidence`, `review_status`.
9. Report row inserted into `weekly_reports`; UI shows summary + highlighted warnings.
10. Audit log records the generation event.

## Layer Plan
1. **Data layer first** – tables, constraints, RLS policies, seed data.
2. **App logic** – CRUD forms, rule-based flagging engine, report aggregation. Core runs with AI off.
3. **Intelligence on top** – GPT narrative layered over the rule output; gracefully skipped if API is unavailable.
