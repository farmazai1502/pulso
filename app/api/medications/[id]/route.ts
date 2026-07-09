import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { name, dose, frequency, start_date, end_date, prescribing_doctor, status, notes } = body;
  const { data, error } = await supabase
    .from('medications')
    .update({ name, dose, frequency, start_date, end_date: end_date || null, prescribing_doctor: prescribing_doctor || null, status, notes: notes || null })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
