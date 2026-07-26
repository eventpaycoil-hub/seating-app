// app/event/[id]/whatsapp-templates/manage/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageContent?: {
    body?: string;
  };
}

export default function ManageWhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // TODO: בהמשך נעביר את זה ל-Environment Variable
  const HEYY_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjdkMGE1YTg4LTA4ZjItNDgxNS1hZmZlLTAxYmM5Y2JjNGYxMiIsImFwaUtleUlkIjoiMThiN2FhMmEtYjM2My00MDE1LTg4ZWQtMDAyMWU5ODZjNjgwIiwiaWF0IjoxNzg0MzUyMzkwfQ.PylW33Ko1T_PBKt8r0E0oKsMPgEXfNy08GGWWpqAH_0";

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.heyy.io/v3/message_templates/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HEYY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "",
          sortBy: "createdAt",
          search: "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTemplates(data.data || []);
      } else {
        alert('שגיאה בשליפת התבניות');
      }
    } catch (error) {
      console.error(error);
      alert('שגיאה בחיבור ל-Heyy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ניהול תבניות ווטסאפ</h1>
          <Link href="../whatsapp-templates" className="text-blue-600 hover:underline">
            ← חזרה לדף שליחה
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium disabled:bg-gray-400"
          >
            {loading ? 'טוען...' : 'רענן תבניות מ-Heyy'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* רשימת תבניות */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow p-6">
            <h2 className="font-bold text-xl mb-4">התבניות שלי ({templates.length})</h2>
            
            {templates.length === 0 && (
              <p className="text-gray-500">אין תבניות עדיין. לחץ על "רענן תבניות".</p>
            )}

            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all hover:shadow ${
                    selectedTemplate?.id === template.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm line-clamp-2">{template.name}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(template.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* תצוגת תבנית נבחרת */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-6 min-h-[400px]">
            {selectedTemplate ? (
              <>
                <h3 className="font-bold text-xl mb-4">פרטי תבנית</h3>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">שם / תוכן</div>
                  <div className="font-medium whitespace-pre-wrap">{selectedTemplate.name}</div>
                </div>

                {selectedTemplate.messageContent?.body && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">תוכן ההודעה</div>
                    <div className="bg-gray-50 p-4 rounded-2xl whitespace-pre-wrap text-sm">
                      {selectedTemplate.messageContent.body}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                בחר תבנית מהרשימה כדי לראות פרטים
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}