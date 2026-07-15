// @ts-nocheck
'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VideosPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem(`videos_event_${eventId}`) || '[]');
    setVideos(savedVideos);
  }, [eventId]);

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(file),
      date: new Date().toLocaleDateString('he-IL')
    }));

    const updatedVideos = [...videos, ...newVideos];
    setVideos(updatedVideos);
    
    localStorage.setItem(`videos_event_${eventId}`, JSON.stringify(updatedVideos));
    
    alert(`✅ ${files.length} וידאו נוספו בהצלחה לאירוע זה!`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline mb-8 inline-block">← חזרה למוזמנים</Link>

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">וידאו האירוע #{eventId}</h1>
          
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-3xl font-medium flex items-center gap-3 text-lg shadow-lg cursor-pointer transition">
            ➕ הוסף וידאו חדש
            <input 
              type="file" 
              accept="video/*" 
              multiple 
              onChange={handleVideoUpload} 
              className="hidden" 
            />
          </label>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-16 text-center">
            <div className="text-7xl mb-8">🎥</div>
            <h2 className="text-3xl font-bold mb-4">עדיין אין סרטונים</h2>
            <p className="text-gray-600 text-xl">לחץ על הכפתור למעלה כדי להעלות וידאו</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-white rounded-3xl shadow overflow-hidden">
                <video src={video.url} controls className="w-full aspect-video bg-black" />
                <div className="p-4">
                  <div className="font-medium">{video.name}</div>
                  <div className="text-sm text-gray-500">{video.size} • {video.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}