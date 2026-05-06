'use client';

import dynamic from 'next/dynamic';
import type { Property } from '@/lib/types';

// Leaflet touches `window`, so it must be client-only
const PropertyMap = dynamic(
  () => import('@/components/Map/PropertyMap').then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export function MapClient({ properties }: { properties: Property[] }) {
  return <PropertyMap properties={properties} />;
}
