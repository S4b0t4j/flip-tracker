'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/lib/types';

export function PhotoLightbox({
  photos, index, onClose, onChange,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onChange(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onChange(index + 1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onChange]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-white hover:opacity-80"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      {index > 0 && (
        <button
          onClick={() => onChange(index - 1)}
          className="absolute left-4 text-white hover:opacity-80"
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          onClick={() => onChange(index + 1)}
          className="absolute right-4 text-white hover:opacity-80"
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
      <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photo.caption || ''}
          className="max-h-[80vh] max-w-full object-contain"
        />
        <div className="mt-4 text-center text-sm text-white">
          {photo.caption && <div className="font-medium">{photo.caption}</div>}
          <div className="text-white/70">
            {photo.status_at_time} · {formatDate(photo.uploaded_at)}
          </div>
          <div className="mt-1 text-xs text-white/50">
            {index + 1} of {photos.length}
          </div>
        </div>
      </div>
    </div>
  );
}
