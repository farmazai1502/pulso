import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('weekly_reports').select('*').eq('id', id).single();
  if (error) return NextResponse.json(error.message, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('weekly_reports').delete().eq('id', id);
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
