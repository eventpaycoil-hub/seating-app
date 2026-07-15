'use client';
import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Image as ImageIcon, FileText } from 'lucide-react';

interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  date: string;
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eventpay-media');
    if (saved) setMedia(JSON.parse(saved));
  }, []);

  const saveToLocal = (updatedMedia: MediaItem[]) => {
    localStorage.setItem('eventpay-media', JSON.stringify(updatedMedia));
    setMedia(updatedMedia);
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
        date: new Date().toLocaleDateString('he-IL')
      };

      saveToLocal([newItem, ...media]);
      setSelectedFile(null);
      setPreview(null);
      alert('✅ הקובץ הועלה בהצלחה!');
    };
    reader.readAsDataURL(selectedFile);
  };

  const deleteMedia = (id: number) => {
    if (confirm('למחוק את הקובץ?')) {
      saveToLocal(media.filter(item => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-900">גלריית האירוע</h1>
          <p className="text-amber-700 mt-2">תמונות וקבצי PDF של האירוע</p>
        </div>

        {/* העלאה */}
        <div className="bg-white rounded-3xl shadow p-8 mb-10">
          <h2 className="text-xl font-bold mb-4">העלה תמונה או PDF</h2>
          <input 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleFileSelect} 
            className="block w-full border border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer mb-4"
          />
          
          {preview && <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-2xl mb-4" />}
          
          {selectedFile && (
            <button 
              onClick={uploadMedia}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Upload size={20} /> העלה עכשיו
            </button>
          )}
        </div>

        {/* גלריה */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map(item => (
            <div key={item.id} className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
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