import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const memberId = req.nextUrl.searchParams.get('member_id');
  let query = supabase.from('sickness_entries').select('*').order('onset_date', { ascending: false });
  if (memberId) query = query.eq('family_member_id', memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { family_member_id, onset_date, resolved_date, symptoms, diagnosis, treated_by, notes } = body;
  if (!family_member_id || !onset_date || !symptoms?.trim()) {
    return NextResponse.json('family_member_id, onset_date, and symptoms are required', { status: 400 });
  }
  const { data, error } = await supabase
    .from('sickness_entries')
    .insert({ family_member_id, onset_date, resolved_date: resolved_date || null, symptoms, diagnosis: diagnosis || null, treated_by: treated_by || null, notes: notes || null })
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
