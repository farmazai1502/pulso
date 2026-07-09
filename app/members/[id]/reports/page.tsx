'use client';
import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MemberNav from '@/app/components/MemberNav';
import Spinner from '@/app/components/Spinner';
import { WeeklyReport } from '@/lib/types';

export default function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports?member_id=${id}`).then(r => r.json()).then(setReports).finally(() => setLoading(false));
  }, [id]);

  async function generate() {
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
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally { setGenerating(false); }
  }

  async function del(report: WeeklyReport) {
    if (!confirm('Delete this report?')) return;
    setDeleting(report.id);
    await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
    toast.success('Deleted');
    setReports(rs => rs.filter(x => x.id !== report.id));
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href={`/members/${id}`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>Weekly Reports</h1>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating}>
          {generating ? <><Spinner size={14} /> Generating...</> : '📋 Generate Weekly Report'}
        </button>
      </div>
      <MemberNav memberId={id} />

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div> :
        reports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ color: '#94a3b8', marginBottom: 4 }}>No reports generated yet.</p>
            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', marginBottom: 16 }}>Reports summarise the past 7 days of readings, flags, and medications.</p>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? <><Spinner size={14} /> Generating...</> : '📋 Generate First Report'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map(r => {
              const flags = (r.warning_flags as { level: string }[] | null) ?? [];
              const critical = flags.filter(f => f.level === 'critical').length;
              const warnings = flags.filter(f => f.level === 'warning').length;
              return (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Week of {r.week_start} → {r.week_end}</span>
                        {critical > 0 && <span className="badge badge-red">🚨 {critical} Critical</span>}
                        {warnings > 0 && <span className="badge badge-amber">⚠ {warnings} Warning{warnings > 1 ? 's' : ''}</span>}
                        {flags.length === 0 && <span className="badge badge-green">✓ All Clear</span>}
                      </div>
                      {r.summary_text && (
                        <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                          {r.summary_text.slice(0, 160)}{r.summary_text.length > 160 ? '…' : ''}
                        </p>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>
                        Generated {r.generated_at ? new Date(r.generated_at).toLocaleString() : '—'} · {r.summary_text_source ?? 'rule-engine'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <Link href={`/members/${id}/reports/${r.id}`} className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>View</Link>
                      <button className="btn btn-sm btn-danger" onClick={() => del(r)} disabled={deleting === r.id}>
                        {deleting === r.id ? <Spinner size={12} /> : 'Del'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
