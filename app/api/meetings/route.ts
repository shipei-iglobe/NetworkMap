import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const data = await readData();
  return NextResponse.json(data.meetings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();

  const meeting = {
    id: uuidv4(),
    personId: body.personId,
    date: body.date,
    time: body.time ?? '',
    location: body.location ?? '',
    notes: body.notes ?? '',
    topics: body.topics ?? [],
    attendees: body.attendees ?? [],
  };

  data.meetings.push(meeting);

  const primary = data.people.find(p => p.id === body.personId);
  if (primary) {
    for (const attendeeId of meeting.attendees) {
      if (!primary.connections.includes(attendeeId)) primary.connections.push(attendeeId);
      const attendee = data.people.find(p => p.id === attendeeId);
      if (attendee && !attendee.connections.includes(primary.id)) {
        attendee.connections.push(primary.id);
      }
    }
  }

  await writeData(data);
  return NextResponse.json(meeting, { status: 201 });
}
