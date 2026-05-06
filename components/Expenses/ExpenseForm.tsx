'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Common/Modal';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_BUDGET_CATEGORIES, type Expense, type Contractor } from '@/lib/types';

export function ExpenseForm({
  open,
  onClose,
  propertyId,
  contractors,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  contractors: Contractor[];
  expense?: Expense | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: expense?.category ?? DEFAULT_BUDGET_CATEGORIES[0],
    amount: expense?.amount?.toString() ?? '',
    description: expense?.description ?? '',
    contractor_id: expense?.contractor_id ?? '',
    date_incurred: expense?.date_incurred ?? new Date().toISOString().slice(0, 10),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      category: form.category,
      amount: Number(form.amount),
      description: form.description || null,
      contractor_id: form.contractor_id || null,
      date_incurred: form.date_incurred,
    };
    const { error } = expense
      ? await supabase.from('expenses').update(payload).eq('id', expense.id)
      : await supabase.from('expenses').insert({ ...payload, property_id: propertyId });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(expense ? 'Expense updated' : 'Expense logged');
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Log expense'} size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {DEFAULT_BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount *</label>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contractor</label>
            <select
              className="input"
              value={form.contractor_id}
              onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
            >
              <option value="">— None —</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date incurred</label>
            <input
              className="input"
              type="date"
              value={form.date_incurred}
              onChange={(e) => setForm({ ...form, date_incurred: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : expense ? 'Save' : 'Log expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
