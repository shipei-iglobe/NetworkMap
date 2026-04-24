'use client';
import { useState, useRef, useEffect } from 'react';
import { Person } from '@/lib/types';

interface Props {
  allPeople: Person[];
  initialPersonId?: string;
  onSave: (data: {
    personId: string;
    date: string;
    time: string;
    location: string;
    notes: string;
    topics: string[];
    attendees: string[];
    newPeople: { name: string; company?: string }[];
  }) => Promise<void>;
  onClose: () => void;
}

interface DraftPerson {
  id: string;  // temp id prefixed with "new__"
  name: string;
  company: string;
  isNew: true;
}

type AttendeeEntry = Person | DraftPerson;

function isNew(a: AttendeeEntry): a is DraftPerson {
  return (a as DraftPerson).isNew === true;
}

export default function AddMeetingModal({ allPeople, initialPersonId, onSave, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [personId, setPersonId] = useState(initialPersonId ?? '');
  const [personSearch, setPersonSearch] = useState(() => {
    const p = allPeople.find(x => x.id === initialPersonId);
    return p ? p.name : '';
  });
  const [showPersonDD, setShowPersonDD] = useState(false);

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(now);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [topicsRaw, setTopicsRaw] = useState('');

  const [attendees, setAttendees] = useState<AttendeeEntry[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showAttendeeDD, setShowAttendeeDD] = useState(false);

  const [saving, setSaving] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialPersonId) return;
    const p = allPeople.find(x => x.id === initialPersonId);
    if (p) { setPersonId(p.id); setPersonSearch(p.name); }
  }, [initialPersonId, allPeople]);

  const personOptions = allPeople.filter(
    p => personSearch === '' ||
      p.name.toLowerCase().includes(personSearch.toLowerCase()) ||
      (p.company ?? '').toLowerCase().includes(personSearch.toLowerCase())
  );

  const attendeeOptions = allPeople.filter(
    p => p.id !== personId &&
      !attendees.find(a => a.id === p.id) &&
      (attendeeSearch === '' ||
        p.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        (p.company ?? '').toLowerCase().includes(attendeeSearch.toLowerCase()))
  );

  const canCreateAttendee = attendeeSearch.trim().length > 0 &&
    !allPeople.find(p => p.name.toLowerCase() === attendeeSearch.trim().toLowerCase()) &&
    !attendees.find(a => a.name.toLowerCase() === attendeeSearch.trim().toLowerCase());

  const addAttendee = (person: Person) => {
    setAttendees(prev => [...prev, person]);
    setAttendeeSearch('');
    setShowAttendeeDD(false);
  };

  const createAndAddAttendee = () => {
    const parts = attendeeSearch.trim().split(' at ');
    const newPerson: DraftPerson = {
      id: `new__${Date.now()}`,
      name: parts[0].trim(),
      company: parts[1]?.trim() ?? '',
      isNew: true,
    };
    setAttendees(prev => [...prev, newPerson]);
    setAttendeeSearch('');
    setShowAttendeeDD(false);
  };

  const removeAttendee = (id: string) => setAttendees(prev => prev.filter(a => a.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !date) return;
    setSaving(true);
    try {
      const newPeople = attendees.filter(isNew).map(a => ({ name: a.name, company: a.company }));
      const existingAttendeeIds = attendees.filter(a => !isNew(a)).map(a => a.id);
      const topics = topicsRaw.split(',').map(t => t.trim()).filter(Boolean);
      await onSave({
        personId, date, time, location, notes, topics,
        attendees: existingAttendeeIds,
        newPeople,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-lg mx-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Log a Meeting</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Person */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Person *</label>
            <input
              value={personSearch}
              onChange={e => { setPersonSearch(e.target.value); setPersonId(''); setShowPersonDD(true); }}
              onFocus={() => setShowPersonDD(true)}
              onBlur={() => setTimeout(() => setShowPersonDD(false), 150)}
              placeholder="Search by name or company…"
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {showPersonDD && personOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {personOptions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => { setPersonId(p.id); setPersonSearch(p.name); setShowPersonDD(false); }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.company && <span className="text-slate-400 text-xs">{p.company}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date *</label>
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Coffee place, office, Zoom…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you talk about?"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Topics</label>
            <input
              value={topicsRaw}
              onChange={e => setTopicsRaw(e.target.value)}
              placeholder="fundraising, AI, hiring (comma-separated)"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Attendees (people mentioned/present) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Other people present
              <span className="ml-1 text-slate-400 font-normal">(type a new name to create them)</span>
            </label>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attendees.map(a => (
                  <span key={a.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${isNew(a) ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {isNew(a) && <span className="text-emerald-500">+</span>}
                    {a.name}
                    <button type="button" onClick={() => removeAttendee(a.id)} className="hover:opacity-70">×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={attendeeSearch}
              onChange={e => { setAttendeeSearch(e.target.value); setShowAttendeeDD(true); }}
              onFocus={() => setShowAttendeeDD(true)}
              onBlur={() => setTimeout(() => setShowAttendeeDD(false), 150)}
              placeholder="Search or type a name to add…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {showAttendeeDD && (attendeeOptions.length > 0 || canCreateAttendee) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {attendeeOptions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => addAttendee(p)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.company && <span className="text-slate-400 text-xs">{p.company}</span>}
                  </button>
                ))}
                {canCreateAttendee && (
                  <button
                    type="button"
                    onMouseDown={createAndAddAttendee}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2 text-sm border-t border-slate-100"
                  >
                    <span className="text-emerald-600">+</span>
                    <span className="text-emerald-700 font-medium">Create &quot;{attendeeSearch.trim()}&quot;</span>
                    <span className="text-slate-400 text-xs">· new person</span>
                  </button>
                )}
              </div>
            )}
            {attendeeSearch.trim() && !showAttendeeDD && canCreateAttendee && (
              <p className="text-xs text-slate-400 mt-1">Tip: use &quot;Name at Company&quot; format to set company</p>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!personId || !date || saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Meeting'}
          </button>
        </div>
      </div>
    </>
  );
}
