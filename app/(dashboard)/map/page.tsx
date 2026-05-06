import { createClient } from '@/lib/supabase/server';
import { MapClient } from './MapClient';

export default async function MapPage() {
  const supabase = createClient();
  const { data: properties = [] } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property map</h1>
          <p className="text-sm text-muted-foreground">
            {(properties || []).length} {(properties || []).length === 1 ? 'property' : 'properties'} pinned by address
          </p>
        </div>
      </div>
      <MapClient properties={properties || []} />
    </div>
  );
}
