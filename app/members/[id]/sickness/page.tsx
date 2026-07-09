'use client';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import MemberNav from '@/app/components/MemberNav';
import Modal from '@/app/components/Modal';
import Spinner from '@/app/components/Spinner';
import { SicknessEntry } from '@/lib/types';

function SicknessForm({ memberId, entry, onSaved, onCancel }: { memberId: string; entry?: SicknessEntry; onSaved: (e: SicknessEntry) => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    onset_date: entry?.onset_date ?? new Date().toISOString().split('T')[0],
    resolved_date: entry?.resolved_date ?? '',
    symptoms: entry?.symptoms ?? '',
    diagnosis: entry?.diagnosis ?? '',
    treated_by: entry?.treated_by ?? '',
    notes: entry?.notes ?? '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.symptoms.trim()) { toast.error('Symptoms required'); return; }
    setLoading(true);
    try {
      const url = entry ? `/api/sickness/${entry.id}` : '/api/sickness';
      const method = entry ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ family_member_id: memberId, ...form }) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(entry ? 'Updated' : 'Entry added');
      onSaved(await res.json());
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Save failed'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label">Onset Date *</label>
          <input type="date" className="input" value={form.onset_date} onChange={e => set('onset_date', e.target.value)} required />
        </div>
        <div>
          <label className="label">Resolved Date</label>
          <input type="date" className="input" value={form.resolved_date} onChange={e => set('resolved_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Symptoms *</label>
        <textarea className="input" rows={2} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} placeholder="Describe symptoms..." required />
      </div>
      <div>
        <label className="label">Diagnosis</label>
        <input className="input" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="e.g. Hypertensive episode" />
      </div>
      <div>
        <label className="label">Treated By</label>
        <input className="input" value={form.treated_by} onChange={e => set('treated_by', e.target.value)} placeholder="Doctor name" />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading && <Spinner size={14} />} {entry ? 'Save Changes' : 'Add Entry'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function SicknessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries] = useState<SicknessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | SicknessEntry | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sickness?member_id=${id}`).then(r => r.json()).then(setEntries).finally(() => setLoading(false));
  }, [id]);

  async function del(e: SicknessEntry) {
    if (!confirm('Delete this entry?')) return;
    setDeleting(e.id);
    await fetch(`/api/sickness/${e.id}`, { method: 'DELETE' });
    toast.success('Deleted');
    setEntries(es => es.filter(x => x.id !== e.id));
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href={`/members/${id}`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>Sickness History</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Log Illness</button>
      </div>
      <MemberNav memberId={id} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> :
        entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤒</div>
            <p style={{ color: '#94a3b8' }}>No sickness entries yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setModal('add')}>+ Log Illness</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map(e => (
              <div key={e.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.symptoms}</div>
                    {e.diagnosis && <div style={{ color: '#475569', fontSize: '0.875rem', marginTop: 2 }}>Dx: {e.diagnosis}</div>}
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                      {e.onset_date} → {e.resolved_date ?? <span className="badge badge-amber">Ongoing</span>}
                      {e.treated_by && ` · ${e.treated_by}`}
                    </div>
                    {e.notes && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{e.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setModal(e)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(e)} disabled={deleting === e.id}>
                      {deleting === e.id ? <Spinner size={12} /> : 'Del'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'add' ? 'Log Sickness Entry' : 'Edit Entry'} onClose={() => setModal(null)}>
          <SicknessForm
            memberId={id}
            entry={modal !== 'add' ? modal : undefined}
            onSaved={s => {
              setEntries(es => modal !== 'add' ? es.map(x => x.id === s.id ? s : x) : [s, ...es]);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
