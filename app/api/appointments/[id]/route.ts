import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { appointment_date, doctor_name, clinic, reason, outcome, follow_up_date, status } = body;
  const { data, error } = await supabase
    .from('appointments')
    .update({ appointment_date, doctor_name, clinic: clinic || null, reason, outcome: outcome || null, follow_up_date: follow_up_date || null, status })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
