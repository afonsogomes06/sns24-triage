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

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
