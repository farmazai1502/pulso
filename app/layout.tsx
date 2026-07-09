import type { Metadata } from 'next';
import './globals.css';
import Toaster from './components/Toaster';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pulso – Family Health Journal',
  description: 'Track health records, medications, appointments, and self-test readings for your family.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{ fontSize: 22 }}>🫀</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0ea5e9', letterSpacing: '-0.01em' }}>Pulso</span>
            </Link>
            <span style={{ color: '#cbd5e1', margin: '0 8px' }}>|</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Family Health Journal</span>
          </div>
        </header>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
