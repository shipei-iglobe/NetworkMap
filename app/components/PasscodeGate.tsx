'use client';
import { useState, useEffect, useCallback } from 'react';

const PASSCODE = process.env.NEXT_PUBLIC_PASSCODE ?? '1234';
const SESSION_KEY = 'nm_unlocked';

export default function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true);
  }, []);

  const submit = useCallback(() => {
    if (input === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1500);
    }
  }, [input]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
  }, [submit]);

  const handlePad = (digit: string) => {
    const next = input + digit;
    setInput(next);
    if (next.length === PASSCODE.length) {
      setTimeout(() => {
        if (next === PASSCODE) {
          sessionStorage.setItem(SESSION_KEY, '1');
          setUnlocked(true);
        } else {
          setError(true);
          setInput('');
          setTimeout(() => setError(false), 1500);
        }
      }, 100);
    }
  };

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-xs mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Network Map</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your passcode to continue</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(PASSCODE.length, 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                i < input.length
                  ? error ? 'bg-red-400' : 'bg-indigo-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Hidden text input for keyboard users */}
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          maxLength={20}
          className="sr-only"
          autoFocus
          id="passcode-input"
        />

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => {
                if (d === '') return;
                if (d === '⌫') { setInput(p => p.slice(0, -1)); return; }
                handlePad(d);
              }}
              disabled={d === ''}
              className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${
                d === ''
                  ? 'invisible'
                  : 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm mt-4 animate-pulse">
            Incorrect passcode
          </p>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          Or{' '}
          <label htmlFor="passcode-input" className="text-indigo-400 cursor-pointer underline">
            type with keyboard
          </label>
          {' '}and press Enter
        </p>
      </div>
    </div>
  );
}
