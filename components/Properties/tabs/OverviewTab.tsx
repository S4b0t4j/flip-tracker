'use client';

import { formatDate, daysBetween } from '@/lib/utils';
import type { Property, Milestone } from '@/lib/types';

export function OverviewTab({
  property,
  milestones,
  totalSpent,
}: {
  property: Property;
  milestones: Milestone[];
  totalSpent: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const acq = property.acquisition_date;
  const reno = property.target_reno_completion;
  const sale = property.target_sale_date;

  const renoDaysLeft = daysBetween(today, reno);
  const saleDaysLeft = daysBetween(today, sale);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
        <div className="grid grid-cols-3 gap-3">
          <TimelineCard
            label="Acquisition"
            date={acq}
            status="complete"
          />
          <TimelineCard
            label="Target reno completion"
            date={reno}
            daysLeft={renoDaysLeft}
            status={!reno ? 'none' : (renoDaysLeft ?? 0) < 0 ? 'overdue' : (renoDaysLeft ?? 0) < 14 ? 'warning' : 'ok'}
          />
          <TimelineCard
            label="Target sale"
            date={sale}
            daysLeft={saleDaysLeft}
            status={!sale ? 'none' : (saleDaysLeft ?? 0) < 0 ? 'overdue' : (saleDaysLeft ?? 0) < 14 ? 'warning' : 'ok'}
          />
        </div>
      </div>

      {property.notes && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
          <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{property.notes}</p>
        </div>
      )}

      {property.zillow_link && (
        <div>
          <a href={property.zillow_link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
            View on Zillow ↗
          </a>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming milestones</h3>
        {milestones.filter((m) => !m.actual_date).length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {milestones.filter((m) => !m.actual_date).slice(0, 5).map((m) => (
              <li key={m.id} className="flex justify-between rounded-md border border-border p-3">
                <span className="font-medium">{m.milestone_type}</span>
                <span className="text-muted-foreground">{formatDate(m.target_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TimelineCard({
  label, date, daysLeft, status,
}: {
  label: string;
  date: string | null | undefined;
  daysLeft?: number | null;
  status: 'complete' | 'ok' | 'warning' | 'overdue' | 'none';
}) {
  const statusClasses = {
    complete: 'border-green-500/50 bg-green-50 dark:bg-green-900/20',
    ok: 'border-green-500/30',
    warning: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20',
    overdue: 'border-red-500/50 bg-red-50 dark:bg-red-900/20',
    none: 'border-border bg-muted',
  };
  return (
    <div className={`rounded-md border p-4 ${statusClasses[status]}`}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{formatDate(date)}</div>
      {daysLeft != null && (
        <div className="mt-1 text-xs">
          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}
        </div>
      )}
    </div>
  );
}
