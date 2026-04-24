'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import PasscodeGate from './components/PasscodeGate';
import PersonPanel from './components/PersonPanel';
import AddPersonModal from './components/AddPersonModal';
import AddMeetingModal from './components/AddMeetingModal';
import TopNav from './components/TopNav';
import VoiceInput, { ExtractedData } from './components/VoiceInput';
import { Person, Meeting } from '@/lib/types';

const NetworkGraph = dynamic(() => import('./components/NetworkGraph'), { ssr: false });

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingPersonId, setMeetingPersonId] = useState<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    const [p, m] = await Promise.all([
      fetch('/api/people').then(r => r.json()),
      fetch('/api/meetings').then(r => r.json()),
    ]);
    setPeople(p);
    setMeetings(m);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const selectedPerson = people.find(p => p.id === selectedId) ?? null;

  const handleAddPerson = async (data: Partial<Person>) => {
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refresh();
  };

  const handleEditPerson = async (data: Partial<Person>) => {
    if (!editingPerson) return;
    await fetch(`/api/people/${editingPerson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await refresh();
  };

  const handleAddMeeting = async (data: {
    personId: string;
    date: string;
    time: string;
    location: string;
    notes: string;
    topics: string[];
    attendees: string[];
    newPeople: { name: string; company?: string }[];
  }) => {
    // Create any new people first, collect their IDs
    const newIds: string[] = [];
    for (const np of data.newPeople) {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: np.name, company: np.company ?? '' }),
      });
      const created: Person = await res.json();
      newIds.push(created.id);
    }

    await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, attendees: [...data.attendees, ...newIds] }),
    });
    await refresh();
  };

  const handleNodePositionChange = useCallback(async (id: string, x: number, y: number) => {
    await fetch(`/api/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y }),
    });
    setPeople(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, []);

  const handleSelectPerson = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleSearchSelect = useCallback((id: string) => {
    setSelectedId(id);
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  // Called by VoiceInput after Claude extracts structured data
  const handleVoiceSave = useCallback(async (data: ExtractedData): Promise<string> => {
    let personId: string;

    if (data.person.existingPersonId) {
      personId = data.person.existingPersonId;
    } else {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.person.name,
          company: data.person.company ?? '',
          role: data.person.role ?? '',
          email: data.person.email ?? '',
          whatsapp: data.person.whatsapp ?? '',
          linkedin: data.person.linkedin ?? '',
          connections: [],
        }),
      });
      const created: Person = await res.json();
      personId = created.id;
    }

    if (data.meeting) {
      // Resolve attendee names → IDs, creating new people as needed
      const attendeeIds: string[] = [];
      for (const name of data.meeting.attendees ?? []) {
        const existing = people.find(
          p => p.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) {
          attendeeIds.push(existing.id);
        } else {
          const res = await fetch('/api/people', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, connections: [] }),
          });
          const created: Person = await res.json();
          attendeeIds.push(created.id);
        }
      }

      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId,
          date: data.meeting.date,
          time: data.meeting.time ?? '',
          location: data.meeting.location ?? '',
          notes: data.meeting.notes ?? '',
          topics: data.meeting.topics ?? [],
          attendees: attendeeIds,
        }),
      });
    }

    await refresh();

    // Return name for the success toast
    if (data.person.existingPersonId) {
      return people.find(p => p.id === data.person.existingPersonId)?.name ?? data.person.name;
    }
    return data.person.name;
  }, [people, refresh]);

  return (
    <PasscodeGate>
      <div className="flex flex-col h-screen">
        <TopNav
          people={people}
          meetings={meetings}
          onAddPerson={() => setShowAddPerson(true)}
          onAddMeeting={() => { setMeetingPersonId(undefined); setShowAddMeeting(true); }}
          onSelectPerson={handleSearchSelect}
        />

        <main className="flex-1 relative overflow-hidden">
          <NetworkGraph
            people={people}
            meetings={meetings}
            highlightedId={highlightedId}
            selectedId={selectedId}
            onSelectPerson={handleSelectPerson}
            onNodePositionChange={handleNodePositionChange}
          />

          <PersonPanel
            person={selectedPerson}
            allPeople={people}
            meetings={meetings}
            onClose={() => setSelectedId(null)}
            onAddMeeting={(pid) => { setMeetingPersonId(pid); setShowAddMeeting(true); }}
            onEdit={(p) => { setEditingPerson(p); setShowAddPerson(false); }}
          />
        </main>
      </div>

      {showAddPerson && !editingPerson && (
        <AddPersonModal
          allPeople={people}
          onSave={handleAddPerson}
          onClose={() => setShowAddPerson(false)}
        />
      )}

      {editingPerson && (
        <AddPersonModal
          allPeople={people}
          initialData={editingPerson}
          title="Edit Person"
          onSave={handleEditPerson}
          onClose={() => setEditingPerson(null)}
        />
      )}

      {showAddMeeting && (
        <AddMeetingModal
          allPeople={people}
          initialPersonId={meetingPersonId}
          onSave={handleAddMeeting}
          onClose={() => setShowAddMeeting(false)}
        />
      )}

      <VoiceInput people={people} onSave={handleVoiceSave} />
    </PasscodeGate>
  );
}
