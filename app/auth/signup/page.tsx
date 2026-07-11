'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Spinner from '@/app/components/Spinner';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast.success('Account created! Redirecting...');
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginError) {
          router.push('/');
        } else {
          router.push('/auth/login');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>Start tracking your family's health</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <><Spinner size={14} /> Creating account...</> : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
