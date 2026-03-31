import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SNS24_OTC = `OTC MEDICINES IN PORTUGAL:
Ben-u-ron (paracetamol): 500-1000mg every 6-8h, max 4g/day.
Brufen (ibuprofen): 400mg every 8h with food. AVOID: pregnant, kidney disease.
Clarityne (loratadine): 10mg once daily.
Smecta: 3 sachets/day for diarrhea. Hidrasec: 100mg 3x/day for diarrhea.
Buscopan: 10mg up to 3x/day for cramps.
SRO (oral rehydration salts): 1 sachet in 200mL water.
Sterimar/Rhinomer: saline nasal spray. Strepsils: throat lozenges.
Antibiotics: PRESCRIPTION REQUIRED. SNS24 can refer.
Pregnant: safe=paracetamol. AVOID=ibuprofen/aspirin.
CONTACTS: SNS24=808 24 24 24. CIAV=800 250 250. Emergency=112.`;

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const { messages, triage_context: ctx } = await req.json();
  const language = ctx?.language === 'en' ? 'English' : 'Portuguese';

  const systemMessage = SNS24_OTC + `

You are an SNS24 health assistant for a PROTOTYPE/EDUCATIONAL app only.
Patient triage context: symptom=${ctx?.main_symptom}, age=${ctx?.age}, urgency=${ctx?.urgency_level}, assessment=${ctx?.assessment}.

RULES:
1. Answer ONLY using the OTC medicines and contacts listed above.
2. Reply in ${language}.
3. Keep answers concise: 2-4 sentences.
4. End EVERY reply with: "Para aconselhamento real, contacte o SNS24: 808 24 24 24."
5. If asked something outside the knowledge base, direct to SNS24.`;

  const groqRes = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemMessage }, ...messages],
      temperature: 0.2,
      max_tokens: 400,
    }),
  });

  const groqData = await groqRes.json();
  const reply = groqData?.choices?.[0]?.message?.content;

  if (!reply) {
    return NextResponse.json({ error: 'No response from AI' }, { status: 502 });
  }

  return NextResponse.json({ reply });
}
