'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function PhotoUpload({
  propertyId,
  currentStage,
}: {
  propertyId: string;
  currentStage: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const valid: File[] = [];
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB`);
        return;
      }
      valid.push(f);
    });
    setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setCaptions((prev) => { const c = { ...prev }; delete c[idx]; return c; });
  }

  async function uploadAll() {
    if (files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setUploading(false); return; }

    let success = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${propertyId}/${Date.now()}-${i}.${ext}`;
      setProgress((p) => ({ ...p, [i]: 10 }));

      const { error: upErr } = await supabase.storage
        .from('property-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (upErr) {
        toast.error(`${file.name}: ${upErr.message}`);
        setProgress((p) => ({ ...p, [i]: 0 }));
        continue;
      }
      setProgress((p) => ({ ...p, [i]: 60 }));

      const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('photos').insert({
        property_id: propertyId,
        image_url: urlData.publicUrl,
        caption: captions[i] || null,
        status_at_time: currentStage,
      });

      if (dbErr) {
        toast.error(`${file.name}: ${dbErr.message}`);
        continue;
      }
      setProgress((p) => ({ ...p, [i]: 100 }));
      success++;
    }

    setUploading(false);
    if (success > 0) {
      toast.success(`Uploaded ${success} photo${success > 1 ? 's' : ''}`);
      setFiles([]);
      setCaptions({});
      setProgress({});
      router.refresh();
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center cursor-pointer rounded-md border-2 border-dashed p-8 transition ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Drop photos here or click to browse</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded object-cover" />
              <div className="flex-1">
                <div className="text-sm font-medium">{f.name}</div>
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  className="input mt-1 py-1 text-xs"
                  value={captions[i] || ''}
                  onChange={(e) => setCaptions({ ...captions, [i]: e.target.value })}
                  disabled={uploading}
                />
                {progress[i] > 0 && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress[i]}%` }} />
                  </div>
                )}
              </div>
              {!uploading && (
                <button onClick={() => removeFile(i)} className="btn-ghost p-1">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button onClick={uploadAll} disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading…' : `Upload ${files.length} photo${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
