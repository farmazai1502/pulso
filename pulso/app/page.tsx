"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Activity, CalendarDays, ClipboardPlus, HeartPulse, Loader2, Pill, Plus, Save, Trash2, UserRound } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  TEST_TYPES,
  type Appointment,
  type FamilyMember,
  type Medication,
  type PulsoData,
  type SicknessEntry,
  type TestReading,
  type WeeklyReport,
  analyzeReadings,
  fallbackSummary,
  flagReading,
  seedData,
  today,
  uid,
} from "@/lib/pulso";

const STORAGE_KEY = "pulso-demo-data-v3";
const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type Tab = "overview" | "members" | "sickness" | "medications" | "appointments" | "readings" | "reports";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "sickness", label: "Sickness" },
  { id: "medications", label: "Medications" },
  { id: "appointments", label: "Appointments" },
  { id: "readings", label: "Readings" },
  { id: "reports", label: "Reports" },
];

function emptyForms(memberId: string) {
  return {
    member: { full_name: "", relationship: "other", date_of_birth: "", blood_type: "", allergies: "", notes: "" },
    sickness: { onset_date: today(), resolved_date: "", symptoms: "", diagnosis: "", treated_by: "", notes: "" },
    medication: { name: "", dose: "", frequency: "", start_date: today(), end_date: "", prescribing_doctor: "", status: "active" as Medication["status"] },
    appointment: { appointment_date: `${today()}T09:00`, doctor_name: "", clinic: "", reason: "", outcome: "", follow_up_date: "", status: "upcoming" as Appointment["status"] },
    reading: { family_member_id: memberId, reading_date: `${today()}T07:30`, test_type: "Fasting Glucose", value: "", value_secondary: "", unit: "mg/dL", notes: "" },
  };
}

export default function Home() {
  const [data, setData] = useState<PulsoData>(seedData);
  const [selectedId, setSelectedId] = useState("a1000000-0000-0000-0000-000000000002");
  const [tab, setTab] = useState<Tab>("overview");
  const [forms, setForms] = useState(() => emptyForms(selectedId));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const supabase = useMemo(() => (hasSupabase ? createClient() : null), []);
  const selected = data.family_members.find((member) => member.id === selectedId) ?? data.family_members[0];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      if (!supabase) {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        setData(stored ? JSON.parse(stored) : seedData);
        setLoading(false);
        return;
      }

      const [members, sickness, meds, appointments, readings, reports] = await Promise.all([
        supabase.from("family_members").select("*").order("created_at", { ascending: true }),
        supabase.from("sickness_entries").select("*").order("onset_date", { ascending: false }),
        supabase.from("medications").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("appointment_date", { ascending: true }),
        supabase.from("test_readings").select("*").order("reading_date", { ascending: true }),
        supabase.from("weekly_reports").select("*").order("generated_at", { ascending: false }),
      ]);

      const firstError = [members, sickness, meds, appointments, readings, reports].find((result) => result.error)?.error;
      if (firstError) {
        setError(firstError.message);
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        setData(stored ? JSON.parse(stored) : seedData);
      } else {
        setData({
          family_members: members.data ?? [],
          sickness_entries: sickness.data ?? [],
          medications: meds.data ?? [],
          appointments: appointments.data ?? [],
          test_readings: (readings.data ?? []).map((reading) => ({ ...reading, value: Number(reading.value), value_secondary: reading.value_secondary == null ? null : Number(reading.value_secondary) })),
          weekly_reports: (reports.data ?? []).map((report) => ({ ...report, warning_flags: report.warning_flags ?? [] })),
        });
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  useEffect(() => {
    if (!supabase && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, supabase]);

  useEffect(() => {
    setForms((current) => ({ ...current, reading: { ...current.reading, family_member_id: selectedId } }));
  }, [selectedId]);

  const memberRows = useMemo(() => {
    const memberId = selected?.id ?? "";
    return {
      sickness: data.sickness_entries.filter((entry) => entry.family_member_id === memberId),
      medications: data.medications.filter((entry) => entry.family_member_id === memberId),
      appointments: data.appointments.filter((entry) => entry.family_member_id === memberId),
      readings: data.test_readings.filter((entry) => entry.family_member_id === memberId),
      reports: data.weekly_reports.filter((entry) => entry.family_member_id === memberId),
    };
  }, [data, selected]);

  const chartGroups = useMemo(() => {
    const groups = new Map<string, TestReading[]>();
    for (const reading of memberRows.readings) {
      groups.set(reading.test_type, [...(groups.get(reading.test_type) ?? []), reading]);
    }
    return Array.from(groups.entries());
  }, [memberRows.readings]);

  async function refreshTable<T extends keyof PulsoData>(table: T) {
    if (!supabase) return;
    const orderColumn = table === "family_members" ? "created_at" : table === "test_readings" ? "reading_date" : table === "appointments" ? "appointment_date" : "created_at";
    const { data: rows, error: refreshError } = await supabase.from(table).select("*").order(orderColumn, { ascending: table !== "weekly_reports" });
    if (refreshError) throw refreshError;
    setData((current) => ({ ...current, [table]: rows ?? [] }));
  }

  async function insertRow<T extends keyof PulsoData>(table: T, row: PulsoData[T][number]) {
    setError("");
    setNotice("");
    if (supabase) {
      const { error: saveError } = await supabase.from(table).insert(row);
      if (saveError) throw saveError;
      await refreshTable(table);
    } else {
      setData((current) => ({ ...current, [table]: [row, ...current[table]] }));
    }
    setNotice("Saved.");
  }

  async function deleteRow<T extends keyof PulsoData>(table: T, id: string) {
    setError("");
    setNotice("");
    if (supabase) {
      const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
      if (deleteError) throw deleteError;
      await refreshTable(table);
    } else {
      setData((current) => ({ ...current, [table]: current[table].filter((row) => row.id !== id) as PulsoData[T] }));
    }
    setNotice("Deleted.");
  }

  function run(action: () => Promise<void>, successTab?: Tab) {
    startTransition(async () => {
      try {
        await action();
        if (successTab) setTab(successTab);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save. Please try again.");
      }
    });
  }

  const addMember = () => run(async () => {
    if (!forms.member.full_name.trim()) throw new Error("Name is required.");
    const row: FamilyMember = {
      id: uid("member"),
      full_name: forms.member.full_name.trim(),
      relationship: forms.member.relationship,
      date_of_birth: forms.member.date_of_birth || null,
      blood_type: forms.member.blood_type || null,
      allergies: forms.member.allergies || null,
      notes: forms.member.notes || null,
    };
    await insertRow("family_members", row);
    setSelectedId(row.id);
    setForms(emptyForms(row.id));
  }, "overview");

  const addSickness = () => run(async () => {
    if (!forms.sickness.symptoms.trim()) throw new Error("Symptoms are required.");
    await insertRow("sickness_entries", {
      id: uid("sick"),
      family_member_id: selected.id,
      onset_date: forms.sickness.onset_date,
      resolved_date: forms.sickness.resolved_date || null,
      symptoms: forms.sickness.symptoms,
      diagnosis: forms.sickness.diagnosis || null,
      treated_by: forms.sickness.treated_by || null,
      notes: forms.sickness.notes || null,
    });
    setForms((current) => ({ ...current, sickness: emptyForms(selected.id).sickness }));
  });

  const addMedication = () => run(async () => {
    if (!forms.medication.name.trim()) throw new Error("Medication name is required.");
    if (!forms.medication.dose.trim()) throw new Error("Dose is required.");
    await insertRow("medications", {
      id: uid("med"),
      family_member_id: selected.id,
      name: forms.medication.name,
      dose: forms.medication.dose,
      frequency: forms.medication.frequency || "As directed",
      start_date: forms.medication.start_date,
      end_date: forms.medication.end_date || null,
      prescribing_doctor: forms.medication.prescribing_doctor || null,
      status: forms.medication.status,
    });
    setForms((current) => ({ ...current, medication: emptyForms(selected.id).medication }));
  });

  const addAppointment = () => run(async () => {
    if (!forms.appointment.doctor_name.trim()) throw new Error("Doctor name is required.");
    if (!forms.appointment.reason.trim()) throw new Error("Reason is required.");
    await insertRow("appointments", {
      id: uid("appt"),
      family_member_id: selected.id,
      appointment_date: new Date(forms.appointment.appointment_date).toISOString(),
      doctor_name: forms.appointment.doctor_name,
      clinic: forms.appointment.clinic || null,
      reason: forms.appointment.reason,
      outcome: forms.appointment.outcome || null,
      follow_up_date: forms.appointment.follow_up_date || null,
      status: forms.appointment.status,
    });
    setForms((current) => ({ ...current, appointment: emptyForms(selected.id).appointment }));
  });

  const addReading = () => run(async () => {
    if (!forms.reading.value) throw new Error("Value is required.");
    const row: TestReading = {
      id: uid("reading"),
      family_member_id: selected.id,
      reading_date: new Date(forms.reading.reading_date).toISOString(),
      test_type: forms.reading.test_type,
      value: Number(forms.reading.value),
      value_secondary: forms.reading.value_secondary ? Number(forms.reading.value_secondary) : null,
      unit: forms.reading.unit,
      notes: forms.reading.notes || null,
      flagged: flagReading({ test_type: forms.reading.test_type, value: Number(forms.reading.value), value_secondary: forms.reading.value_secondary ? Number(forms.reading.value_secondary) : null }),
    };
    await insertRow("test_readings", row);
    setForms((current) => ({ ...current, reading: emptyForms(selected.id).reading }));
  }, "overview");

  const generateReport = () => run(async () => {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    const recentReadings = memberRows.readings.filter((reading) => new Date(reading.reading_date) >= weekStart);
    const flags = analyzeReadings(recentReadings);

    if (supabase) {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_member_id: selected.id, member_name: selected.full_name }),
      });
      if (response.ok) {
        await refreshTable("weekly_reports");
        setNotice("Weekly report generated.");
        return;
      }
    }

    const report: WeeklyReport = {
      id: uid("report"),
      family_member_id: selected.id,
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: weekEnd.toISOString().slice(0, 10),
      summary_text: fallbackSummary(selected.full_name, recentReadings, flags),
      summary_text_source: "fallback/rule-engine",
      summary_text_confidence: 0.74,
      summary_text_review_status: "unreviewed",
      warning_flags: flags,
      warning_flags_source: "rule-engine",
      warning_flags_confidence: 1,
      warning_flags_review_status: "unreviewed",
      generated_at: new Date().toISOString(),
    };
    await insertRow("weekly_reports", report);
  }, "reports");

  if (!selected) {
    return <main className="min-h-screen p-6">No family members found.</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Pulso caretaker workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">Family health dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Select family member">
              {data.family_members.map((member) => <option key={member.id} value={member.id}>{member.full_name} ({member.relationship})</option>)}
            </select>
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60" onClick={generateReport} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPlus className="size-4" />}
              Generate Weekly Report
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="flex flex-wrap gap-2 border-b border-neutral-200">
          {tabs.map((item) => (
            <button key={item.id} className={`px-3 py-2 text-sm font-medium ${tab === item.id ? "border-b-2 border-teal-700 text-teal-800" : "text-neutral-600 hover:text-neutral-950"}`} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {(notice || error || !hasSupabase) && (
          <div className="mt-4 grid gap-2 text-sm">
            {notice && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">{notice}</p>}
            {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">{error}</p>}
            {!hasSupabase && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">Demo storage is active because Supabase env vars are not loaded.</p>}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-md bg-neutral-200" />)}
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            <MemberHeader member={selected} readings={memberRows.readings} reports={memberRows.reports} />
            {tab === "overview" && <Overview member={selected} rows={memberRows} chartGroups={chartGroups} onTab={setTab} />}
            {tab === "members" && <Members data={data} form={forms.member} setForm={(member) => setForms((current) => ({ ...current, member }))} onAdd={addMember} onDelete={(id) => run(() => deleteRow("family_members", id))} pending={isPending} />}
            {tab === "sickness" && <Sickness rows={memberRows.sickness} form={forms.sickness} setForm={(sickness) => setForms((current) => ({ ...current, sickness }))} onAdd={addSickness} onDelete={(id) => run(() => deleteRow("sickness_entries", id))} pending={isPending} />}
            {tab === "medications" && <Medications rows={memberRows.medications} form={forms.medication} setForm={(medication) => setForms((current) => ({ ...current, medication }))} onAdd={addMedication} onDelete={(id) => run(() => deleteRow("medications", id))} pending={isPending} />}
            {tab === "appointments" && <Appointments rows={memberRows.appointments} form={forms.appointment} setForm={(appointment) => setForms((current) => ({ ...current, appointment }))} onAdd={addAppointment} onDelete={(id) => run(() => deleteRow("appointments", id))} pending={isPending} />}
            {tab === "readings" && <Readings rows={memberRows.readings} form={forms.reading} setForm={(reading) => setForms((current) => ({ ...current, reading }))} onAdd={addReading} onDelete={(id) => run(() => deleteRow("test_readings", id))} pending={isPending} />}
            {tab === "reports" && <Reports rows={memberRows.reports} onGenerate={generateReport} pending={isPending} />}
          </div>
        )}
      </div>
    </main>
  );
}

function MemberHeader({ member, readings, reports }: { member: FamilyMember; readings: TestReading[]; reports: WeeklyReport[] }) {
  const flagged = readings.filter((reading) => reading.flagged).length;
  return (
    <section className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="rounded-md border border-neutral-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-teal-50 p-2 text-teal-800"><UserRound className="size-5" /></div>
          <div>
            <h2 className="text-2xl font-semibold">{member.full_name}</h2>
            <p className="text-sm text-neutral-600">{member.relationship} · DOB {member.date_of_birth ?? "unknown"} · Blood {member.blood_type ?? "unknown"}</p>
            <p className="mt-2 text-sm text-neutral-700">{member.notes || "No notes yet."}</p>
          </div>
        </div>
      </div>
      <Stat icon={<HeartPulse className="size-5" />} label="Flagged readings" value={flagged.toString()} />
      <Stat icon={<ClipboardPlus className="size-5" />} label="Stored reports" value={reports.length.toString()} />
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-md border border-neutral-200 bg-white p-5"><div className="text-teal-800">{icon}</div><p className="mt-4 text-sm text-neutral-600">{label}</p><p className="text-3xl font-semibold">{value}</p></div>;
}

function Overview({ member, rows, chartGroups, onTab }: { member: FamilyMember; rows: { sickness: SicknessEntry[]; medications: Medication[]; appointments: Appointment[]; readings: TestReading[]; reports: WeeklyReport[] }; chartGroups: [string, TestReading[]][]; onTab: (tab: Tab) => void }) {
  const activeMeds = rows.medications.filter((med) => med.status === "active");
  const upcoming = rows.appointments.filter((appt) => appt.status === "upcoming").slice(0, 3);
  return (
    <section className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {chartGroups.length === 0 ? <EmptyCard title="No readings yet" action="Add Reading" onClick={() => onTab("readings")} /> : chartGroups.map(([type, readings]) => <ReadingChart key={type} type={type} readings={readings} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Active medications" icon={<Pill className="size-5" />} action={() => onTab("medications")}>
          {activeMeds.length === 0 ? <EmptyText>No active medications</EmptyText> : activeMeds.map((med) => <Row key={med.id} title={med.name} meta={`${med.dose} · ${med.frequency}`} />)}
        </Panel>
        <Panel title="Upcoming appointments" icon={<CalendarDays className="size-5" />} action={() => onTab("appointments")}>
          {upcoming.length === 0 ? <EmptyText>No upcoming appointments</EmptyText> : upcoming.map((appt) => <Row key={appt.id} title={appt.doctor_name} meta={`${new Date(appt.appointment_date).toLocaleDateString()} · ${appt.reason}`} />)}
        </Panel>
        <Panel title="Recent sickness" icon={<Activity className="size-5" />} action={() => onTab("sickness")}>
          {rows.sickness.length === 0 ? <EmptyText>No sickness entries</EmptyText> : rows.sickness.slice(0, 3).map((entry) => <Row key={entry.id} title={entry.symptoms} meta={`${entry.onset_date} · ${entry.diagnosis ?? "No diagnosis"}`} />)}
        </Panel>
      </div>
      <Panel title={`${member.full_name}'s latest reports`} icon={<ClipboardPlus className="size-5" />} action={() => onTab("reports")}>
        {rows.reports.length === 0 ? <EmptyText>No reports generated yet</EmptyText> : rows.reports.slice(0, 2).map((report) => <Row key={report.id} title={report.summary_text ?? "Rule-based report"} meta={`${report.week_start} to ${report.week_end}`} />)}
      </Panel>
    </section>
  );
}

function ReadingChart({ type, readings }: { type: string; readings: TestReading[] }) {
  const data = readings.slice(-30).map((reading) => ({ date: new Date(reading.reading_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: reading.value, secondary: reading.value_secondary, flagged: reading.flagged }));
  const threshold = type.toLowerCase().includes("glucose") ? 126 : type.toLowerCase().includes("spo2") || type.toLowerCase().includes("oxygen") ? 95 : type.toLowerCase().includes("blood pressure") ? 140 : undefined;
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{type}</h3>
        <span className="text-xs text-neutral-500">Last {data.length} readings</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={["dataMin - 5", "dataMax + 5"]} />
            <Tooltip />
            {threshold && <ReferenceLine y={threshold} stroke="#dc2626" strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} dot={(props) => <circle cx={props.cx} cy={props.cy} r={props.payload.flagged ? 5 : 3} fill={props.payload.flagged ? "#dc2626" : "#0f766e"} />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Members({ data, form, setForm, onAdd, onDelete, pending }: { data: PulsoData; form: ReturnType<typeof emptyForms>["member"]; setForm: (form: ReturnType<typeof emptyForms>["member"]) => void; onAdd: () => void; onDelete: (id: string) => void; pending: boolean }) {
  return <FormPanel title="Family members" onAdd={onAdd} pending={pending}><Input label="Name" value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} /><Input label="Relationship" value={form.relationship} onChange={(relationship) => setForm({ ...form, relationship })} /><Input label="DOB" type="date" value={form.date_of_birth} onChange={(date_of_birth) => setForm({ ...form, date_of_birth })} /><Input label="Blood type" value={form.blood_type} onChange={(blood_type) => setForm({ ...form, blood_type })} /><Input label="Allergies" value={form.allergies} onChange={(allergies) => setForm({ ...form, allergies })} /><TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} /><List>{data.family_members.map((member) => <ListItem key={member.id} title={member.full_name} meta={`${member.relationship} · ${member.notes ?? "No notes"}`} onDelete={() => onDelete(member.id)} />)}</List></FormPanel>;
}

function Sickness({ rows, form, setForm, onAdd, onDelete, pending }: { rows: SicknessEntry[]; form: ReturnType<typeof emptyForms>["sickness"]; setForm: (form: ReturnType<typeof emptyForms>["sickness"]) => void; onAdd: () => void; onDelete: (id: string) => void; pending: boolean }) {
  return <FormPanel title="Sickness entries" onAdd={onAdd} pending={pending}><Input label="Onset date" type="date" value={form.onset_date} onChange={(onset_date) => setForm({ ...form, onset_date })} /><Input label="Resolved date" type="date" value={form.resolved_date} onChange={(resolved_date) => setForm({ ...form, resolved_date })} /><TextArea label="Symptoms" value={form.symptoms} onChange={(symptoms) => setForm({ ...form, symptoms })} /><Input label="Diagnosis" value={form.diagnosis} onChange={(diagnosis) => setForm({ ...form, diagnosis })} /><Input label="Treated by" value={form.treated_by} onChange={(treated_by) => setForm({ ...form, treated_by })} /><TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} /><List empty="No sickness entries">{rows.map((row) => <ListItem key={row.id} title={row.symptoms} meta={`${row.onset_date} · ${row.diagnosis ?? "No diagnosis"} · ${row.resolved_date ? "resolved" : "ongoing"}`} onDelete={() => onDelete(row.id)} />)}</List></FormPanel>;
}

function Medications({ rows, form, setForm, onAdd, onDelete, pending }: { rows: Medication[]; form: ReturnType<typeof emptyForms>["medication"]; setForm: (form: ReturnType<typeof emptyForms>["medication"]) => void; onAdd: () => void; onDelete: (id: string) => void; pending: boolean }) {
  return <FormPanel title="Medications" onAdd={onAdd} pending={pending}><Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} /><Input label="Dose" value={form.dose} onChange={(dose) => setForm({ ...form, dose })} /><Input label="Frequency" value={form.frequency} onChange={(frequency) => setForm({ ...form, frequency })} /><Input label="Start date" type="date" value={form.start_date} onChange={(start_date) => setForm({ ...form, start_date })} /><Input label="End date" type="date" value={form.end_date} onChange={(end_date) => setForm({ ...form, end_date })} /><Select label="Status" value={form.status} options={["active", "stopped"]} onChange={(status) => setForm({ ...form, status: status as Medication["status"] })} /><Input label="Doctor" value={form.prescribing_doctor} onChange={(prescribing_doctor) => setForm({ ...form, prescribing_doctor })} /><List empty="No medications">{rows.map((row) => <ListItem key={row.id} title={row.name} meta={`${row.dose} · ${row.frequency} · ${row.status}`} onDelete={() => onDelete(row.id)} />)}</List></FormPanel>;
}

function Appointments({ rows, form, setForm, onAdd, onDelete, pending }: { rows: Appointment[]; form: ReturnType<typeof emptyForms>["appointment"]; setForm: (form: ReturnType<typeof emptyForms>["appointment"]) => void; onAdd: () => void; onDelete: (id: string) => void; pending: boolean }) {
  return <FormPanel title="Appointments" onAdd={onAdd} pending={pending}><Input label="Date and time" type="datetime-local" value={form.appointment_date} onChange={(appointment_date) => setForm({ ...form, appointment_date })} /><Input label="Doctor" value={form.doctor_name} onChange={(doctor_name) => setForm({ ...form, doctor_name })} /><Input label="Clinic" value={form.clinic} onChange={(clinic) => setForm({ ...form, clinic })} /><Input label="Reason" value={form.reason} onChange={(reason) => setForm({ ...form, reason })} /><TextArea label="Outcome" value={form.outcome} onChange={(outcome) => setForm({ ...form, outcome })} /><Input label="Follow-up" type="date" value={form.follow_up_date} onChange={(follow_up_date) => setForm({ ...form, follow_up_date })} /><Select label="Status" value={form.status} options={["upcoming", "completed", "cancelled"]} onChange={(status) => setForm({ ...form, status: status as Appointment["status"] })} /><List empty="No appointments">{rows.map((row) => <ListItem key={row.id} title={row.doctor_name} meta={`${new Date(row.appointment_date).toLocaleString()} · ${row.reason} · ${row.status}`} onDelete={() => onDelete(row.id)} />)}</List></FormPanel>;
}

function Readings({ rows, form, setForm, onAdd, onDelete, pending }: { rows: TestReading[]; form: ReturnType<typeof emptyForms>["reading"]; setForm: (form: ReturnType<typeof emptyForms>["reading"]) => void; onAdd: () => void; onDelete: (id: string) => void; pending: boolean }) {
  return <FormPanel title="Test readings" onAdd={onAdd} pending={pending}><Select label="Type" value={form.test_type} options={TEST_TYPES.map((type) => type.label)} onChange={(test_type) => setForm({ ...form, test_type, unit: TEST_TYPES.find((type) => type.label === test_type)?.unit ?? form.unit })} /><Input label="Value" type="number" value={form.value} onChange={(value) => setForm({ ...form, value })} /><Input label="Secondary" type="number" value={form.value_secondary} onChange={(value_secondary) => setForm({ ...form, value_secondary })} /><Input label="Unit" value={form.unit} onChange={(unit) => setForm({ ...form, unit })} /><Input label="Date" type="datetime-local" value={form.reading_date} onChange={(reading_date) => setForm({ ...form, reading_date })} /><TextArea label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} /><List empty="No readings">{rows.slice().reverse().map((row) => <ListItem key={row.id} title={`${row.test_type}: ${row.value}${row.value_secondary ? `/${row.value_secondary}` : ""} ${row.unit}`} meta={`${new Date(row.reading_date).toLocaleString()} · ${row.flagged ? "flagged" : "normal"}`} flagged={row.flagged} onDelete={() => onDelete(row.id)} />)}</List></FormPanel>;
}

function Reports({ rows, onGenerate, pending }: { rows: WeeklyReport[]; onGenerate: () => void; pending: boolean }) {
  return <Panel title="Weekly reports" icon={<ClipboardPlus className="size-5" />}><button className="mb-4 inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white" onClick={onGenerate} disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Generate report</button>{rows.length === 0 ? <EmptyText>No reports generated yet</EmptyText> : <div className="grid gap-4">{rows.map((report) => <article key={report.id} className="rounded-md border border-neutral-200 p-4"><p className="text-sm font-semibold">{report.week_start} to {report.week_end}</p><p className="mt-2 text-sm text-neutral-700">{report.summary_text}</p><div className="mt-3 grid gap-2">{(report.warning_flags ?? []).map((flag, index) => <p key={`${report.id}-${index}`} className={`rounded-md px-3 py-2 text-sm ${flag.severity === "critical" ? "bg-red-50 text-red-800" : flag.severity === "warning" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>{flag.label}: {flag.detail}</p>)}</div></article>)}</div>}</Panel>;
}

function FormPanel({ title, children, onAdd, pending }: { title: string; children: React.ReactNode; onAdd: () => void; pending: boolean }) {
  return <section className="rounded-md border border-neutral-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><button className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60" onClick={onAdd} disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save</button></div><div className="grid gap-3 md:grid-cols-3">{children}</div></section>;
}

function Panel({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: () => void }) {
  return <section className="rounded-md border border-neutral-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-teal-800">{icon}<h3 className="font-semibold text-neutral-950">{title}</h3></div>{action && <button className="text-sm font-medium text-teal-800" onClick={action}>Manage</button>}</div>{children}</section>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-sm font-medium text-neutral-700">{label}<input className="h-10 rounded-md border border-neutral-300 px-3 font-normal text-neutral-950" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm font-medium text-neutral-700 md:col-span-2">{label}<textarea className="min-h-20 rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-950" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm font-medium text-neutral-700">{label}<select className="h-10 rounded-md border border-neutral-300 px-3 font-normal text-neutral-950" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function List({ children, empty = "Nothing recorded yet." }: { children: React.ReactNode; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="md:col-span-3"><div className="mt-3 grid gap-2">{hasRows ? children : <EmptyText>{empty}</EmptyText>}</div></div>;
}

function ListItem({ title, meta, onDelete, flagged = false }: { title: string; meta: string; onDelete: () => void; flagged?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-md border px-3 py-3 ${flagged ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50"}`}><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-neutral-600">{meta}</p></div><button className="rounded-md p-2 text-neutral-500 hover:bg-white hover:text-red-700" onClick={onDelete} aria-label={`Delete ${title}`}><Trash2 className="size-4" /></button></div>;
}

function Row({ title, meta }: { title: string; meta: string }) {
  return <div className="border-b border-neutral-100 py-3 last:border-0"><p className="text-sm font-semibold">{title}</p><p className="text-xs text-neutral-600">{meta}</p></div>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-sm text-neutral-500">{children}</p>;
}

function EmptyCard({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="rounded-md border border-dashed border-neutral-300 bg-white p-5"><p className="text-sm text-neutral-600">{title}</p><button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white" onClick={onClick}><Plus className="size-4" />{action}</button></div>;
}
