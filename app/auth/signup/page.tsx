'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Spinner from '@/app/components/Spinner';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
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
        options: {
          data: { full_name: fullName },
        },
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

  async function handleGoogleSignup() {
    setGmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google signup failed';
      toast.error(msg);
      setGmailLoading(false);
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

        <button
          onClick={handleGoogleSignup}
          disabled={gmailLoading}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            background: 'white',
            borderRadius: 6,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'white')}
        >
          {gmailLoading ? (
            <><Spinner size={14} /> Signing up with Google...</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
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
