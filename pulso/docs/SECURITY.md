# Pulso – Security

## Secret Handling
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` live in Vercel environment variables only.
- All AI calls made from Next.js server actions or API routes — never from the browser.
- Client uses only the anon Supabase key; RLS is the enforcement layer.

## Permission Model
### v1 (demo phase)
- All tables: open RLS (select + write for all) — intentionally permissive until lock-down.
- No sensitive real data should be stored before the lock-down sprint completes.

### After lock-down sprint
- `auth.uid() = user_id` policies on all tables — users only see their own data.
- Shared caretaker access via `memberships` table: `member_user_id` + `family_member_id` + `role` (owner / editor / viewer).
- Viewers: SELECT only. Editors: INSERT + UPDATE. Owner: full CRUD.
- Agent actions inherit the calling user's session — no privilege escalation.

## Approved-Tools Rule
- Only named tools in `AGENTIC_LAYER.md` may be invoked by server actions.
- No `eval`, `run_any`, or dynamic SQL construction from user input.
- All external API calls (OpenAI, Resend) go through server-side routes with input validation.

## Audit Principle
- Every create, update, delete, and report generation writes a row to `audit_logs`.
- Audit rows are append-only (no update/delete policy on `audit_logs` after lock-down).
- If a security or data-loss concern arises beyond the builder's expertise, stop and get a human reviewer.
