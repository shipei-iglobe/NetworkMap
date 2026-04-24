'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Person } from '@/lib/types';

// ── Web Speech API types ─────────────────────────────────────────────────────
interface SpeechRecognitionResult {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultItem {
  readonly [index: number]: SpeechRecognitionResult;
  readonly isFinal: boolean;
  readonly length: number;
}
interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResultItem;
  readonly length: number;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ExtractedPerson {
  existingPersonId?: string | null;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
}
interface ExtractedMeeting {
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  topics?: string[];
  attendees?: string[];
}
export interface ExtractedData {
  person: ExtractedPerson;
  meeting?: ExtractedMeeting;
}

interface Props {
  people: Person[];
  onSave: (data: ExtractedData) => Promise<string>;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function VoiceInput({ people, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const interimRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  const startRecording = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    interimRef.current = text;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let finalStr = interimRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalStr += (finalStr ? ' ' : '') + t;
          interimRef.current = finalStr;
        } else {
          interim += t;
        }
      }
      setText(finalStr + (interim ? ' ' + interim : ''));
    };

    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => { setIsRecording(false); };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [text]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleClose = useCallback(() => {
    stopRecording();
    setOpen(false);
    setText('');
    setStatus('idle');
    setStatusMsg('');
  }, [stopRecording]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || status === 'processing') return;
    stopRecording();
    setStatus('processing');
    setStatusMsg('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), people, today }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Extraction failed');
      }

      const data: ExtractedData = await res.json();
      const savedName = await onSave(data);

      const hasMeeting = !!data.meeting;
      setStatusMsg(`Saved ${savedName}${hasMeeting ? ' + meeting' : ''}`);
      setStatus('success');
      setText('');
      setTimeout(handleClose, 2200);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }, [text, status, people, onSave, stopRecording, handleClose]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        title="Quick capture"
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center md:bottom-8 md:right-8"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {!open ? null : (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={handleClose} />

          {/* Sheet */}
          <div className="fixed z-50 bg-white shadow-2xl
            /* mobile: bottom sheet */
            bottom-0 left-0 right-0 rounded-t-2xl
            /* desktop: centered card */
            md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
            md:w-full md:max-w-lg md:rounded-2xl
          ">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 text-base leading-tight">Quick Capture</h2>
                <p className="text-slate-400 text-xs mt-0.5">Describe who you met and what you talked about</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={
                    voiceSupported
                      ? 'Tap the mic and speak, or type here…\n\nExample: "Met Jane Lee at TechConf. She\'s VP at Stripe. We talked about fundraising."'
                      : 'Type here…\n\nExample: "Met Jane Lee at TechConf. She\'s VP at Stripe. We talked about fundraising."'
                  }
                  rows={4}
                  disabled={status === 'processing'}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none transition-all leading-relaxed
                    ${isRecording
                      ? 'border-red-300 ring-2 ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
                    }
                    ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  style={{ minHeight: 120 }}
                />

                {/* Recording pulse indicator */}
                {isRecording && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 text-xs font-semibold">Listening</span>
                  </div>
                )}
              </div>

              {/* Status message */}
              {status === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting info with AI…
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {statusMsg}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {statusMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {voiceSupported && (
                  <button
                    onClick={toggleRecording}
                    disabled={status === 'processing' || status === 'success'}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border
                      ${isRecording
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }
                      disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                  >
                    <svg className="w-4 h-4" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {isRecording ? 'Stop' : 'Speak'}
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || status === 'processing' || status === 'success'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'processing' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      Save
                      <kbd className="text-xs text-indigo-300 hidden sm:inline">⌘↵</kbd>
                    </>
                  )}
                </button>
              </div>

              {!voiceSupported && (
                <p className="text-xs text-slate-400 text-center">
                  Voice input not available in this browser — Chrome or Safari recommended
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
