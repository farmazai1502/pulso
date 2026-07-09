'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Dot
} from 'recharts';
import MemberNav from '@/app/components/MemberNav';
import Spinner from '@/app/components/Spinner';
import { FamilyMember, TestReading, Medication, Appointment, SicknessEntry } from '@/lib/types';

function TrendChart({ readings, testType }: { readings: TestReading[]; testType: string }) {
  const data = readings
    .filter(r => r.test_type === testType)
    .slice(0, 30)
    .reverse()
    .map(r => ({
      date: new Date(r.reading_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.value,
      value2: r.value_secondary,
      flagged: r.flagged,
    }));

  if (data.length === 0) return <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No {testType} readings yet</div>;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 6 }}
          formatter={(val: number, name: string) => [val, name === 'value' ? testType : 'Diastolic']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={payload.flagged ? '#ef4444' : '#0ea5e9'} />;
          }}
        />
        {data.some(d => d.value2 != null) && (
          <Line type="monotone" dataKey="value2" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 2"
            dot={(props) => {
              const { cx, cy } = props;
              return <circle key={`dot2-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#7c3aed" />;
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function MemberDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [readings, setReadings] = useState<TestReading[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sickness, setSickness] = useState<SicknessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mRes, rRes, medRes, apptRes, sickRes] = await Promise.all([
          fetch(`/api/members/${id}`),
          fetch(`/api/readings?member_id=${id}&limit=90`),
          fetch(`/api/medications?member_id=${id}`),
          fetch(`/api/appointments?member_id=${id}`),
          fetch(`/api/sickness?member_id=${id}`),
        ]);
        if (!mRes.ok) { router.push('/'); return; }
        const [m, r, med, appt, sick] = await Promise.all([mRes.json(), rRes.json(), medRes.json(), apptRes.json(), sickRes.json()]);
        setMember(m); setReadings(r); setMedications(med); setAppointments(appt); setSickness(sick);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    }
    load();
  }, [id, router]);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_member_id: id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const report = await res.json();
      toast.success('Report generated!');
      router.push(`/members/${id}/reports/${report.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally { setGenerating(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '64px 0', justifyContent: 'center' }}>
      <Spinner /> Loading dashboard...
    </div>
  );
  if (!member) return null;

  const testTypes = [...new Set(readings.map(r => r.test_type))];
  const activeMeds = medications.filter(m => m.status === 'active');
  const upcoming = appointments.filter(a => a.status === 'upcoming' && new Date(a.appointment_date) >= new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 5);
  const recentSickness = sickness.slice(0, 3);
  const flaggedCount = readings.filter(r => r.flagged).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Link href="/" style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← All Members</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{member.full_name}</h1>
          <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>
            {member.relationship} {member.date_of_birth ? `· Born ${new Date(member.date_of_birth).toLocaleDateString()}` : ''} {member.blood_type ? `· ${member.blood_type}` : ''}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateReport}
          disabled={generating}
          style={{ gap: 8 }}
        >
          {generating ? <><Spinner size={14} /> Generating...</> : '📋 Generate Weekly Report'}
        </button>
      </div>

      <MemberNav memberId={id} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Readings', value: readings.length, icon: '📊' },
          { label: 'Flagged', value: flaggedCount, icon: '🚨', alert: flaggedCount > 0 },
          { label: 'Active Meds', value: activeMeds.length, icon: '💊' },
          { label: 'Upcoming Appts', value: upcoming.length, icon: '📅' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.alert ? '#dc2626' : '#0f172a' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {testTypes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {testTypes.map(type => (
            <div key={type} className="card">
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{type}</h3>
              <TrendChart readings={readings} testType={type} />
              {readings.filter(r => r.test_type === type && r.flagged).length > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ background: '#ef4444', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  {readings.filter(r => r.test_type === type && r.flagged).length} flagged reading(s)
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px 0', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No test readings yet.</p>
          <Link href={`/members/${id}/readings`} className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}>+ Add Reading</Link>
        </div>
      )}

      {/* Bottom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Active Medications */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>💊 Active Medications</h3>
            <Link href={`/members/${id}/medications`} style={{ fontSize: '0.7rem', color: '#0ea5e9', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {activeMeds.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No active medications</p> :
            activeMeds.map(m => (
              <div key={m.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{m.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.dose} · {m.frequency}</div>
              </div>
            ))
          }
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>📅 Upcoming Appointments</h3>
            <Link href={`/members/${id}/appointments`} style={{ fontSize: '0.7rem', color: '#0ea5e9', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {upcoming.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No upcoming appointments</p> :
            upcoming.map(a => (
              <div key={a.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.reason}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(a.appointment_date).toLocaleDateString()} · {a.doctor_name}</div>
              </div>
            ))
          }
        </div>

        {/* Recent Sickness */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>🤒 Recent Sickness</h3>
            <Link href={`/members/${id}/sickness`} style={{ fontSize: '0.7rem', color: '#0ea5e9', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {recentSickness.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No sickness entries</p> :
            recentSickness.map(s => (
              <div key={s.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.symptoms.slice(0, 60)}{s.symptoms.length > 60 ? '…' : ''}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {s.onset_date} {!s.resolved_date ? <span className="badge badge-amber">Ongoing</span> : ''}
                </div>
              </div>
            ))
          }
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { href: `/members/${id}/readings`, label: '+ Log Reading', icon: '📊' },
              { href: `/members/${id}/sickness`, label: '+ Log Illness', icon: '🤒' },
              { href: `/members/${id}/medications`, label: '+ Add Medication', icon: '💊' },
              { href: `/members/${id}/appointments`, label: '+ Add Appointment', icon: '📅' },
              { href: `/members/${id}/reports`, label: 'View Reports', icon: '📋' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="btn btn-ghost" style={{ textDecoration: 'none', justifyContent: 'flex-start', fontSize: '0.8rem' }}>
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
