'use client';
import { Person, Meeting } from '@/lib/types';
import { format } from 'date-fns';

interface Props {
  person: Person | null;
  allPeople: Person[];
  meetings: Meeting[];
  onClose: () => void;
  onAddMeeting: (personId: string) => void;
  onEdit: (person: Person) => void;
}

function ContactRow({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
          {label}
        </a>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </div>
  );
}

export default function PersonPanel({ person, allPeople, meetings, onClose, onAddMeeting, onEdit }: Props) {
  if (!person) return null;

  const personMeetings = meetings
    .filter(m => m.personId === person.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const connections = person.connections
    .map(id => allPeople.find(p => p.id === id))
    .filter(Boolean) as Person[];

  const initials = person.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="
        fixed z-40 bg-white shadow-2xl overflow-y-auto
        /* mobile: bottom sheet */
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]
        /* desktop: right sidebar */
        md:bottom-0 md:top-14 md:left-auto md:right-0 md:w-96 md:rounded-none md:rounded-l-2xl md:max-h-none
        transition-transform duration-300
      ">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{person.name}</h2>
            {(person.role || person.company) && (
              <p className="text-slate-500 text-sm truncate">
                {[person.role, person.company].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(person)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Edit person"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Contact info */}
          {(person.email || person.whatsapp || person.linkedin) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</h3>
              <div className="space-y-1.5">
                {person.email && (
                  <ContactRow
                    icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    label={person.email}
                    href={`mailto:${person.email}`}
                  />
                )}
                {person.whatsapp && (
                  <ContactRow
                    icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652C8.05 23.219 9.987 23.73 11.973 23.73c10.906 0 16.207-13.14 8.547-20.281zm-8.55 18.178c-1.786 0-3.537-.479-5.063-1.389l-.363-.215-3.762.981.999-3.648-.237-.374C1.78 13.866 3.356 5.7 10.887 3.38c7.531-2.32 13.91 4.16 11.59 11.691-1.56 5.071-6.19 6.556-10.507 6.556z"/></svg>}
                    label={person.whatsapp}
                    href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`}
                  />
                )}
                {person.linkedin && (
                  <ContactRow
                    icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
                    label="LinkedIn"
                    href={person.linkedin}
                  />
                )}
              </div>
            </div>
          )}

          {/* Connections */}
          {connections.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Connections ({connections.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {connections.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                    {c.name}
                    {c.company && <span className="text-indigo-400">· {c.company}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meetings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Meetings ({personMeetings.length})
              </h3>
              <button
                onClick={() => onAddMeeting(person.id)}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {personMeetings.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No meetings yet</p>
            ) : (
              <div className="space-y-3">
                {personMeetings.map(m => (
                  <div key={m.id} className="bg-slate-50 rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {format(new Date(m.date), 'MMM d, yyyy')}
                        </span>
                        {m.time && <span className="text-slate-400 text-xs ml-2">{m.time}</span>}
                      </div>
                      {m.location && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {m.location}
                        </span>
                      )}
                    </div>
                    {m.notes && <p className="text-slate-600 text-sm leading-relaxed">{m.notes}</p>}
                    {m.topics && m.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.topics.map((t, i) => (
                          <span key={i} className="bg-white border border-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.attendees && m.attendees.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        Also: {m.attendees.map(id => allPeople.find(p => p.id === id)?.name).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
