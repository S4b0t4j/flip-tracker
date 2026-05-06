'use client';

import { ArrowRight } from 'lucide-react';
import { STAGE_COLORS } from '@/lib/utils';
import type { StatusLog } from '@/lib/types';

export function StatusHistoryTab({ statusLog }: { statusLog: StatusLog[] }) {
  if (statusLog.length === 0) {
    return <p className="text-sm text-muted-foreground">No status changes yet.</p>;
  }
  return (
    <ol className="relative border-l border-border pl-6">
      {statusLog.map((s) => (
        <li key={s.id} className="mb-6 last:mb-0">
          <div className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
          <div className="flex items-center gap-2 text-sm">
            {s.old_stage ? (
              <>
                <span className={`badge ${STAGE_COLORS[s.old_stage] || ''}`}>{s.old_stage}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </>
            ) : null}
            <span className={`badge ${STAGE_COLORS[s.new_stage || ''] || ''}`}>{s.new_stage}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(s.changed_at).toLocaleString()}
          </div>
        </li>
      ))}
    </ol>
  );
}
