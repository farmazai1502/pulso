'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '', label: 'Dashboard' },
  { href: '/readings', label: 'Readings' },
  { href: '/sickness', label: 'Sickness' },
  { href: '/medications', label: 'Medications' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/reports', label: 'Reports' },
];

export default function MemberNav({ memberId }: { memberId: string }) {
  const pathname = usePathname();
  const base = `/members/${memberId}`;

  return (
    <nav className="flex gap-1 flex-wrap border-b border-slate-200 mb-6">
      {TABS.map(tab => {
        const href = `${base}${tab.href}`;
        const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
