'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import Spinner from './Spinner';
import { FamilyMember } from '@/lib/types';

interface Props {
  member?: Partial<FamilyMember>;
  onSaved: (member: FamilyMember) => void;
  onCancel: () => void;
}

export default function FamilyMemberForm({ member, onSaved, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: member?.full_name ?? '',
    relationship: member?.relationship ?? 'self',
    date_of_birth: member?.date_of_birth ?? '',
    blood_type: member?.blood_type ?? '',
    allergies: member?.allergies ?? '',
    notes: member?.notes ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    setLoading(true);
    try {
      const url = member?.id ? `/api/members/${member.id}` : '/api/members';
      const method = member?.id ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      toast.success(member?.id ? 'Member updated' : 'Member added');
      onSaved(saved);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Full Name *</label>
        <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Carlos Santos" required />
      </div>
      <div>
        <label className="label">Relationship</label>
        <select className="input" value={form.relationship} onChange={e => set('relationship', e.target.value)}>
          <option value="self">Self</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date of Birth</label>
          <input type="date" className="input" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
        </div>
        <div>
          <label className="label">Blood Type</label>
          <select className="input" value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
            <option value="">Unknown</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Allergies</label>
        <input className="input" value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Dust mites" />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Conditions, context..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <Spinner size={14} />} {member?.id ? 'Save Changes' : 'Add Member'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
