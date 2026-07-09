'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Spinner from '@/app/components/Spinner';
import { WeeklyReport, WarningFlag } from '@/lib/types';

export default function ReportDetailPage({ params }: { params: Promise<{ id: string; reportId: string }> }) {
  const { id, reportId } = use(params);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setReport)
      .catch(() => toast.error('Report not found'))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return <div style={{ textAlign: 'center', padding: 64 }}><Spinner /></div>;
  if (!report) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <p style={{ color: '#94a3b8' }}>Report not found.</p>
      <Link href={`/members/${id}/reports`} className="btn btn-ghost" style={{ marginTop: 12, textDecoration: 'none' }}>← Back to Reports</Link>
    </div>
  );

  const flags = (report.warning_flags as WarningFlag[] | null) ?? [];
  const critical = flags.filter(f => f.level === 'critical');
  const warnings = flags.filter(f => f.level === 'warning');

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href={`/members/${id}/reports`} style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>← Back to Reports</Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 8 }}>📋 Weekly Health Report</h1>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
          {report.week_start} → {report.week_end} &nbsp;·&nbsp;
          Generated {report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'} &nbsp;·&nbsp;
          <span style={{ color: report.summary_text_source?.includes('openai') ? '#7c3aed' : '#64748b' }}>
            {report.summary_text_source ?? 'rule-engine'}
          </span>
        </div>
      </div>

      {/* Warning Flags */}
      {flags.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>⚠️ Alert Flags</h2>
          {critical.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Critical</div>
              {critical.map((f, i) => (
                <div key={i} style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: '#dc2626' }}>🚨 {f.test_type}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: 2 }}>{f.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: 2 }}>
                    {new Date(f.reading_date).toLocaleDateString()} · {f.value}{f.value_secondary != null ? `/${f.value_secondary}` : ''} {f.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Warnings</div>
              {warnings.map((f, i) => (
                <div key={i} style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: '#d97706' }}>⚠️ {f.test_type}</div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: 2 }}>{f.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 2 }}>
                    {new Date(f.reading_date).toLocaleDateString()} · {f.value}{f.value_secondary != null ? `/${f.value_secondary}` : ''} {f.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, color: '#16a34a' }}>✅ No flags this week — all readings within normal ranges.</span>
        </div>
      )}

      {/* AI / Rule-engine Summary */}
      {report.summary_text && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
              {report.summary_text_source?.includes('openai') ? '🤖 AI Summary' : '📊 Summary'}
            </h2>
            {report.summary_text_source?.includes('openai') && (
              <span className="badge badge-blue">GPT-4o</span>
            )}
          </div>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '0.925rem' }}>{report.summary_text}</p>
          {report.summary_text_confidence != null && (
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 10 }}>
              Confidence: {Math.round(report.summary_text_confidence * 100)}% · Review status: {report.summary_text_review_status ?? 'unreviewed'}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Link href={`/members/${id}/reports`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>← All Reports</Link>
        <Link href={`/members/${id}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Dashboard →</Link>
      </div>
    </div>
  );
}
