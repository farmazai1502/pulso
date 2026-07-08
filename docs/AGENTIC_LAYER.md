# Pulso – Agentic Layer

## Risk Levels & Actions

### Low Risk — Auto-execute
- **Flag a reading** when it exceeds a threshold (sets `flagged = true` on insert)
- **Tag a sickness entry** as ongoing if no `resolved_date` is set
- **Draft weekly report text** using GPT-4o based on aggregated entries

### Medium Risk — Light approval (shown to user before commit)
- **Mark a medication as stopped** based on detected end date
- **Suggest a follow-up appointment** when a critical flag is raised
- **Update `review_status`** of a report from `unreviewed` to `approved`

### High Risk — Explicit user confirmation required
- **Send a report summary** to an external contact (email/SMS)
- **Share family member records** with another caretaker account

### Critical — Human-only, no agent execution
- **Delete a family member** and all associated records
- **Purge health history** for a member

## Named Tools (approved set)
| Tool | Action | Risk |
|---|---|---|
| `flag_reading` | Set flagged=true + flag_reason | Low |
| `generate_report_draft` | Call GPT-4o, store with review_status=unreviewed | Low |
| `update_report_status` | Change review_status field | Medium |
| `send_report_email` | Send via Resend API — requires confirm | High |
| `delete_member` | Cascade delete — human-only | Critical |

## Audit Log Fields
Every tool call writes to `audit_logs`: `actor_label`, `action`, `table_name`, `record_id`, `payload` (before/after), `created_at`.

## v1 vs. Later
- **v1:** `flag_reading` + `generate_report_draft` (auto, low-risk only)
- **Later:** Approval UI for medium-risk actions; email sending; scheduled weekly auto-generation
