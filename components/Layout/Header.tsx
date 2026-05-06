'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header({ userEmail }: { userEmail: string }) {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/properties?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="fixed left-[250px] right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <form onSubmit={onSearch} className="relative w-96 max-w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search properties…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-9"
        />
      </form>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="btn-ghost p-2" aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="text-sm text-muted-foreground">{userEmail}</div>
      </div>
    </header>
  );
}
