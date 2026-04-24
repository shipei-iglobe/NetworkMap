'use client';
import { useState } from 'react';
import { Person, Meeting } from '@/lib/types';
import SearchBar from './SearchBar';

interface Props {
  people: Person[];
  meetings: Meeting[];
  onAddPerson: () => void;
  onAddMeeting: () => void;
  onSelectPerson: (id: string) => void;
}

export default function TopNav({ people, meetings, onAddPerson, onAddMeeting, onSelectPerson }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-4 gap-3 relative z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="font-bold text-slate-800 text-sm hidden sm:block">Network Map</span>
      </div>

      {/* Search */}
      <div className="flex-1">
        <SearchBar people={people} meetings={meetings} onSelect={id => { onSelectPerson(id); setMenuOpen(false); }} />
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onAddMeeting}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Log Meeting
        </button>
        <button
          onClick={onAddPerson}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Person
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 flex-shrink-0"
        onClick={() => setMenuOpen(m => !m)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-lg md:hidden z-50 px-4 py-3 flex flex-col gap-2">
          <button
            onClick={() => { onAddMeeting(); setMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Log Meeting
          </button>
          <button
            onClick={() => { onAddPerson(); setMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Person
          </button>
        </div>
      )}
    </header>
  );
}
