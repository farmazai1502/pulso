# Pulso – Test Plan

## Core Success Scenario (manual)

### Steps
1. Open app at `/` — no login required. Confirm family member list shows at least 3 seeded members.
2. Click **Carlos Santos**. Dashboard loads. Confirm fasting glucose chart renders with at least 2 data points.
3. Click **Add Reading**. Select type: Fasting Glucose, value: 145, unit: mg/dL. Submit.
4. Confirm new reading appears on chart. Confirm it is marked flagged (red).
5. Click **Generate Weekly Report**.
6. Confirm report appears within 5 seconds.
7. Confirm at least one glucose flag is listed in the warnings section.
8. Confirm AI summary text is non-empty (or fallback message shown if API unavailable).
9. Navigate away and return to **Reports** tab. Confirm the report is still listed.
10. Click **Delete** on the reading added in step 3. Confirm it disappears from chart.

**Pass:** All 10 steps complete without error. Data persists across page reload.

---

## Empty State Tests
| Scenario | Expected |
|---|---|
| New family member with no entries | All dashboard cards show empty state message, no chart errors |
| Generate report with no entries this week | Report shows "No entries recorded this week" — no crash |
| Appointment list with no upcoming appointments | Card shows "No upcoming appointments" |

## Error State Tests
| Scenario | Expected |
|---|---|
| Submit reading form with no value | Inline validation error: "Value is required" |
| Submit medication form with no name | Inline error: "Medication name is required" |
| OpenAI API unavailable during report generation | Rule-based flags still shown; "AI summary unavailable" message displayed |
| Network drops during form submit | Error toast: "Could not save. Please try again." Data not lost from form |

## Data Integrity Checks
- Delete a family member → all linked entries (sickness, medications, appointments, readings, reports) are removed (cascade confirmed in DB).
- Flagged reading threshold: enter BP 141/88 → `flagged = true`. Enter BP 130/85 → `flagged = false`.
- Report `review_status` defaults to `unreviewed` on creation — confirm in Supabase table view.
