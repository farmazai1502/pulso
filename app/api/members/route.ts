import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { full_name, relationship, date_of_birth, blood_type, allergies, notes } = body;
  if (!full_name?.trim()) return NextResponse.json('full_name is required', { status: 400 });
  const { data, error } = await supabase
    .from('family_members')
    .insert({ full_name: full_name.trim(), relationship, date_of_birth: date_of_birth || null, blood_type: blood_type || null, allergies: allergies || null, notes: notes || null })
    .select()
    .single();
  if (error) return NextResponse.json(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
