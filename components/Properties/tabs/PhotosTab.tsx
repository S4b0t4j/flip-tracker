'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/Photos/PhotoUpload';
import { PhotoLightbox } from '@/components/Photos/PhotoLightbox';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/lib/types';

export function PhotosTab({
  propertyId,
  photos,
  currentStage,
}: {
  propertyId: string;
  photos: Photo[];
  currentStage: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sorted = [...photos].sort((a, b) => {
    const t = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
    return sort === 'newest' ? -t : t;
  });

  async function deletePhoto(p: Photo) {
    if (!confirm('Delete this photo?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('photos').delete().eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    // Best-effort storage cleanup (URL → path)
    try {
      const url = new URL(p.image_url);
      const path = url.pathname.split('/property-photos/')[1];
      if (path) await supabase.storage.from('property-photos').remove([path]);
    } catch {}
    toast.success('Photo deleted');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Photos ({photos.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            className="input w-36 py-1 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <PhotoUpload propertyId={propertyId} currentStage={currentStage} />

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {sorted.map((p, i) => (
            <div key={p.id} className="group relative overflow-hidden rounded-md border border-border">
              <button
                onClick={() => setLightboxIndex(i)}
                className="block w-full aspect-square overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url}
                  alt={p.caption || 'Property photo'}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                <div className="font-medium">{p.status_at_time || '—'}</div>
                <div className="opacity-80">{formatDate(p.uploaded_at)}</div>
              </div>
              <button
                onClick={() => deletePhoto(p)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={sorted}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
