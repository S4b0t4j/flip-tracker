'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { formatCurrency, formatDate, calcProfitForecast, calcROI } from '@/lib/utils';
import type { Property, RehabBudget, Expense, Contractor, Photo, Milestone } from '@/lib/types';

export function PropertyReport({
  property,
  budgets,
  expenses,
  contractors,
  photos,
  milestones,
  flipperName,
}: {
  property: Property;
  budgets: RehabBudget[];
  expenses: Expense[];
  contractors: Contractor[];
  photos: Photo[];
  milestones: Milestone[];
  flipperName: string;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const totalBudget = budgets.reduce((s, b) => s + Number(b.budgeted_amount), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = calcProfitForecast(Number(property.estimated_arv), Number(property.purchase_price), totalSpent);
  const roi = calcROI(profit, (Number(property.purchase_price) || 0) + totalSpent);

  const categories = Array.from(new Set([...budgets.map((b) => b.category), ...expenses.map((e) => e.category)])).sort();

  async function downloadPDF() {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const [{ default: jsPDF }, html2canvasMod] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasMod.default;

      const sections = reportRef.current.querySelectorAll('[data-section]');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < sections.length; i++) {
        const el = sections[i] as HTMLElement;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        let h = imgHeight;
        let position = 10;
        if (h > pageHeight - 20) h = pageHeight - 20;
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, h);
      }

      const safe = property.address.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`${safe}_FlipReport_${date}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  // Chunk photos 4-per-page
  const photoChunks: Photo[][] = [];
  for (let i = 0; i < photos.length; i += 4) photoChunks.push(photos.slice(i, i + 4));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/properties/${property.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to property
        </Link>
        <button onClick={downloadPDF} disabled={generating} className="btn-primary">
          <FileDown className="h-4 w-4" /> {generating ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white text-black">
        {/* Cover */}
        <section data-section className="card flex h-[1000px] flex-col items-center justify-center bg-white p-12 text-center">
          <div className="text-sm uppercase tracking-widest text-gray-500">Flip Report</div>
          <h1 className="mt-4 text-4xl font-bold">{property.address}</h1>
          <div className="mt-2 text-lg text-gray-600">{property.current_stage}</div>
          <div className="mt-12 text-sm text-gray-500">Prepared for</div>
          <div className="mt-1 text-xl font-medium">{flipperName}</div>
          <div className="mt-12 text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </section>

        {/* Snapshot */}
        <section data-section className="card bg-white p-10 text-black">
          <h2 className="text-2xl font-bold">Property Snapshot</h2>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <Pair label="Address" value={property.address} />
            <Pair label="Stage" value={property.current_stage} />
            <Pair label="Purchase price" value={formatCurrency(Number(property.purchase_price))} />
            <Pair label="Estimated ARV" value={formatCurrency(Number(property.estimated_arv))} />
            <Pair label="Acquisition" value={formatDate(property.acquisition_date)} />
            <Pair label="Target reno completion" value={formatDate(property.target_reno_completion)} />
            <Pair label="Target sale" value={formatDate(property.target_sale_date)} />
            <Pair label="Total rehab budget" value={formatCurrency(totalBudget)} />
          </div>
          {property.notes && (
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase text-gray-500">Notes</div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{property.notes}</p>
            </div>
          )}
        </section>

        {/* Financial summary */}
        <section data-section className="card bg-white p-10 text-black">
          <h2 className="text-2xl font-bold">Financial Summary</h2>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <Pair label="Total spent" value={formatCurrency(totalSpent)} />
            <Pair label="Forecast profit" value={formatCurrency(profit)} />
            <Pair label="ROI" value={roi != null ? `${roi.toFixed(1)}%` : '—'} />
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left">
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Budgeted</th>
                <th className="py-2 text-right">Actual</th>
                <th className="py-2 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const b = budgets.find((x) => x.category === cat);
                const budgeted = Number(b?.budgeted_amount) || 0;
                const spent = expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
                const variance = budgeted - spent;
                return (
                  <tr key={cat} className="border-b border-gray-200">
                    <td className="py-2">{cat}</td>
                    <td className="py-2 text-right">{formatCurrency(budgeted)}</td>
                    <td className="py-2 text-right">{formatCurrency(spent)}</td>
                    <td className={`py-2 text-right ${variance < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(variance)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{formatCurrency(totalBudget)}</td>
                <td className="py-2 text-right">{formatCurrency(totalSpent)}</td>
                <td className={`py-2 text-right ${totalBudget - totalSpent < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(totalBudget - totalSpent)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Milestones */}
        {milestones.length > 0 && (
          <section data-section className="card bg-white p-10 text-black">
            <h2 className="text-2xl font-bold">Project Timeline</h2>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left">
                  <th className="py-2">Milestone</th>
                  <th className="py-2">Target</th>
                  <th className="py-2">Actual</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id} className="border-b border-gray-200">
                    <td className="py-2">{m.milestone_type}</td>
                    <td className="py-2">{formatDate(m.target_date)}</td>
                    <td className="py-2">{formatDate(m.actual_date)}</td>
                    <td className="py-2">{m.actual_date ? 'Complete' : 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Photos - 4 per page */}
        {photoChunks.map((chunk, idx) => (
          <section key={idx} data-section className="card bg-white p-10 text-black">
            {idx === 0 && <h2 className="mb-6 text-2xl font-bold">Photos</h2>}
            <div className="grid grid-cols-2 gap-4">
              {chunk.map((p) => (
                <div key={p.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.caption || ''}
                    crossOrigin="anonymous"
                    className="aspect-video w-full rounded object-cover"
                  />
                  <div className="text-xs">
                    {p.caption && <div className="font-medium">{p.caption}</div>}
                    <div className="text-gray-500">{p.status_at_time} · {formatDate(p.uploaded_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-0.5 text-base font-medium">{value}</div>
    </div>
  );
}
