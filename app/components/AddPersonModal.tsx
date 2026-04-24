'use client';
import { useState, useRef, useEffect } from 'react';
import { Person } from '@/lib/types';

interface Props {
  allPeople: Person[];
  initialData?: Partial<Person>;
  onSave: (data: Partial<Person>) => Promise<void>;
  onClose: () => void;
  title?: string;
}

export default function AddPersonModal({ allPeople, initialData, onSave, onClose, title = 'Add Person' }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [role, setRole] = useState(initialData?.role ?? '');
  const [linkedin, setLinkedin] = useState(initialData?.linkedin ?? '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [connections, setConnections] = useState<string[]>(initialData?.connections ?? []);
  const [connSearch, setConnSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const connectionOptions = allPeople.filter(
    p => p.id !== initialData?.id &&
      !connections.includes(p.id) &&
      (connSearch === '' || p.name.toLowerCase().includes(connSearch.toLowerCase()) || (p.company ?? '').toLowerCase().includes(connSearch.toLowerCase()))
  );

  const toggleConnection = (id: string) => {
    setConnections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), company, role, linkedin, whatsapp, email, connections });
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
          <h2 className="font-bold text-slate-900 text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name *</label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Jane Doe"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="CEO"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+65 9123 4567"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">LinkedIn URL</label>
              <input
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Connections */}
          {allPeople.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Connections</label>
              {connections.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {connections.map(id => {
                    const p = allPeople.find(x => x.id === id);
                    return p ? (
                      <span key={id} className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {p.name}
                        <button type="button" onClick={() => toggleConnection(id)} className="hover:text-indigo-900">×</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <input
                value={connSearch}
                onChange={e => setConnSearch(e.target.value)}
                placeholder="Search people to connect..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              {connSearch && connectionOptions.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {connectionOptions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { toggleConnection(p.id); setConnSearch(''); }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{p.name}</span>
                      {p.company && <span className="text-slate-400 text-xs">{p.company}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
