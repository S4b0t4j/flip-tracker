import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  return daysBetween(date, new Date().toISOString());
}

export function calcProfitForecast(
  arv: number | null,
  purchasePrice: number | null,
  totalSpent: number,
): number | null {
  if (arv == null || purchasePrice == null) return null;
  return arv - purchasePrice - totalSpent;
}

export function calcROI(profit: number | null, invested: number | null): number | null {
  if (profit == null || !invested || invested === 0) return null;
  return (profit / invested) * 100;
}

export const STAGE_COLORS: Record<string, string> = {
  Sourcing: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'Under Contract': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Acquired: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  'Pre-Renovation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  'In Renovation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Hold/Staging': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  Listed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  Sold: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  Closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};
