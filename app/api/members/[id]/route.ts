import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('family_members').select('*').eq('id', id).single();
  if (error) return NextResponse.json(error.message, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { full_name, relationship, date_of_birth, blood_type, allergies, notes } = body;
  const { data, error } = await supabase
    .from('family_members')
    .update({ full_name, relationship, date_of_birth: date_of_birth || null, blood_type: blood_type || null, allergies: allergies || null, notes: notes || null })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
