'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PropertyForm } from './PropertyForm';
import { OverviewTab } from '@/components/Properties/tabs/OverviewTab';
import { BudgetTab } from '@/components/Properties/tabs/BudgetTab';
import { ContractorsTab } from '@/components/Properties/tabs/ContractorsTab';
import { PhotosTab } from '@/components/Properties/tabs/PhotosTab';
import { StatusHistoryTab } from '@/components/Properties/tabs/StatusHistoryTab';
import { MilestonesTab } from '@/components/Properties/tabs/MilestonesTab';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, STAGE_COLORS, calcProfitForecast, calcROI } from '@/lib/utils';
import {
  STAGES,
  type Property, type RehabBudget, type Expense,
  type Contractor, type Photo, type StatusLog, type Milestone,
} from '@/lib/types';

const TABS = ['Overview', 'Budget', 'Contractors', 'Photos', 'Status', 'Milestones'] as const;
type Tab = typeof TABS[number];

export function PropertyDetail({
  property,
  budgets,
  expenses,
  contractors,
  photos,
  statusLog,
  milestones,
}: {
  property: Property;
  budgets: RehabBudget[];
  expenses: Expense[];
  contractors: Contractor[];
  photos: Photo[];
  statusLog: StatusLog[];
  milestones: Milestone[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Overview');
  const [editing, setEditing] = useState(false);

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.budgeted_amount), 0);
  const profit = calcProfitForecast(Number(property.estimated_arv), Number(property.purchase_price), totalSpent);
  const roi = calcROI(profit, (Number(property.purchase_price) || 0) + totalSpent);

  async function changeStage(newStage: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .update({ current_stage: newStage })
      .eq('id', property.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Stage → ${newStage}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to properties
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{property.address}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`badge ${STAGE_COLORS[property.current_stage] || ''}`}>
              {property.current_stage}
            </span>
            <select
              className="input w-48 py-1 text-xs"
              value={property.current_stage}
              onChange={(e) => changeStage(e.target.value)}
            >
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <Link href={`/properties/${property.id}/report`} className="btn-primary">
            <FileDown className="h-4 w-4" /> Download report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Purchase price" value={formatCurrency(Number(property.purchase_price))} />
        <Stat label="Estimated ARV" value={formatCurrency(Number(property.estimated_arv))} />
        <Stat label="Total spent" value={formatCurrency(totalSpent)} sub={`Budget ${formatCurrency(totalBudget)}`} />
        <Stat
          label="Forecast profit"
          value={formatCurrency(profit)}
          sub={roi != null ? `${roi.toFixed(1)}% ROI` : undefined}
          accent={profit && profit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="card">
        <div className="flex border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition ${
                tab === t
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'Overview' && <OverviewTab property={property} milestones={milestones} totalSpent={totalSpent} />}
          {tab === 'Budget' && <BudgetTab property={property} budgets={budgets} expenses={expenses} contractors={contractors} />}
          {tab === 'Contractors' && <ContractorsTab propertyId={property.id} contractors={contractors} />}
          {tab === 'Photos' && <PhotosTab propertyId={property.id} photos={photos} currentStage={property.current_stage} />}
          {tab === 'Status' && <StatusHistoryTab statusLog={statusLog} />}
          {tab === 'Milestones' && <MilestonesTab propertyId={property.id} milestones={milestones} />}
        </div>
      </div>

      <PropertyForm open={editing} onClose={() => setEditing(false)} property={property} />
    </div>
  );
}

function Stat({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: 'success' | 'danger' }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${
        accent === 'success' ? 'text-green-600' : accent === 'danger' ? 'text-red-600' : ''
      }`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
