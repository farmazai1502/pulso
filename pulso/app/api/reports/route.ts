import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeReadings, fallbackSummary, type TestReading } from "@/lib/pulso";

export async function POST(request: Request) {
  const { family_member_id, member_name } = await request.json();

  if (!family_member_id || !member_name) {
    return NextResponse.json({ error: "family_member_id and member_name are required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase environment variables are not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const weekEnd = new Date();
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6);

  const { data: readings, error: readingsError } = await supabase
    .from("test_readings")
    .select("*")
    .eq("family_member_id", family_member_id)
    .gte("reading_date", weekStart.toISOString())
    .lte("reading_date", weekEnd.toISOString())
    .order("reading_date", { ascending: true });

  if (readingsError) {
    return NextResponse.json({ error: readingsError.message }, { status: 500 });
  }

  const normalizedReadings = (readings ?? []).map((reading) => ({
    ...reading,
    value: Number(reading.value),
    value_secondary: reading.value_secondary == null ? null : Number(reading.value_secondary),
  })) as TestReading[];
  const flags = analyzeReadings(normalizedReadings);
  const summary = await buildSummary(member_name, normalizedReadings, flags);

  const { data: report, error: reportError } = await supabase
    .from("weekly_reports")
    .insert({
      family_member_id,
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: weekEnd.toISOString().slice(0, 10),
      summary_text: summary.text,
      summary_text_source: summary.source,
      summary_text_confidence: summary.confidence,
      summary_text_review_status: "unreviewed",
      warning_flags: flags,
      warning_flags_source: "rule-engine",
      warning_flags_confidence: 1,
      warning_flags_review_status: "unreviewed",
      generated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_label: "anonymous",
    action: "report_generated",
    table_name: "weekly_reports",
    record_id: report.id,
    payload: { family_member_id, week_start: report.week_start, week_end: report.week_end, warning_count: flags.filter((flag) => flag.severity !== "stable").length },
  });

  return NextResponse.json({ report });
}

async function buildSummary(memberName: string, readings: TestReading[], flags: ReturnType<typeof analyzeReadings>) {
  const fallback = fallbackSummary(memberName, readings, flags);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { text: fallback, source: "fallback/rule-engine", confidence: 0.74 };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Write a concise, plain-language caregiver health summary. Do not diagnose. Recommend discussing warning patterns with a clinician." },
          { role: "user", content: JSON.stringify({ memberName, readings, flags }) },
        ],
      }),
    });

    if (!response.ok) {
      return { text: fallback, source: "fallback/rule-engine", confidence: 0.74 };
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content?.trim();
    return { text: text || fallback, source: text ? "openai/gpt-4o" : "fallback/rule-engine", confidence: text ? 0.86 : 0.74 };
  } catch {
    return { text: fallback, source: "fallback/rule-engine", confidence: 0.74 };
  }
}
