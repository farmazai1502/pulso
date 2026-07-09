'use client';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import MemberNav from '@/app/components/MemberNav';
import Modal from '@/app/components/Modal';
import Spinner from '@/app/components/Spinner';
import { Medication } from '@/lib/types';

function MedForm({ memberId, med, onSaved, onCancel }: { memberId: string; med?: Medication; onSaved: (m: Medication) => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: med?.name ?? '',
    dose: med?.dose ?? '',
    frequency: med?.frequency ?? '',
    start_date: med?.start_date ?? new Date().toISOString().split('T')[0],
    end_date: med?.end_date ?? '',
    prescribing_doctor: med?.prescribing_doctor ?? '',
    status: med?.status ?? 'active',
    notes: med?.notes ?? '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = med ? `/api/medications/${med.id}` : '/api/medications';
      const method = med ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ family_member_id: memberId, ...form }) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(med ? 'Updated' : 'Medication added');
      onSaved(await res.json());
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Save failed'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="label">Medication Name *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Metformin" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label">Dose *</label>
          <input className="input" value={form.dose} onChange={e => set('dose', e.target.value)} placeholder="e.g. 500mg" required />
        </div>
        <div>
          <label className="label">Frequency *</label>
          <input className="input" value={form.frequency} onChange={e => set('frequency', e.target.value)} placeholder="e.g. Twice daily" required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label">Start Date *</label>
          <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Prescribing Doctor</label>
        <input className="input" value={form.prescribing_doctor} onChange={e => set('prescribing_doctor', e.target.value)} placeholder="Dr. Name" />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading && <Spinner size={14} />} {med ? 'Save Changes' : 'Add Medication'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function MedicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | Medication | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/medications?member_id=${id}`).then(r => r.json()).then(setMeds).finally(() => setLoading(false));
  }, [id]);

  async function del(m: Medication) {
    if (!confirm('Delete this medication?')) return;
    setDeleting(m.id);
    await fetch(`/api/medications/${m.id}`, { method: 'DELETE' });
    toast.success('Deleted');
    setMeds(ms => ms.filter(x => x.id !== m.id));
    setDeleting(null);
  }

  async function toggle(m: Medication) {
    setToggling(m.id);
    const newStatus = m.status === 'active' ? 'stopped' : 'active';
    const res = await fetch(`/api/medications/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, status: newStatus }) });
    if (res.ok) {
      const updated = await res.json();
      setMeds(ms => ms.map(x => x.id === m.id ? updated : x));
      toast.success(`Marked as ${newStatus}`);
    }
    setToggling(null);
  }

  const active = meds.filter(m => m.status === 'active');
  const stopped = meds.filter(m => m.status === 'stopped');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href={`/members/${id}`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>Medications</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Medication</button>
      </div>
      <MemberNav memberId={id} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> :
        meds.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
            <p style={{ color: '#94a3b8' }}>No medications logged yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setModal('add')}>+ Add Medication</button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>✅ Active ({active.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {active.map(m => <MedCard key={m.id} med={m} onEdit={() => setModal(m)} onDel={() => del(m)} onToggle={() => toggle(m)} deleting={deleting === m.id} toggling={toggling === m.id} />)}
                </div>
              </div>
            )}
            {stopped.length > 0 && (
              <div>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>⏹ Stopped ({stopped.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stopped.map(m => <MedCard key={m.id} med={m} onEdit={() => setModal(m)} onDel={() => del(m)} onToggle={() => toggle(m)} deleting={deleting === m.id} toggling={toggling === m.id} />)}
                </div>
              </div>
            )}
          </>
        )
      }

      {modal && (
        <Modal title={modal === 'add' ? 'Add Medication' : 'Edit Medication'} onClose={() => setModal(null)}>
          <MedForm
            memberId={id}
            med={modal !== 'add' ? modal : undefined}
            onSaved={m => {
              setMeds(ms => modal !== 'add' ? ms.map(x => x.id === m.id ? m : x) : [m, ...ms]);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function MedCard({ med: m, onEdit, onDel, onToggle, deleting, toggling }: { med: Medication; onEdit: () => void; onDel: () => void; onToggle: () => void; deleting: boolean; toggling: boolean }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600 }}>{m.name} <span style={{ fontWeight: 400, color: '#64748b' }}>{m.dose}</span></div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{m.frequency}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
            Started {m.start_date}{m.end_date ? ` · Ended ${m.end_date}` : ''}
            {m.prescribing_doctor ? ` · ${m.prescribing_doctor}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
          <button className="btn btn-sm btn-ghost" onClick={onToggle} disabled={toggling} style={{ fontSize: '0.7rem' }}>
            {toggling ? <Spinner size={12} /> : m.status === 'active' ? 'Stop' : 'Reactivate'}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={onEdit}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={onDel} disabled={deleting}>
            {deleting ? <Spinner size={12} /> : 'Del'}
          </button>
        </div>
      </div>
    </div>
  );
}
