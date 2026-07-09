'use client';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import MemberNav from '@/app/components/MemberNav';
import Modal from '@/app/components/Modal';
import Spinner from '@/app/components/Spinner';
import { TestReading, TEST_TYPE_UNITS } from '@/lib/types';

const TEST_TYPES = Object.keys(TEST_TYPE_UNITS);

function ReadingForm({ memberId, reading, onSaved, onCancel }: { memberId: string; reading?: TestReading; onSaved: (r: TestReading) => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const nowLocal = new Date(); nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  const [form, setForm] = useState({
    test_type: reading?.test_type ?? 'Fasting Glucose',
    value: reading?.value?.toString() ?? '',
    value_secondary: reading?.value_secondary?.toString() ?? '',
    unit: reading?.unit ?? TEST_TYPE_UNITS['Fasting Glucose'].unit,
    reading_date: reading?.reading_date ? new Date(reading.reading_date).toISOString().slice(0, 16) : nowLocal.toISOString().slice(0, 16),
    notes: reading?.notes ?? '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function onTypeChange(type: string) {
    setForm(f => ({ ...f, test_type: type, unit: TEST_TYPE_UNITS[type]?.unit ?? '', value_secondary: '' }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value) { toast.error('Value is required'); return; }
    setLoading(true);
    try {
      const url = reading ? `/api/readings/${reading.id}` : '/api/readings';
      const method = reading ? 'PATCH' : 'POST';
      const body = { family_member_id: memberId, ...form, value: parseFloat(form.value), value_secondary: form.value_secondary ? parseFloat(form.value_secondary) : null };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(reading ? 'Reading updated' : 'Reading logged');
      onSaved(await res.json());
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Save failed'); }
    finally { setLoading(false); }
  }

  const meta = TEST_TYPE_UNITS[form.test_type] ?? { unit: '' };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="label">Test Type *</label>
        <select className="input" value={form.test_type} onChange={e => onTypeChange(e.target.value)}>
          {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: meta.hasSecondary ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
        <div>
          <label className="label">{meta.hasSecondary ? 'Systolic' : 'Value'} *</label>
          <input type="number" step="any" className="input" value={form.value} onChange={e => set('value', e.target.value)} required />
        </div>
        {meta.hasSecondary && (
          <div>
            <label className="label">{meta.secondaryLabel ?? 'Secondary'}</label>
            <input type="number" step="any" className="input" value={form.value_secondary} onChange={e => set('value_secondary', e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Unit</label>
          <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Date & Time *</label>
        <input type="datetime-local" className="input" value={form.reading_date} onChange={e => set('reading_date', e.target.value)} required />
      </div>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Fasting, post-meal..." />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading && <Spinner size={14} />} {reading ? 'Save Changes' : 'Log Reading'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function ReadingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [readings, setReadings] = useState<TestReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | TestReading | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/readings?member_id=${id}`);
      setReadings(await res.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function del(r: TestReading) {
    if (!confirm('Delete this reading?')) return;
    setDeleting(r.id);
    try {
      await fetch(`/api/readings/${r.id}`, { method: 'DELETE' });
      toast.success('Deleted');
      setReadings(rs => rs.filter(x => x.id !== r.id));
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href={`/members/${id}`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>Test Readings</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Log Reading</button>
      </div>
      <MemberNav memberId={id} />

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><Spinner /></div> :
        readings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ color: '#94a3b8' }}>No readings yet. Log your first!</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setModal('add')}>+ Log Reading</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Date', 'Type', 'Value', 'Notes', 'Flag', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: r.flagged ? '#fff7f7' : undefined }}>
                    <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(r.reading_date).toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{r.test_type}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: r.flagged ? '#dc2626' : '#0f172a' }}>
                      {r.value}{r.value_secondary != null ? `/${r.value_secondary}` : ''} <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.8rem' }}>{r.unit}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.8rem' }}>{r.notes ?? '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {r.flagged ? <span className="badge badge-red">⚠ Flag</span> : <span className="badge badge-green">OK</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setModal(r)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => del(r)} disabled={deleting === r.id}>
                          {deleting === r.id ? <Spinner size={12} /> : 'Del'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'add' ? 'Log Test Reading' : 'Edit Reading'} onClose={() => setModal(null)}>
          <ReadingForm
            memberId={id}
            reading={modal !== 'add' ? modal : undefined}
            onSaved={r => {
              setReadings(rs => modal !== 'add' ? rs.map(x => x.id === r.id ? r : x) : [r, ...rs]);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
