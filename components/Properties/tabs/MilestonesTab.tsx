'use client';

import { useState } from 'react';
import { Plus, Check, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Common/Modal';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { MILESTONE_TYPES, type Milestone } from '@/lib/types';

export function MilestonesTab({ propertyId, milestones }: { propertyId: string; milestones: Milestone[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  async function toggleComplete(m: Milestone) {
    const supabase = createClient();
    const actual = m.actual_date ? null : new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('milestones').update({ actual_date: actual }).eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from('milestones').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Milestone deleted');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Milestones</h3>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-sm">
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 w-8"></th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">Actual</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const done = !!m.actual_date;
                return (
                  <tr key={m.id} className="border-t border-border table-row-hover">
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleComplete(m)}
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          done ? 'border-green-500 bg-green-500 text-white' : 'border-border'
                        }`}
                        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {done && <Check className="h-3 w-3" />}
                      </button>
                    </td>
                    <td className={`px-4 py-2 font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                      {m.milestone_type}
                    </td>
                    <td className="px-4 py-2">{formatDate(m.target_date)}</td>
                    <td className="px-4 py-2">{formatDate(m.actual_date)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.notes || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => { setEditing(m); setShowForm(true); }} className="btn-ghost p-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleting(m)} className="btn-ghost p-1.5 text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MilestoneForm
        open={showForm}
        onClose={() => setShowForm(false)}
        propertyId={propertyId}
        milestone={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete milestone?"
        message={`Delete "${deleting?.milestone_type}"?`}
      />
    </div>
  );
}

function MilestoneForm({
  open, onClose, propertyId, milestone,
}: { open: boolean; onClose: () => void; propertyId: string; milestone?: Milestone | null }) {
  const router = useRouter();
  const [type, setType] = useState(milestone?.milestone_type || MILESTONE_TYPES[0]);
  const [target, setTarget] = useState(milestone?.target_date || '');
  const [actual, setActual] = useState(milestone?.actual_date || '');
  const [notes, setNotes] = useState(milestone?.notes || '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      milestone_type: type,
      target_date: target || null,
      actual_date: actual || null,
      notes: notes || null,
    };
    const { error } = milestone
      ? await supabase.from('milestones').update(payload).eq('id', milestone.id)
      : await supabase.from('milestones').insert({ ...payload, property_id: propertyId });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(milestone ? 'Milestone updated' : 'Milestone added');
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={milestone ? 'Edit milestone' : 'Add milestone'} size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {MILESTONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target date</label>
            <input className="input" type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div>
            <label className="label">Actual date</label>
            <input className="input" type="date" value={actual} onChange={(e) => setActual(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : milestone ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
