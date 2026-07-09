import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateReading } from '@/lib/rule-engine';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { reading_date, test_type, value, value_secondary, unit, notes } = body;
  const { flagged } = evaluateReading({ test_type, value: Number(value), value_secondary: value_secondary != null ? Number(value_secondary) : null, unit });
  const { data, error } = await supabase
    .from('test_readings')
    .update({ reading_date, test_type, value: Number(value), value_secondary: value_secondary != null ? Number(value_secondary) : null, unit, notes: notes || null, flagged })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('test_readings').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
