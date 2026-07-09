'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Modal from './components/Modal';
import FamilyMemberForm from './components/FamilyMemberForm';
import Spinner from './components/Spinner';
import { FamilyMember } from '@/lib/types';

const RELATIONSHIP_EMOJI: Record<string, string> = {
  self: '🧑',
  parent: '👴',
  child: '👶',
  other: '🧑‍🤝‍🧑',
};

function calcAge(dob?: string) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function HomePage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error(await res.text());
      setMembers(await res.json());
    } catch {
      toast.error('Failed to load family members');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Delete ${name} and ALL their health records? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${name} removed`);
      setMembers(m => m.filter(x => x.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally { setDeleting(null); }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Family Members</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 4 }}>Select a member to view their health dashboard</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Member
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '48px 0', justifyContent: 'center' }}>
          <Spinner /> Loading...
        </div>
      ) : members.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
          <p style={{ color: '#94a3b8' }}>No family members yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>Add First Member</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {members.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36 }}>{RELATIONSHIP_EMOJI[m.relationship] ?? '🧑'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                      {m.relationship}{m.date_of_birth ? ` · ${calcAge(m.date_of_birth)}y` : ''}
                      {m.blood_type ? ` · ${m.blood_type}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: '#ef4444' }}
                  onClick={() => deleteMember(m.id, m.full_name)}
                  disabled={deleting === m.id}
                >
                  {deleting === m.id ? <Spinner size={12} /> : '✕'}
                </button>
              </div>
              {m.allergies && (
                <div style={{ fontSize: '0.75rem', color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: 4 }}>
                  ⚠️ Allergies: {m.allergies}
                </div>
              )}
              {m.notes && <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.notes}</p>}
              <Link
                href={`/members/${m.id}`}
                className="btn btn-primary"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                View Dashboard →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Family Member" onClose={() => setShowAdd(false)}>
          <FamilyMemberForm
            onSaved={member => { setMembers(m => [...m, member]); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
    </div>
  );
}
