import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, STAGE_COLORS, calcProfitForecast, calcROI } from '@/lib/utils';
import { FileDown } from 'lucide-react';

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: properties = [] } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const ids = (properties || []).map((p) => p.id);
  const spendMap = new Map<string, number>();
  if (ids.length) {
    const { data: expenses = [] } = await supabase
      .from('expenses')
      .select('property_id,amount')
      .in('property_id', ids);
    (expenses || []).forEach((e: { property_id: string; amount: number }) => {
      spendMap.set(e.property_id, (spendMap.get(e.property_id) || 0) + Number(e.amount));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Download per-property reports for lenders, partners, or your records.</p>
      </div>

      {(properties || []).length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted-foreground">Add properties to generate reports.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 text-right font-medium">Purchase</th>
                <th className="px-4 py-3 text-right font-medium">ARV</th>
                <th className="px-4 py-3 text-right font-medium">Spent</th>
                <th className="px-4 py-3 text-right font-medium">Forecast profit</th>
                <th className="px-4 py-3 text-right font-medium">ROI</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(properties || []).map((p) => {
                const spent = spendMap.get(p.id) || 0;
                const profit = calcProfitForecast(Number(p.estimated_arv), Number(p.purchase_price), spent);
                const roi = calcROI(profit, (Number(p.purchase_price) || 0) + spent);
                return (
                  <tr key={p.id} className="border-t border-border table-row-hover">
                    <td className="px-4 py-3 font-medium">{p.address}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STAGE_COLORS[p.current_stage] || ''}`}>{p.current_stage}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(p.purchase_price))}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(p.estimated_arv))}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(spent)}</td>
                    <td className={`px-4 py-3 text-right ${profit && profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </td>
                    <td className="px-4 py-3 text-right">{roi != null ? `${roi.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/properties/${p.id}/report`} className="btn-secondary text-xs">
                        <FileDown className="h-3 w-3" /> Report
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
