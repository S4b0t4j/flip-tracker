'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Map, FileText, Settings, MessageSquareWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/feedback', label: 'Feedback', icon: MessageSquareWarning },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[250px] flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
          F
        </div>
        <span className="text-lg font-bold">Flip Tracker</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <form action="/auth/sign-out" method="POST">
          <button type="submit" className="btn-ghost w-full justify-start text-sm">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
