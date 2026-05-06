'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PropertyForm } from './PropertyForm';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import {
  formatCurrency,
  formatDate,
  daysSince,
  STAGE_COLORS,
  calcProfitForecast,
  calcROI,
} from '@/lib/utils';
import { STAGES, type Property } from '@/lib/types';

type Row = Property & { spent: number };

export function PropertyList({
  initialProperties,
  initialQuery,
}: {
  initialProperties: Row[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [q, setQ] = useState(initialQuery ?? '');
  const [stage, setStage] = useState<string>('All');
  const [sort, setSort] = useState<'address' | 'purchase' | 'days' | 'profit'>('days');

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    let rows = initialProperties.filter((p) => {
      const matchQ = !lq || p.address.toLowerCase().includes(lq);
      const matchS = stage === 'All' || p.current_stage === stage;
      return matchQ && matchS;
    });
    rows = rows.sort((a, b) => {
      if (sort === 'address') return a.address.localeCompare(b.address);
      if (sort === 'purchase') return (Number(b.purchase_price) || 0) - (Number(a.purchase_price) || 0);
      if (sort === 'days') return (daysSince(b.created_at) || 0) - (daysSince(a.created_at) || 0);
      const pa = calcProfitForecast(Number(a.estimated_arv), Number(a.purchase_price), a.spent) || 0;
      const pb = calcProfitForecast(Number(b.estimated_arv), Number(b.purchase_price), b.spent) || 0;
      return pb - pa;
    });
    return rows;
  }, [initialProperties, q, stage, sort]);

  async function handleDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from('properties').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Property deleted');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {initialProperties.length}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New property
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by address…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select className="input w-44" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="All">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-44" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="days">Newest first</option>
          <option value="address">Address (A–Z)</option>
          <option value="purchase">Purchase price</option>
          <option value="profit">Forecast profit</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-16 text-center">
          <h3 className="text-lg font-semibold">No properties yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your first deal to start tracking.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> Add property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p) => {
            const profit = calcProfitForecast(Number(p.estimated_arv), Number(p.purchase_price), p.spent);
            const roi = calcROI(profit, (Number(p.purchase_price) || 0) + p.spent);
            return (
              <div key={p.id} className="card group flex flex-col p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/properties/${p.id}`} className="font-semibold hover:underline">
                    {p.address}
                  </Link>
                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      className="btn-ghost p-1.5"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      className="btn-ghost p-1.5 text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <span className={`badge mt-2 self-start ${STAGE_COLORS[p.current_stage] || ''}`}>
                  {p.current_stage}
                </span>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <Row label="Purchase" value={formatCurrency(Number(p.purchase_price))} />
                  <Row label="ARV" value={formatCurrency(Number(p.estimated_arv))} />
                  <Row label="Spent" value={formatCurrency(p.spent)} />
                  <Row label="Acquired" value={formatDate(p.acquisition_date)} />
                </dl>
                <div className="mt-4 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forecast profit</span>
                    <span className={profit && profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                  {roi != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI</span>
                      <span className={roi >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                        {roi.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/properties/${p.id}`}
                  className="btn-secondary mt-4 w-full text-center"
                >
                  View details
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <PropertyForm
        open={showForm}
        onClose={() => setShowForm(false)}
        property={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete property?"
        message={`This will permanently delete "${deleting?.address}" and all its data (expenses, contractors, photos, milestones).`}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
