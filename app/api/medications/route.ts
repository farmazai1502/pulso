import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const memberId = req.nextUrl.searchParams.get('member_id');
  let query = supabase.from('medications').select('*').order('start_date', { ascending: false });
  if (memberId) query = query.eq('family_member_id', memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { family_member_id, name, dose, frequency, start_date, end_date, prescribing_doctor, status, notes } = body;
  if (!family_member_id || !name?.trim() || !dose?.trim() || !frequency?.trim() || !start_date) {
    return NextResponse.json('family_member_id, name, dose, frequency, start_date required', { status: 400 });
  }
  const { data, error } = await supabase
    .from('medications')
    .insert({ family_member_id, name, dose, frequency, start_date, end_date: end_date || null, prescribing_doctor: prescribing_doctor || null, status: status || 'active', notes: notes || null })
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
