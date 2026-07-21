'use client';
import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  date: string;
}

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');

  const storageKey = eventId ? `eventpay-media_${eventId}` : 'eventpay-media_unknown';

  useEffect(() => {
    if (!eventId) {
      setMedia([]);
      return;
    }

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

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId.toString());
    if (current) setEventTitle(current.owners || current.title || '');
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
      alert('התמונה גדולה מדי. נסה קובץ קטן יותר.');
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

  const uploadMedia = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newItem: MediaItem = {
        id: Date.now(),
        name: selectedFile.name,
        url: ev.target?.result as string,
        type: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
        date: new Date().toLocaleDateString('he-IL'),
      };
      saveToLocal([newItem, ...media]);
      setSelectedFile(null);
      setPreview(null);
      alert('✅ נשמר לאירוע זה בלבד');
    };
    reader.readAsDataURL(selectedFile);
  };

  const deleteMedia = (id: number) => {
    if (confirm('למחוק?')) {
      saveToLocal(media.filter((item) => item.id !== id));
    }
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
            <p className="text-xs text-gray-400 mt-1">מפתח שמירה: {storageKey}</p>
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
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Upload size={20} /> העלה עכשיו
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
                    onClick={() => deleteMedia(item.id)}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> מחק
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
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