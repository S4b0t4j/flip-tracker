'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Common/Modal';
import { createClient } from '@/lib/supabase/client';
import type { Contractor } from '@/lib/types';

const COST_TYPES = ['Fixed', 'Hourly', 'Per Day', 'Other'];

export function ContractorForm({
  open,
  onClose,
  propertyId,
  contractor,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  contractor?: Contractor | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: contractor?.name ?? '',
    phone: contractor?.phone ?? '',
    email: contractor?.email ?? '',
    scope_of_work: contractor?.scope_of_work ?? '',
    cost_rate: contractor?.cost_rate?.toString() ?? '',
    cost_type: contractor?.cost_type ?? 'Fixed',
    start_date: contractor?.start_date ?? '',
    end_date: contractor?.end_date ?? '',
    notes: contractor?.notes ?? '',
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      scope_of_work: form.scope_of_work || null,
      cost_rate: form.cost_rate ? Number(form.cost_rate) : null,
      cost_type: form.cost_type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };
    const { error } = contractor
      ? await supabase.from('contractors').update(payload).eq('id', contractor.id)
      : await supabase.from('contractors').insert({ ...payload, property_id: propertyId });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(contractor ? 'Contractor updated' : 'Contractor added');
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={contractor ? 'Edit contractor' : 'Add contractor'} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Scope of work</label>
          <input
            className="input"
            value={form.scope_of_work}
            onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cost rate</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_rate}
              onChange={(e) => setForm({ ...form, cost_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Cost type</label>
            <select
              className="input"
              value={form.cost_type}
              onChange={(e) => setForm({ ...form, cost_type: e.target.value })}
            >
              {COST_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input
              className="input"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              className="input"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : contractor ? 'Save' : 'Add contractor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
