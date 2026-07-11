'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/app/components/Spinner';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏥 Pulso
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/auth/login" className="btn" style={{ background: 'white', color: '#667eea', textDecoration: 'none' }}>
            Login
          </Link>
          <Link href="/auth/signup" className="btn btn-primary" style={{ textDecoration: 'none', background: '#10b981' }}>
            Sign Up
          </Link>
        </div>
      </nav>

      <section style={{ padding: '80px 40px', textAlign: 'center', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>
          Family Health, All in One Place
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: 40, opacity: 0.95, lineHeight: 1.6 }}>
          Track health readings, medications, appointments, and wellness for your entire family. Stay informed, stay healthy.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          <Link href="/auth/signup" className="btn" style={{ background: 'white', color: '#667eea', padding: '14px 32px', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderRadius: 8, border: 'none' }}>
            Get Started Free
          </Link>
          <a href="#features" className="btn" style={{ background: 'transparent', color: 'white', padding: '14px 32px', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderRadius: 8, border: '2px solid white' }}>
            Learn More
          </a>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.2)' }}>
          <video width="100%" height="auto" controls style={{ display: 'block', width: '100%', maxWidth: '100%' }}>
            <source src="https://fxglzsjrktbxfkzpixyf.supabase.co/storage/v1/object/public/Videos/dreamina-2026-07-11-9751-Create%20a%20premium%20ultra-realistic%2016_9%20co....mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      <section id="features" style={{ background: 'white', padding: '80px 40px', marginTop: 60 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: 60, color: '#0f172a' }}>
            Why Pulso?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Track Health Data</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Log blood pressure, glucose levels, weight, temperature, and more. Get instant insights with visual charts.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>💊</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Manage Medications</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Keep track of medications, dosages, and schedules. Get reminders to take medications on time.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Appointments Made Easy</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Schedule and manage doctor appointments. Scan appointment cards to auto-fill details.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>AI-Powered Insights</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Get weekly health reports with AI summaries and early warning flags for abnormal readings.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Store Documents</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Upload medical documents, prescriptions, and ID cards. Extract text automatically with OCR.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Family Focused</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Manage health for multiple family members in one dashboard. All data is private and secure.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#f8fafc', padding: '80px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: 60, color: '#0f172a' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 16px' }}>1</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Sign Up</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Create your account with email or Google. It takes less than a minute.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 16px' }}>2</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Add Family</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Add family members and start tracking their health data.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 16px' }}>3</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Log & Track</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Log readings, medications, appointments. View charts and trends.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 16px' }}>4</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Get Insights</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>Receive AI-powered weekly reports and health alerts.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '80px 40px', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 20 }}>Ready to Take Control of Your Family's Health?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: 30, opacity: 0.95 }}>Join thousands of families tracking health smarter with Pulso.</p>
        <Link href="/auth/signup" className="btn" style={{ background: 'white', color: '#667eea', padding: '14px 32px', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderRadius: 8, border: 'none' }}>
          Sign Up Free
        </Link>
      </section>

      <footer style={{ background: '#0f172a', color: 'white', padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: 0, opacity: 0.8 }}>© 2026 Pulso. All rights reserved. | Privacy Policy | Terms of Service</p>
      </footer>
    </div>
  );
}
