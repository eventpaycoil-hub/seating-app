// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const DB_NAME = 'eventpay_videos';
const STORE = 'videos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadVideosForEvent(eventId) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.filter((v) => String(v.eventId) === String(eventId)));
    };
    req.onerror = () => resolve([]);
  });
}

async function saveVideoRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteVideoRecord(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export default function VideosPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';

  const [videos, setVideos] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setVideos([]);
      return;
    }

    loadVideosForEvent(eventId).then(setVideos);

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e) => e.id.toString() === eventId.toString());
    if (current) setEventTitle(current.owners || current.title || '');
  }, [eventId]);

  const handleVideoUpload = async (e) => {
    if (!eventId) {
      alert('חסר מזהה אירוע. היכנס לווידאו דרך הדשבורד.');
      return;
    }

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newItems = [];
      for (const file of files) {
        const blobUrl = URL.createObjectURL(file);
        const record = {
          id: Date.now() + Math.random(),
          eventId: String(eventId),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          date: new Date().toLocaleDateString('he-IL'),
          // שומרים את ה-Blob עצמו ב-IndexedDB
          blob: file,
        };
        await saveVideoRecord(record);
        newItems.push({ ...record, url: blobUrl });
      }
      setVideos((prev) => [...prev, ...newItems]);
      alert(`✅ ${files.length} וידאו נשמרו לאירוע זה`);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת הווידאו');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // אחרי טעינה מ-IndexedDB צריך ליצור שוב blob URL
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    (async () => {
      const list = await loadVideosForEvent(eventId);
      if (cancelled) return;
      const withUrls = list.map((v) => ({
        ...v,
        url: v.blob ? URL.createObjectURL(v.blob) : '',
      }));
      setVideos(withUrls);
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const deleteVideo = async (id) => {
    if (!confirm('למחוק את הווידאו?')) return;
    await deleteVideoRecord(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {eventId ? (
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">
            ← חזרה למוזמנים
          </Link>
        ) : null}

        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold">וידאו האירוע</h1>
            <p className="text-gray-600 mt-1">
              {eventTitle || (eventId ? `אירוע #${eventId}` : 'לא נבחר אירוע')}
            </p>
            <p className="text-xs text-gray-400 mt-1">שמירה: IndexedDB · אירוע {eventId || '—'}</p>
          </div>

          <label className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-3xl font-medium flex items-center gap-3 text-lg shadow-lg cursor-pointer transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? '⏳ מעלה...' : '➕ הוסף וידאו חדש'}
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {!eventId && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-8 text-center">
            חסר מזהה אירוע. היכנס לווידאו דרך הדשבורד של האירוע.
          </div>
        )}

        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-16 text-center">
            <div className="text-7xl mb-8">🎥</div>
            <h2 className="text-3xl font-bold mb-4">עדיין אין סרטונים</h2>
            <p className="text-gray-600 text-xl">לחץ על הכפתור למעלה כדי להעלות וידאו</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-3xl shadow overflow-hidden">
                {video.url ? (
                  <video src={video.url} controls className="w-full aspect-video bg-black" />
                ) : (
                  <div className="w-full aspect-video bg-black flex items-center justify-center text-white">אין תצוגה</div>
                )}
                <div className="p-4">
                  <div className="font-medium">{video.name}</div>
                  <div className="text-sm text-gray-500">
                    {video.size} • {video.date}
                  </div>
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="mt-3 w-full bg-red-100 text-red-600 py-2 rounded-xl text-sm"
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}