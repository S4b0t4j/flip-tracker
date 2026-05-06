'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function FeedbackForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [type, setType] = useState<'Feature Request' | 'Bug Report'>('Bug Report');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const context = JSON.stringify({
      url: typeof window !== 'undefined' ? window.location.href : pathname,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
    const { error } = await supabase.from('feedback_logs').insert({
      user_id: user!.id,
      type,
      severity,
      title: title.trim(),
      description: description || null,
      email: email || null,
      context,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Thanks for the feedback');
    setTitle('');
    setDescription('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            {(['Bug Report', 'Feature Request'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`btn ${type === t ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Severity</label>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Title *</label>
        <input
          className="input"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[120px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened, what did you expect, steps to reproduce…"
        />
      </div>
      <div>
        <label className="label">Reply-to email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Submitting…' : 'Submit feedback'}
        </button>
      </div>
    </form>
  );
}
