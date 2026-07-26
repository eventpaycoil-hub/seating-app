'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CalculatorPage() {
  const router = useRouter();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const inputDigit = (d: string) => {
    setDisplay((cur) => {
      if (fresh || cur === '0') {
        setFresh(false);
        return d;
      }
      if (cur.length >= 12) return cur;
      return cur + d;
    });
  };

  const inputDot = () => {
    setDisplay((cur) => {
      if (fresh) {
        setFresh(false);
        return '0.';
      }
      if (cur.includes('.')) return cur;
      return cur + '.';
    });
  };

  const clearAll = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  };

  const setOperator = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = compute(prev, current, op);
      setPrev(result);
      setDisplay(String(result));
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setFresh(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = compute(prev, current, op);
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const backspace = () => {
    setDisplay((cur) => {
      if (fresh || cur.length <= 1) {
        setFresh(true);
        return '0';
      }
      return cur.slice(0, -1);
    });
  };

  const btn =
    'h-16 rounded-2xl text-2xl font-bold active:scale-95 transition select-none flex items-center justify-center';

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">מחשבון</h1>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/event/1/guests');
              }
            }}
            className="text-blue-600 text-sm hover:underline"
          >
            ← חזרה
          </button>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl" dir="ltr">
          <div className="text-right text-sm text-slate-400 h-6 mb-1">
            {prev !== null && op ? `${prev} ${op}` : ''}
          </div>
          <div className="text-right text-4xl font-bold tracking-wider min-h-[48px] break-all">
            {display}
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            <button type="button" onClick={clearAll} className={`${btn} bg-slate-600 hover:bg-slate-500 col-span-2`}>
              C
            </button>
            <button type="button" onClick={backspace} className={`${btn} bg-slate-600 hover:bg-slate-500`}>
              ⌫
            </button>
            <button type="button" onClick={() => setOperator('÷')} className={`${btn} bg-amber-500 hover:bg-amber-400 text-white`}>
              ÷
            </button>

            {['7', '8', '9'].map((d) => (
              <button key={d} type="button" onClick={() => inputDigit(d)} className={`${btn} bg-slate-700 hover:bg-slate-600`}>
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setOperator('×')} className={`${btn} bg-amber-500 hover:bg-amber-400 text-white`}>
              ×
            </button>

            {['4', '5', '6'].map((d) => (
              <button key={d} type="button" onClick={() => inputDigit(d)} className={`${btn} bg-slate-700 hover:bg-slate-600`}>
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setOperator('-')} className={`${btn} bg-amber-500 hover:bg-amber-400 text-white`}>
              −
            </button>

            {['1', '2', '3'].map((d) => (
              <button key={d} type="button" onClick={() => inputDigit(d)} className={`${btn} bg-slate-700 hover:bg-slate-600`}>
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setOperator('+')} className={`${btn} bg-amber-500 hover:bg-amber-400 text-white`}>
              +
            </button>

            <button type="button" onClick={() => inputDigit('0')} className={`${btn} bg-slate-700 hover:bg-slate-600 col-span-2`}>
              0
            </button>
            <button type="button" onClick={inputDot} className={`${btn} bg-slate-700 hover:bg-slate-600`}>
              .
            </button>
            <button type="button" onClick={equals} className={`${btn} bg-emerald-500 hover:bg-emerald-400 text-white`}>
              =
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">לספירת כסאות באולם</p>
      </div>
    </div>
  );
}