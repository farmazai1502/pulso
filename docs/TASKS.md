# Pulso – Tasks & Sprints

## Sprint 1 — Database & Core Data Entry
**Goal:** Every log type works end-to-end against the database. Demo viewable without login.

- [ ] Run migration SQL; confirm seed data visible in Supabase
- [ ] Family member list page — shows seeded members, no login required
- [ ] Add / Edit / Delete family member form → persists to DB
- [ ] Sickness entry form + list view per member (CRUD)
- [ ] Medication form + list (CRUD, status toggle active/stopped)
- [ ] Appointment form + list (CRUD, status: upcoming/completed/cancelled)
- [ ] Test reading form (type dropdown, value, unit, date) + list (CRUD)
- [ ] All forms: loading spinner, empty state, field validation error, success toast
- [ ] Verify: every button writes to Supabase and UI re-fetches live data

**Definition of Done:** Open the app in a fresh browser tab (no login). Add a sickness entry for Carlos Santos. Reload the page. The entry is still there. Delete it. It is gone.

---

## Sprint 2 — Dashboard & Charts
**Goal:** Per-member dashboard shows health at a glance.

- [ ] Member switcher dropdown (all family members)
- [ ] Trend line chart per test type (Recharts) — last 30 readings
- [ ] Flagged readings highlighted red on chart
- [ ] Active medications card
- [ ] Upcoming appointments list (next 30 days)
- [ ] Recent sickness timeline (last 3 entries)
- [ ] Empty state for each card/chart
- [ ] Loading skeleton for each section

**Definition of Done:** Switch to Lucia Santos. Chart shows SpO2 readings. The flagged reading appears in red. All other cards show correct data or their empty state.

---

## Sprint 3 — Weekly Report Engine ✅ v1 functional milestone
**Goal:** Generate a meaningful weekly report with early-warning flags and AI summary.

- [ ] "Generate Weekly Report" button on member dashboard
- [ ] Server action: query all entries for selected member, last 7 days
- [ ] Rule engine: flag BP >140/90, glucose >126, SpO2 <95, weight >10% change
- [ ] Sort output: critical → warning → stable
- [ ] Call GPT-4o with structured data → store summary_text + source + confidence + review_status
- [ ] Report view: summary narrative + flagged items highlighted
- [ ] Report history list per member
- [ ] Graceful fallback if OpenAI API fails (show rule-based output only)
- [ ] Audit log entry written on every report generation

**Definition of Done:** Click Generate Weekly Report for Carlos Santos (seeded data). Report appears within 5 seconds. At least one glucose flag is shown. AI summary is displayed. Reload — report is still there in history.

---

## Sprint 4 — Lock It Down
**Goal:** Real users can sign up; their data is isolated from others.

- [ ] Supabase Auth: email + password sign-up and login pages
- [ ] On create, set `user_id = auth.uid()` for all new rows
- [ ] Replace open RLS with owner-scoped policies (`auth.uid() = user_id`)
- [ ] Memberships table: invite caretaker by email, assign role
- [ ] Enforce viewer/editor/owner access in UI and server actions
- [ ] Redirect unauthenticated users to /login (post lock-down only)
- [ ] Audit log: actor_label set to authenticated user display name

**Definition of Done:** User A signs up, creates a family member. User B signs up — cannot see User A's data. A viewer-role caretaker can view but cannot delete entries.

---

## Sprint 5 — Polish & Reliability
**Goal:** Production-ready UX and reliability.

- [ ] Medication adherence: mark daily dose as taken/missed
- [ ] Lab result file upload (Supabase Storage, PDF/image)
- [ ] PDF export of weekly report (react-pdf or browser print)
- [ ] Mobile-responsive layout pass (all screens)
- [ ] Global error boundary + consistent toast notifications
- [ ] Full manual test pass per TEST_PLAN.md

**Definition of Done:** All TEST_PLAN.md steps pass. App renders correctly on a 375px mobile viewport.

---

## Gantt (Sprint → Weeks)
```
Sprint 1 — Data Entry      Week 1
Sprint 2 — Dashboard       Week 2
Sprint 3 — Reports (v1 ✅) Week 3
Sprint 4 — Auth Lock-down  Week 4
Sprint 5 — Polish          Week 5
```
