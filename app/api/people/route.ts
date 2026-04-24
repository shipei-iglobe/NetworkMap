import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const data = await readData();
  return NextResponse.json(data.people);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();

  const person = {
    id: uuidv4(),
    name: body.name,
    company: body.company ?? '',
    role: body.role ?? '',
    linkedin: body.linkedin ?? '',
    whatsapp: body.whatsapp ?? '',
    email: body.email ?? '',
    connections: body.connections ?? [],
    x: body.x,
    y: body.y,
  };

  data.people.push(person);

  for (const connId of person.connections) {
    const conn = data.people.find(p => p.id === connId);
    if (conn && !conn.connections.includes(person.id)) {
      conn.connections.push(person.id);
    }
  }

  await writeData(data);
  return NextResponse.json(person, { status: 201 });
}
