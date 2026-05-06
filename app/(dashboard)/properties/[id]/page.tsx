import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyDetail } from '@/components/Properties/PropertyDetail';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).single();
  if (!property) notFound();

  const [
    { data: budgets = [] },
    { data: expenses = [] },
    { data: contractors = [] },
    { data: photos = [] },
    { data: status = [] },
    { data: milestones = [] },
  ] = await Promise.all([
    supabase.from('rehab_budgets').select('*').eq('property_id', params.id).order('category'),
    supabase.from('expenses').select('*').eq('property_id', params.id).order('date_incurred', { ascending: false }),
    supabase.from('contractors').select('*').eq('property_id', params.id).order('start_date', { ascending: false }),
    supabase.from('photos').select('*').eq('property_id', params.id).order('uploaded_at', { ascending: false }),
    supabase.from('status_log').select('*').eq('property_id', params.id).order('changed_at', { ascending: false }),
    supabase.from('milestones').select('*').eq('property_id', params.id).order('target_date'),
  ]);

  return (
    <PropertyDetail
      property={property}
      budgets={budgets || []}
      expenses={expenses || []}
      contractors={contractors || []}
      photos={photos || []}
      statusLog={status || []}
      milestones={milestones || []}
    />
  );
}
