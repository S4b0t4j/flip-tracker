'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ExpenseForm } from '@/components/Expenses/ExpenseForm';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DEFAULT_BUDGET_CATEGORIES, type Property, type RehabBudget, type Expense, type Contractor } from '@/lib/types';

export function BudgetTab({
  property,
  budgets,
  expenses,
  contractors,
}: {
  property: Property;
  budgets: RehabBudget[];
  expenses: Expense[];
  contractors: Contractor[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [editingBudget, setEditingBudget] = useState<RehabBudget | null>(null);
  const [draftAmount, setDraftAmount] = useState('');

  const categorySpend = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount));
    });
    return map;
  }, [expenses]);

  const allCategories = useMemo(() => {
    const set = new Set<string>(budgets.map((b) => b.category));
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [budgets, expenses]);

  const totals = useMemo(() => {
    const budget = budgets.reduce((s, b) => s + Number(b.budgeted_amount), 0);
    const spent = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return { budget, spent, remaining: budget - spent };
  }, [budgets, expenses]);

  async function saveBudget(b: RehabBudget) {
    const supabase = createClient();
    const amount = Number(draftAmount) || 0;
    const { error } = await supabase
      .from('rehab_budgets')
      .update({ budgeted_amount: amount })
      .eq('id', b.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Budget updated');
    setEditingBudget(null);
    router.refresh();
  }

  async function deleteExpense() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Expense deleted');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Budget vs actual</h3>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Log expense
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 text-right font-medium">Budgeted</th>
              <th className="px-4 py-2 text-right font-medium">Spent</th>
              <th className="px-4 py-2 text-right font-medium">Remaining</th>
              <th className="px-4 py-2 text-right font-medium">% Used</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {allCategories.map((cat) => {
              const b = budgets.find((x) => x.category === cat);
              const budgeted = Number(b?.budgeted_amount) || 0;
              const spent = categorySpend.get(cat) || 0;
              const remaining = budgeted - spent;
              const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
              const over = remaining < 0;
              return (
                <tr key={cat} className={`border-t border-border ${over ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-2">{cat}</td>
                  <td className="px-4 py-2 text-right">
                    {b && editingBudget?.id === b.id ? (
                      <input
                        autoFocus
                        type="number"
                        className="input w-28 py-1 text-right text-sm"
                        value={draftAmount}
                        onChange={(e) => setDraftAmount(e.target.value)}
                        onBlur={() => saveBudget(b)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveBudget(b); if (e.key === 'Escape') setEditingBudget(null); }}
                      />
                    ) : (
                      <button
                        onClick={() => { if (b) { setEditingBudget(b); setDraftAmount(String(budgeted)); } }}
                        className="hover:underline"
                        disabled={!b}
                      >
                        {formatCurrency(budgeted)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(spent)}</td>
                  <td className={`px-4 py-2 text-right ${over ? 'font-semibold text-red-600' : ''}`}>
                    {formatCurrency(remaining)}
                  </td>
                  <td className="px-4 py-2 text-right">{pct.toFixed(0)}%</td>
                  <td></td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border bg-muted font-semibold">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right">{formatCurrency(totals.budget)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(totals.spent)}</td>
              <td className={`px-4 py-2 text-right ${totals.remaining < 0 ? 'text-red-600' : ''}`}>
                {formatCurrency(totals.remaining)}
              </td>
              <td className="px-4 py-2 text-right">
                {totals.budget > 0 ? `${((totals.spent / totals.budget) * 100).toFixed(0)}%` : '—'}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">All expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses logged.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Contractor</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => {
                  const c = contractors.find((x) => x.id === e.contractor_id);
                  return (
                    <tr key={e.id} className="border-t border-border table-row-hover">
                      <td className="px-4 py-2">{formatDate(e.date_incurred)}</td>
                      <td className="px-4 py-2">{e.category}</td>
                      <td className="px-4 py-2 text-muted-foreground">{e.description || '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{c?.name || '—'}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(Number(e.amount))}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => { setEditing(e); setShowForm(true); }} className="btn-ghost p-1.5">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleting(e)} className="btn-ghost p-1.5 text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseForm
        open={showForm}
        onClose={() => setShowForm(false)}
        propertyId={property.id}
        contractors={contractors}
        expense={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={deleteExpense}
        title="Delete expense?"
        message={`Delete this ${formatCurrency(Number(deleting?.amount))} expense?`}
      />
    </div>
  );
}
