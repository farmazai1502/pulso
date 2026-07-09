import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { onset_date, resolved_date, symptoms, diagnosis, treated_by, notes } = body;
  const { data, error } = await supabase
    .from('sickness_entries')
    .update({ onset_date, resolved_date: resolved_date || null, symptoms, diagnosis: diagnosis || null, treated_by: treated_by || null, notes: notes || null })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('sickness_entries').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
