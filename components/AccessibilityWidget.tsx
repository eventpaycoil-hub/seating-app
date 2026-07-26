'use client';

import { useEffect, useState } from 'react';

type A11ySettings = {
  fontScale: number; // 1 | 1.15 | 1.3
  highContrast: boolean;
  grayscale: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const DEFAULT: A11ySettings = {
  fontScale: 1,
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  reduceMotion: false,
};

const STORAGE_KEY = 'eventpay_a11y';

function applySettings(s: A11ySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.fontSize = s.fontScale === 1 ? '' : `${s.fontScale * 100}%`;

  root.classList.toggle('a11y-contrast', s.highContrast);
  root.classList.toggle('a11y-gray', s.grayscale);
  root.classList.toggle('a11y-links', s.underlineLinks);
  root.classList.toggle('a11y-motion', s.reduceMotion);
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT, ...JSON.parse(raw) };
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {}
  }, []);

  const update = (partial: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applySettings(next);
      return next;
    });
  };

  const reset = () => {
    setSettings(DEFAULT);
    localStorage.removeItem(STORAGE_KEY);
    applySettings(DEFAULT);
  };

  return (
    <>
      {/* כפתור צף */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט נגישות"
        title="נגישות"
        className="fixed bottom-5 left-5 z-[9999] w-14 h-14 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-2xl shadow-lg flex items-center justify-center"
      >
        ♿
      </button>

      {/* פאנל */}
      {open && (
        <div
          className="fixed bottom-24 left-5 z-[9999] w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 text-right"
          dir="rtl"
          role="dialog"
          aria-label="אפשרויות נגישות"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">נגישות</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800 text-xl leading-none"
              aria-label="סגור"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* גודל טקסט */}
            <div>
              <div className="font-medium mb-2 text-gray-700">גודל טקסט</div>
              <div className="flex gap-2">
                {[
                  { label: 'רגיל', value: 1 },
                  { label: 'גדול', value: 1.15 },
                  { label: 'גדול מאוד', value: 1.3 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ fontScale: opt.value })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium ${
                      settings.fontScale === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ניגודיות */}
            <button
              type="button"
              onClick={() => update({ highContrast: !settings.highContrast })}
              className={`w-full py-2.5 rounded-xl border font-medium ${
                settings.highContrast
                  ? 'bg-slate-900 text-yellow-300 border-slate-900'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              {settings.highContrast ? '✓ ניגודיות גבוהה' : 'ניגודיות גבוהה'}
            </button>

            {/* גווני אפור */}
            <button
              type="button"
              onClick={() => update({ grayscale: !settings.grayscale })}
              className={`w-full py-2.5 rounded-xl border font-medium ${
                settings.grayscale
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              {settings.grayscale ? '✓ גווני אפור' : 'גווני אפור'}
            </button>

            {/* הדגשת קישורים */}
            <button
              type="button"
              onClick={() => update({ underlineLinks: !settings.underlineLinks })}
              className={`w-full py-2.5 rounded-xl border font-medium ${
                settings.underlineLinks
                  ? 'bg-blue-100 text-blue-900 border-blue-400'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              {settings.underlineLinks ? '✓ הדגשת קישורים' : 'הדגשת קישורים'}
            </button>

            {/* עצירת אנימציות */}
            <button
              type="button"
              onClick={() => update({ reduceMotion: !settings.reduceMotion })}
              className={`w-full py-2.5 rounded-xl border font-medium ${
                settings.reduceMotion
                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              {settings.reduceMotion ? '✓ עצירת אנימציות' : 'עצירת אנימציות'}
            </button>

            <button
              type="button"
              onClick={reset}
              className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-medium"
            >
              איפוס הגדרות
            </button>
          </div>
        </div>
      )}
    </>
  );
}