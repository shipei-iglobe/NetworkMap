import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data = await readData();
  const idx = data.people.findIndex(p => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prev = data.people[idx];
  data.people[idx] = { ...prev, ...body };

  if (body.connections) {
    const added = body.connections.filter((id: string) => !prev.connections.includes(id));
    const removed = prev.connections.filter((id: string) => !body.connections.includes(id));
    for (const connId of added) {
      const conn = data.people.find(p => p.id === connId);
      if (conn && !conn.connections.includes(params.id)) conn.connections.push(params.id);
    }
    for (const connId of removed) {
      const conn = data.people.find(p => p.id === connId);
      if (conn) conn.connections = conn.connections.filter(id => id !== params.id);
    }
  }

  await writeData(data);
  return NextResponse.json(data.people[idx]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await readData();
  data.people = data.people.filter(p => p.id !== params.id);
  for (const person of data.people) {
    person.connections = person.connections.filter(id => id !== params.id);
  }
  data.meetings = data.meetings.filter(m => m.personId !== params.id);
  await writeData(data);
  return NextResponse.json({ ok: true });
}
