import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, STAGE_COLORS, calcProfitForecast, calcROI } from '@/lib/utils';
import { Building2, TrendingUp, DollarSign, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: properties = [] } = await supabase.from('properties').select('*');
  const props = properties || [];

  // Aggregate
  const totalInvested = props.reduce((s, p) => s + (Number(p.purchase_price) || 0), 0);
  const totalARV = props.reduce((s, p) => s + (Number(p.estimated_arv) || 0), 0);

  // Get all expenses for forecast
  const { data: expenses = [] } = await supabase.from('expenses').select('property_id,amount');
  const spendByProperty = new Map<string, number>();
  (expenses || []).forEach((e: { property_id: string; amount: number }) => {
    spendByProperty.set(e.property_id, (spendByProperty.get(e.property_id) || 0) + Number(e.amount));
  });
  const totalSpent = Array.from(spendByProperty.values()).reduce((s, v) => s + v, 0);
  const aggregateProfit = totalARV - totalInvested - totalSpent;

  const active = props.filter((p) =>
    ['Acquired', 'Pre-Renovation', 'In Renovation', 'Hold/Staging', 'Listed'].includes(p.current_stage),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Portfolio at a glance</p>
        </div>
        <Link href="/properties" className="btn-primary">
          <Plus className="h-4 w-4" /> New property
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Properties" value={String(props.length)} icon={Building2} />
        <KpiCard label="Total invested" value={formatCurrency(totalInvested + totalSpent)} icon={DollarSign} />
        <KpiCard label="Aggregate ARV" value={formatCurrency(totalARV)} icon={TrendingUp} />
        <KpiCard
          label="Forecast profit"
          value={formatCurrency(aggregateProfit)}
          icon={TrendingUp}
          accent={aggregateProfit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Active projects</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active projects.</p>
        ) : (
          <div className="space-y-2">
            {active.map((p) => {
              const spent = spendByProperty.get(p.id) || 0;
              const profit = calcProfitForecast(Number(p.estimated_arv), Number(p.purchase_price), spent);
              const roi = calcROI(profit, (Number(p.purchase_price) || 0) + spent);
              return (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-4 hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{p.address}</div>
                    <span className={`badge mt-1 ${STAGE_COLORS[p.current_stage] || ''}`}>{p.current_stage}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">Forecast profit</div>
                    <div className={profit && profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                      {formatCurrency(profit)} {roi != null && `(${roi.toFixed(1)}%)`}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  accent?: 'success' | 'danger';
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div
        className={`mt-2 text-2xl font-bold ${
          accent === 'success' ? 'text-green-600' : accent === 'danger' ? 'text-red-600' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
