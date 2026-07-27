'use client';

import { Suspense, useState, useEffect } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase.js';

interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  date: string;
  storagePath?: string;
}

function GalleryInner() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const storageKey = eventId ? `eventpay-media_${eventId}` : 'eventpay-media_unknown';

  useEffect(() => {
    if (!eventId) {
      setMedia([]);
      return;
    }

    // 1) local cache
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setMedia(JSON.parse(raw));
      } catch {
        setMedia([]);
      }
    } else {
      setMedia([]);
    }

    // 2) event title
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const current = events.find((e: any) => e.id.toString() === eventId.toString());
      if (current) setEventTitle(current.owners || current.title || '');
    } catch {}

    // 3) נסה לטעון cover מ-Supabase events
    (async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('cover_url, owners, title')
          .eq('id', Number(eventId))
          .maybeSingle();

        if (data?.owners || data?.title) {
          setEventTitle(data.owners || data.title || '');
        }

        if (data?.cover_url) {
          setMedia((prev) => {
            if (prev.some((m) => m.url === data.cover_url)) return prev;
            const coverItem: MediaItem = {
              id: Date.now(),
              name: 'תמונת אירוע',
              url: data.cover_url,
              type: 'image',
              date: new Date().toLocaleDateString('he-IL'),
            };
            const next = [coverItem, ...prev.filter((m) => m.url !== data.cover_url)];
            localStorage.setItem(storageKey, JSON.stringify(next));
            return next;
          });
        }
      } catch (e) {
        console.warn('load cover from events failed', e);
      }
    })();
  }, [eventId, storageKey]);

  const saveToLocal = (updated: MediaItem[]) => {
    if (!eventId) {
      alert('חסר מזהה אירוע בכתובת. חזור לדשבורד ופתח שוב את הגלריה.');
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setMedia(updated);
    } catch {
      alert('שגיאה בשמירה מקומית');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const uploadMedia = async () => {
    if (!selectedFile || !eventId) return;

    setUploading(true);
    try {
      const isImage = selectedFile.type.startsWith('image/');
      const ext = selectedFile.name.split('.').pop() || (isImage ? 'jpg' : 'pdf');
      const path = `${eventId}/${Date.now()}.${ext}`;

      // העלאה ל-Storage
      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(path, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) {
        console.error(uploadError);
        alert('שגיאה בהעלאה ל-Supabase: ' + uploadError.message);
        setUploading(false);
        return;
      }

      // כתובת ציבורית
      const { data: pub } = supabase.storage.from('event-media').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (!publicUrl) {
        alert('הקובץ הועלה אבל לא התקבלה כתובת ציבורית');
        setUploading(false);
        return;
      }

      const newItem: MediaItem = {
        id: Date.now(),
        name: selectedFile.name,
        url: publicUrl,
        type: isImage ? 'image' : 'pdf',
        date: new Date().toLocaleDateString('he-IL'),
        storagePath: path,
      };

      const updated = [newItem, ...media];
      saveToLocal(updated);

      // אם זו תמונה — שמור כ-cover של האירוע
      if (isImage) {
        try {
          await supabase
            .from('events')
            .upsert(
              {
                id: Number(eventId),
                cover_url: publicUrl,
              },
              { onConflict: 'id' }
            );
        } catch (e) {
          console.warn('save cover_url failed (ייתכן שחסרה עמודה cover_url)', e);
        }

        // גם ב-localStorage של האירוע
        try {
          const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
          const next = events.map((ev: any) =>
            String(ev.id) === String(eventId) ? { ...ev, coverUrl: publicUrl } : ev
          );
          localStorage.setItem('myEvents', JSON.stringify(next));
        } catch {}
      }

      setSelectedFile(null);
      setPreview(null);
      alert('✅ התמונה הועלתה לענן ונשמרה לאירוע');
    } catch (e: any) {
      console.error(e);
      alert('שגיאה: ' + (e?.message || 'העלאה נכשלה'));
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm('למחוק?')) return;

    if (item.storagePath) {
      try {
        await supabase.storage.from('event-media').remove([item.storagePath]);
      } catch (e) {
        console.warn('storage delete failed', e);
      }
    }

    const updated = media.filter((m) => m.id !== item.id);
    saveToLocal(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">גלריית האירוע</h1>
            <p className="text-amber-700 mt-1">
              {eventTitle || (eventId ? `אירוע #${eventId}` : 'לא נבחר אירוע')}
            </p>
            <p className="text-xs text-gray-400 mt-1">נשמר בענן (Supabase Storage)</p>
          </div>
          {eventId ? (
            <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
              ← חזרה
            </Link>
          ) : null}
        </div>

        {!eventId && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-8 text-center">
            חסר מזהה אירוע בכתובת. היכנס לגלריה דרך הדשבורד של האירוע.
          </div>
        )}

        <div className="bg-white rounded-3xl shadow p-8 mb-10">
          <h2 className="text-xl font-bold mb-4">העלה תמונה או PDF</h2>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="block w-full border border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer mb-4"
          />
          {preview && (
            <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-2xl mb-4" />
          )}
          {selectedFile && (
            <button
              onClick={uploadMedia}
              disabled={uploading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {uploading ? 'מעלה...' : 'העלה עכשיו לענן'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-16">
              אין עדיין תמונות לאירוע זה
            </div>
          )}
          {media.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <FileText size={60} className="text-red-500 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">PDF</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.date}</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => deleteMedia(item)}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> מחק
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-xl text-center"
                  >
                    פתח
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" dir="rtl">טוען גלריה...</div>}>
      <GalleryInner />
    </Suspense>
  );
}