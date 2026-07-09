import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const memberId = req.nextUrl.searchParams.get('member_id');
  let query = supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
  if (memberId) query = query.eq('family_member_id', memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { family_member_id, appointment_date, doctor_name, clinic, reason, outcome, follow_up_date, status } = body;
  if (!family_member_id || !appointment_date || !doctor_name?.trim() || !reason?.trim()) {
    return NextResponse.json('family_member_id, appointment_date, doctor_name, reason required', { status: 400 });
  }
  const { data, error } = await supabase
    .from('appointments')
    .insert({ family_member_id, appointment_date, doctor_name, clinic: clinic || null, reason, outcome: outcome || null, follow_up_date: follow_up_date || null, status: status || 'upcoming' })
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
