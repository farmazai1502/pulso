import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWarningFlags } from '@/lib/rule-engine';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const memberId = req.nextUrl.searchParams.get('member_id');
  let query = supabase.from('weekly_reports').select('*').order('generated_at', { ascending: false });
  if (memberId) query = query.eq('family_member_id', memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { family_member_id } = body;
  if (!family_member_id) return NextResponse.json('family_member_id required', { status: 400 });

  const now = new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);

  // Fetch all data for the past 7 days
  const [readingsRes, sicknessRes, medsRes, apptRes, memberRes] = await Promise.all([
    supabase.from('test_readings')
      .select('*')
      .eq('family_member_id', family_member_id)
      .gte('reading_date', weekStart.toISOString())
      .order('reading_date', { ascending: true }),
    supabase.from('sickness_entries')
      .select('*')
      .eq('family_member_id', family_member_id)
      .gte('onset_date', weekStart.toISOString().split('T')[0]),
    supabase.from('medications')
      .select('*')
      .eq('family_member_id', family_member_id)
      .eq('status', 'active'),
    supabase.from('appointments')
      .select('*')
      .eq('family_member_id', family_member_id)
      .gte('appointment_date', weekStart.toISOString()),
    supabase.from('family_members')
      .select('full_name, relationship')
      .eq('id', family_member_id)
      .single(),
  ]);

  const readings = readingsRes.data ?? [];
  const sickness = sicknessRes.data ?? [];
  const meds = medsRes.data ?? [];
  const appts = apptRes.data ?? [];
  const member = memberRes.data;

  // Rule engine
  const warningFlags = generateWarningFlags(readings);

  // Try GPT-4o for narrative
  let summaryText: string | null = null;
  let summarySource = 'rule-engine';
  let summaryConfidence = 0.7;

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const prompt = `You are a health assistant writing a plain-language weekly health summary for a caretaker to share with a doctor.

Member: ${member?.full_name ?? 'Unknown'} (${member?.relationship ?? ''})
Period: ${weekStart.toDateString()} – ${weekEnd.toDateString()}

TEST READINGS (${readings.length}):
${readings.map(r => `- ${r.test_type}: ${r.value}${r.value_secondary != null ? `/${r.value_secondary}` : ''} ${r.unit} on ${new Date(r.reading_date).toLocaleDateString()}${r.flagged ? ' ⚠️ FLAGGED' : ''}`).join('\n') || 'None this week.'}

WARNING FLAGS (${warningFlags.length}):
${warningFlags.map(f => `- [${f.level.toUpperCase()}] ${f.reason}`).join('\n') || 'No flags this week.'}

SICKNESS EPISODES (${sickness.length}):
${sickness.map(s => `- ${s.symptoms} (onset ${s.onset_date}${s.resolved_date ? `, resolved ${s.resolved_date}` : ', ongoing'})`).join('\n') || 'None.'}

ACTIVE MEDICATIONS (${meds.length}):
${meds.map(m => `- ${m.name} ${m.dose} ${m.frequency}`).join('\n') || 'None.'}

Write a 3-5 sentence plain-language summary. Mention specific readings and flag concerns clearly. End with a concrete recommendation for the caretaker.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const gptData = await res.json();
        summaryText = gptData.choices?.[0]?.message?.content ?? null;
        summarySource = 'openai/gpt-4o';
        summaryConfidence = 0.85;
      }
    } catch {
      // Fallback: generate rule-based summary
    }
  }

  // Fallback narrative if OpenAI unavailable
  if (!summaryText) {
    const flagCount = warningFlags.length;
    const criticalCount = warningFlags.filter(f => f.level === 'critical').length;
    summaryText = `Weekly summary for ${member?.full_name ?? 'this member'} (${weekStart.toDateString()} – ${weekEnd.toDateString()}). ${readings.length} readings recorded this week. ${
      flagCount === 0
        ? 'All readings were within normal ranges — no flags detected.'
        : `${flagCount} reading${flagCount > 1 ? 's' : ''} triggered alert${flagCount > 1 ? 's' : ''}${criticalCount > 0 ? `, including ${criticalCount} critical` : ''}.`
    } ${meds.length > 0 ? `Active medications: ${meds.map(m => m.name).join(', ')}.` : ''} ${sickness.length > 0 ? `Sickness episode(s) this week: ${sickness.map(s => s.symptoms).join('; ')}.` : ''} ${flagCount > 0 ? 'Review flagged readings with a doctor.' : 'Continue monitoring as usual.'}`;
    summarySource = 'rule-engine';
    summaryConfidence = 0.6;
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_label: 'anonymous',
    action: 'report_generated',
    table_name: 'weekly_reports',
    record_id: null,
    payload: { family_member_id, week_start: weekStart.toISOString().split('T')[0], flags: warningFlags.length },
  });

  const { data: report, error: reportError } = await supabase
    .from('weekly_reports')
    .insert({
      family_member_id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      summary_text: summaryText,
      summary_text_source: summarySource,
      summary_text_confidence: summaryConfidence,
      summary_text_review_status: 'unreviewed',
      warning_flags: warningFlags,
      warning_flags_source: 'rule-engine',
      warning_flags_confidence: 1.0,
      warning_flags_review_status: 'unreviewed',
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (reportError) return NextResponse.json(reportError.message, { status: 500 });
  return NextResponse.json(report, { status: 201 });
}
