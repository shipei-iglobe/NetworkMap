'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Person, Meeting } from '@/lib/types';

interface Props {
  people: Person[];
  meetings: Meeting[];
  onSelect: (personId: string) => void;
}

export default function SearchBar({ people, meetings, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return people.filter(person => {
      if (person.name.toLowerCase().includes(q)) return true;
      if ((person.company ?? '').toLowerCase().includes(q)) return true;
      if ((person.role ?? '').toLowerCase().includes(q)) return true;

      const personMeetings = meetings.filter(m => m.personId === person.id);
      if (personMeetings.some(m => (m.location ?? '').toLowerCase().includes(q))) return true;
      if (personMeetings.some(m => (m.notes ?? '').toLowerCase().includes(q))) return true;
      if (personMeetings.some(m => m.date.startsWith(q.replace(/\D/g, '').slice(0, 4)))) return true;
      if (personMeetings.some(m => (m.topics ?? []).some(t => t.toLowerCase().includes(q)))) return true;

      // mutual connections: find people who share connections
      const mutualMatch = people.find(
        other => other.id !== person.id &&
          other.name.toLowerCase().includes(q) &&
          person.connections.includes(other.id)
      );
      if (mutualMatch) return true;

      return false;
    }).slice(0, 8);
  }, [query, people, meetings]);

  const handleSelect = (id: string) => {
    setQuery('');
    setOpen(false);
    onSelect(id);
  };

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, company, topic…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map(p => {
            const meetingCount = meetings.filter(m => m.personId === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full px-4 py-2.5 text-left hover:bg-indigo-50 flex items-center justify-between gap-2 text-sm border-b border-slate-50 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  {p.company && <span className="text-slate-400 text-xs ml-2">{p.company}</span>}
                </div>
                {meetingCount > 0 && (
                  <span className="text-xs text-indigo-500 flex-shrink-0">{meetingCount} mtg</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-slate-400">
          No results for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
