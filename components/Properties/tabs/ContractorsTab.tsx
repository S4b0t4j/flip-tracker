'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ContractorForm } from '@/components/Contractors/ContractorForm';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Contractor } from '@/lib/types';

export function ContractorsTab({
  propertyId,
  contractors,
}: {
  propertyId: string;
  contractors: Contractor[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [deleting, setDeleting] = useState<Contractor | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from('contractors').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Contractor deleted');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contractors</h3>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-sm">
          <Plus className="h-3.5 w-3.5" /> Add contractor
        </button>
      </div>

      {contractors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contractors yet.</p>
      ) : (
        <div className="space-y-2">
          {contractors.map((c) => {
            const open = expanded === c.id;
            return (
              <div key={c.id} className="rounded-md border border-border">
                <button
                  onClick={() => setExpanded(open ? null : c.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.scope_of_work && <div className="text-sm text-muted-foreground">{c.scope_of_work}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {formatCurrency(Number(c.cost_rate))} <span className="text-muted-foreground">/ {c.cost_type}</span>
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="border-t border-border p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Phone" value={c.phone ? <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Phone className="h-3 w-3" />{c.phone}</a> : '—'} />
                      <Field label="Email" value={c.email ? <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="h-3 w-3" />{c.email}</a> : '—'} />
                      <Field label="Start date" value={formatDate(c.start_date)} />
                      <Field label="End date" value={formatDate(c.end_date)} />
                    </div>
                    {c.notes && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Notes</div>
                        <p className="whitespace-pre-wrap">{c.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="btn-secondary text-xs">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => setDeleting(c)} className="btn-ghost text-xs text-red-600">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ContractorForm
        open={showForm}
        onClose={() => setShowForm(false)}
        propertyId={propertyId}
        contractor={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete contractor?"
        message={`Remove ${deleting?.name}? Linked expenses will keep their amounts but lose the contractor reference.`}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}
