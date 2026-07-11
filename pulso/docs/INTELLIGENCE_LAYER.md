# Pulso – Intelligence Layer

## Messy Inputs
- Free-text symptoms and diagnosis notes
- Inconsistent test type naming by users ("BP" vs "Blood Pressure")
- Missing resolved dates (ongoing illness unclear)
- Irregular reading cadence (gaps in data)

## Auto-Structuring (on entry)
```json
{
  "test_type_normalised": "Blood Pressure",
  "value": 142,
  "value_secondary": 91,
  "unit": "mmHg",
  "flagged": true,
  "flag_reason": "Systolic > 140 mmHg"
}
```
Dropdown-constrained test_type on entry reduces free-text normalisation burden.

## Events Tracked
- Reading entered → rule engine evaluates flag immediately
- Weekly report generated → AI summary produced and stored
- Report warning acknowledged → review_status updated

## Scoring Rules (rule-based, v1)
| Test | Warning threshold | Critical threshold |
|---|---|---|
| Blood Pressure | Systolic >140 OR diastolic >90 | Systolic >180 |
| Fasting Glucose | >126 mg/dL | >300 mg/dL |
| SpO2 | <95% | <90% |
| Weight | >10% change in 30 days | — |

Rules run server-side in plain TypeScript — no AI dependency.

## What Gets Ranked in Weekly Report
1. Critical flags (bright red) — always shown first
2. Warning flags (amber) — shown second
3. Stable readings (green) — shown last

## v1 vs. Later
| v1 | Later |
|---|---|
| Rule-based flags | ML trend detection (7-day slope) |
| GPT-4o narrative summary | Fine-tuned medical summariser |
| Manual report trigger | Scheduled auto-report every Sunday |
| review_status = unreviewed | Caretaker one-click approve/dispute |
