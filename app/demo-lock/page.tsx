'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function DemoLockPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const resp = await fetch('/api/demo/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (resp.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await resp.json().catch(() => ({}));
      setError(data.error || 'Incorrect passcode');
      setCode('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center">Flip Tracker</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter access code to continue
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            required
            className="input text-center text-2xl tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="••••"
            maxLength={20}
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
