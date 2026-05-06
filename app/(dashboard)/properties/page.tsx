import { createClient } from '@/lib/supabase/server';
import { PropertyList } from '@/components/Properties/PropertyList';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const { data: properties = [] } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  // Pull all expenses to compute spend per property
  const ids = (properties || []).map((p) => p.id);
  let spendMap = new Map<string, number>();
  if (ids.length) {
    const { data: expenses = [] } = await supabase
      .from('expenses')
      .select('property_id,amount')
      .in('property_id', ids);
    (expenses || []).forEach((e: { property_id: string; amount: number }) => {
      spendMap.set(e.property_id, (spendMap.get(e.property_id) || 0) + Number(e.amount));
    });
  }

  const enriched = (properties || []).map((p) => ({
    ...p,
    spent: spendMap.get(p.id) || 0,
  }));

  return <PropertyList initialProperties={enriched} initialQuery={searchParams.q} />;
}
