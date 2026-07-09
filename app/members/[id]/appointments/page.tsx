'use client';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import MemberNav from '@/app/components/MemberNav';
import Modal from '@/app/components/Modal';
import Spinner from '@/app/components/Spinner';
import { Appointment } from '@/lib/types';

function ApptForm({ memberId, appt, onSaved, onCancel }: { memberId: string; appt?: Appointment; onSaved: (a: Appointment) => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const nowLocal = new Date(); nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  const [form, setForm] = useState({
    appointment_date: appt?.appointment_date ? new Date(appt.appointment_date).toISOString().slice(0, 16) : nowLocal.toISOString().slice(0, 16),
    doctor_name: appt?.doctor_name ?? '',
    clinic: appt?.clinic ?? '',
    reason: appt?.reason ?? '',
    outcome: appt?.outcome ?? '',
    follow_up_date: appt?.follow_up_date ?? '',
    status: appt?.status ?? 'upcoming',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = appt ? `/api/appointments/${appt.id}` : '/api/appointments';
      const method = appt ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ family_member_id: memberId, ...form }) });
      if (!res.ok) throw new Error(await res.text());
      toast.success(appt ? 'Updated' : 'Appointment added');
      onSaved(await res.json());
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Save failed'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="label">Date & Time *</label>
        <input type="datetime-local" className="input" value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} required />
      </div>
      <div>
        <label className="label">Doctor Name *</label>
        <input className="input" value={form.doctor_name} onChange={e => set('doctor_name', e.target.value)} placeholder="Dr. Name" required />
      </div>
      <div>
        <label className="label">Clinic / Hospital</label>
        <input className="input" value={form.clinic} onChange={e => set('clinic', e.target.value)} placeholder="e.g. St. Luke's" />
      </div>
      <div>
        <label className="label">Reason *</label>
        <input className="input" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Quarterly diabetes review" required />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div>
        <label className="label">Outcome (after visit)</label>
        <textarea className="input" rows={2} value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="Notes from visit..." />
      </div>
      <div>
        <label className="label">Follow-up Date</label>
        <input type="date" className="input" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading && <Spinner size={14} />} {appt ? 'Save Changes' : 'Add Appointment'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

const STATUS_BADGE: Record<string, string> = { upcoming: 'badge-blue', completed: 'badge-green', cancelled: 'badge-gray' };

export default function AppointmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | Appointment | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/appointments?member_id=${id}`).then(r => r.json()).then(setAppts).finally(() => setLoading(false));
  }, [id]);

  async function del(a: Appointment) {
    if (!confirm('Delete this appointment?')) return;
    setDeleting(a.id);
    await fetch(`/api/appointments/${a.id}`, { method: 'DELETE' });
    toast.success('Deleted');
    setAppts(as => as.filter(x => x.id !== a.id));
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href={`/members/${id}`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>Appointments</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Appointment</button>
      </div>
      <MemberNav memberId={id} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> :
        appts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ color: '#94a3b8' }}>No appointments yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setModal('add')}>+ Add Appointment</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appts.map(a => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{a.reason}</span>
                      <span className={`badge ${STATUS_BADGE[a.status] ?? 'badge-gray'}`}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      {new Date(a.appointment_date).toLocaleString()} · {a.doctor_name}
                      {a.clinic ? ` · ${a.clinic}` : ''}
                    </div>
                    {a.outcome && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>Outcome: {a.outcome}</div>}
                    {a.follow_up_date && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Follow-up: {a.follow_up_date}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setModal(a)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(a)} disabled={deleting === a.id}>
                      {deleting === a.id ? <Spinner size={12} /> : 'Del'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'add' ? 'Add Appointment' : 'Edit Appointment'} onClose={() => setModal(null)}>
          <ApptForm
            memberId={id}
            appt={modal !== 'add' ? modal : undefined}
            onSaved={a => {
              setAppts(as => modal !== 'add' ? as.map(x => x.id === a.id ? a : x) : [a, ...as]);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
