import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyReport } from '@/components/Reports/PropertyReport';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).single();
  if (!property) notFound();

  const [
    { data: budgets = [] },
    { data: expenses = [] },
    { data: contractors = [] },
    { data: photos = [] },
    { data: milestones = [] },
    { data: profile },
  ] = await Promise.all([
    supabase.from('rehab_budgets').select('*').eq('property_id', params.id),
    supabase.from('expenses').select('*').eq('property_id', params.id).order('date_incurred'),
    supabase.from('contractors').select('*').eq('property_id', params.id),
    supabase.from('photos').select('*').eq('property_id', params.id).order('uploaded_at'),
    supabase.from('milestones').select('*').eq('property_id', params.id).order('target_date'),
    supabase.from('users').select('full_name,email').eq('id', user!.id).single(),
  ]);

  return (
    <PropertyReport
      property={property}
      budgets={budgets || []}
      expenses={expenses || []}
      contractors={contractors || []}
      photos={photos || []}
      milestones={milestones || []}
      flipperName={profile?.full_name || profile?.email || 'Flipper'}
    />
  );
}
