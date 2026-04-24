import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { text, people, today } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: `ANTHROPIC_API_KEY not set in .env.local (keys: ${Object.keys(process.env).filter(k => k.includes('ANTHROPIC')).join(',') || 'none'})` }, { status: 500 });
  }
  const client = new Anthropic({ apiKey });

  const existingList = people.length > 0
    ? `Existing people:\n${people.map((p: { id: string; name: string; company?: string }) =>
        `- id:"${p.id}" name:"${p.name}"${p.company ? ` company:"${p.company}"` : ''}`
      ).join('\n')}`
    : 'No existing people yet.';

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract structured information from this voice note about someone I met or a meeting I had.

Today is ${today}.
${existingList}

Voice note: "${text}"

Return ONLY valid JSON — no markdown, no explanation:
{
  "person": {
    "existingPersonId": "matching id from existing people, or null",
    "name": "full name (required)",
    "company": "company or empty string",
    "role": "job title or empty string",
    "email": "email or empty string",
    "whatsapp": "phone or empty string",
    "linkedin": "linkedin URL or empty string"
  },
  "meeting": {
    "date": "YYYY-MM-DD — use today if not specified",
    "time": "HH:MM 24h or empty string",
    "location": "where we met or empty string",
    "notes": "clean concise summary or empty string",
    "topics": ["keyword1", "keyword2"],
    "attendees": ["Other Person Name"]
  }
}

Rules:
- person object is always required
- meeting object is optional — omit entirely if no meeting details
- attendees = OTHER people present, not the main person
- If a person name matches an existing entry, set existingPersonId`,
    }],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
  }

  try {
    const json = block.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return NextResponse.json(JSON.parse(json));
  } catch {
    return NextResponse.json({ error: 'Failed to parse response', raw: block.text }, { status: 500 });
  }
}
