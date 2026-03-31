import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const n8nUrl = process.env.N8N_CHAT_URL;

  if (!n8nUrl) {
    return NextResponse.json({ error: 'N8N_CHAT_URL not configured' }, { status: 500 });
  }

  const response = await fetch(n8nUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!text) {
    return NextResponse.json({ error: 'Empty response from server' }, { status: 502 });
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Invalid response from server', raw: text }, { status: 502 });
  }
}
