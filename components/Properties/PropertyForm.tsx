'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Common/Modal';
import { createClient } from '@/lib/supabase/client';
import { geocodeAddress } from '@/lib/geocode';
import { STAGES, type Property, DEFAULT_BUDGET_CATEGORIES } from '@/lib/types';

export function PropertyForm({
  open,
  onClose,
  property,
}: {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address: property?.address ?? '',
    zillow_link: property?.zillow_link ?? '',
    purchase_price: property?.purchase_price?.toString() ?? '',
    acquisition_date: property?.acquisition_date ?? '',
    estimated_arv: property?.estimated_arv?.toString() ?? '',
    current_stage: property?.current_stage ?? 'Sourcing',
    target_reno_completion: property?.target_reno_completion ?? '',
    target_sale_date: property?.target_sale_date ?? '',
    notes: property?.notes ?? '',
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim()) {
      toast.error('Address is required');
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      address: form.address.trim(),
      zillow_link: form.zillow_link || null,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      acquisition_date: form.acquisition_date || null,
      estimated_arv: form.estimated_arv ? Number(form.estimated_arv) : null,
      current_stage: form.current_stage,
      target_reno_completion: form.target_reno_completion || null,
      target_sale_date: form.target_sale_date || null,
      notes: form.notes || null,
    };

    let savedId: string | null = null;
    let addressChanged = false;

    if (property) {
      addressChanged = property.address !== payload.address;
      const { error } = await supabase.from('properties').update(payload).eq('id', property.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      savedId = property.id;
      toast.success('Property updated');
    } else {
      addressChanged = true;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: newProp, error } = await supabase
        .from('properties')
        .insert({ ...payload, user_id: user!.id })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      savedId = newProp.id;
      // Seed default budget rows
      const budgetRows = DEFAULT_BUDGET_CATEGORIES.map((c) => ({
        property_id: newProp.id,
        category: c,
        budgeted_amount: 0,
      }));
      await supabase.from('rehab_budgets').insert(budgetRows);
      toast.success('Property added');
    }

    // Geocode in background if address changed (don't block UI)
    if (savedId && addressChanged) {
      geocodeAddress(payload.address).then((geo) => {
        if (geo && savedId) {
          supabase
            .from('properties')
            .update({ latitude: geo.latitude, longitude: geo.longitude })
            .eq('id', savedId)
            .then(() => router.refresh());
        }
      });
    }

    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={property ? 'Edit property' : 'Add property'} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Address *</label>
          <input
            className="input"
            required
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="123 Main St, Atlanta, GA"
          />
        </div>
        <div>
          <label className="label">Zillow link</label>
          <input
            className="input"
            type="url"
            value={form.zillow_link}
            onChange={(e) => update('zillow_link', e.target.value)}
            placeholder="https://zillow.com/..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Purchase price</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={(e) => update('purchase_price', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Estimated ARV</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.estimated_arv}
              onChange={(e) => update('estimated_arv', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Acquisition date</label>
            <input
              className="input"
              type="date"
              value={form.acquisition_date}
              onChange={(e) => update('acquisition_date', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Stage</label>
            <select
              className="input"
              value={form.current_stage}
              onChange={(e) => update('current_stage', e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target reno completion</label>
            <input
              className="input"
              type="date"
              value={form.target_reno_completion}
              onChange={(e) => update('target_reno_completion', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Target sale date</label>
            <input
              className="input"
              type="date"
              value={form.target_sale_date}
              onChange={(e) => update('target_sale_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[100px]"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : property ? 'Save changes' : 'Add property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
