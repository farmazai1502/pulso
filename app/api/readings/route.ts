import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateReading } from '@/lib/rule-engine';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const memberId = req.nextUrl.searchParams.get('member_id');
  let query = supabase.from('test_readings').select('*').order('reading_date', { ascending: false });
  if (memberId) query = query.eq('family_member_id', memberId);
  const limit = req.nextUrl.searchParams.get('limit');
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { family_member_id, reading_date, test_type, value, value_secondary, unit, notes } = body;
  if (!family_member_id || !test_type || value == null || !unit) {
    return NextResponse.json('family_member_id, test_type, value, unit required', { status: 400 });
  }
  const { flagged } = evaluateReading({ test_type, value: Number(value), value_secondary: value_secondary != null ? Number(value_secondary) : null, unit });
  const { data, error } = await supabase
    .from('test_readings')
    .insert({
      family_member_id,
      reading_date: reading_date || new Date().toISOString(),
      test_type,
      value: Number(value),
      value_secondary: value_secondary != null ? Number(value_secondary) : null,
      unit,
      notes: notes || null,
      flagged,
    })
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
