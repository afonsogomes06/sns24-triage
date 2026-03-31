import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SNS24_KNOWLEDGE = `=== SNS24 OFFICIAL KNOWLEDGE BASE ===
SNS24 is Portugal's National Health Service 24h triage line (808 24 24 24).
Use ONLY this information — do not use outside medical knowledge.

TRIAGE URGENCY LEVELS:
emergencia: Call 112 immediately. Life-threatening.
vermelho: ER within 1h. Serious risk of deterioration.
laranja: ER within 2h. Significant symptoms needing urgent evaluation.
amarelo: Health center today. Professional evaluation needed.
verde: Self-care at home. Mild symptoms.

FEVER: verde (38-39.4C): Ben-u-ron 500-1000mg every 6-8h, fluids, rest. amarelo: >39.5C or >5 days. laranja: +stiff neck+rash, children <3m any fever. vermelho: >40C+altered state, seizures.
COUGH: verde: rest, fluids, Sterimar, honey, paracetamol. NO antibiotics for viral. amarelo: worsening, >2-3 weeks. laranja: breathing difficulty, coughing blood, cyanosis.
GASTROENTERITIS: verde: SRO, Smecta 3sachets/day, Hidrasec 100mg 3x/day, BRAT diet, small sips. amarelo: >48h, dehydration signs, diarrhea >7 days. laranja: bloody stool, rigid abdomen, vomiting blood.
SORE THROAT: verde: saline gargles, Strepsils, paracetamol, honey tea. amarelo: white patches, difficulty swallowing, >7 days. laranja: breathing difficulty, unable to swallow saliva.
HEADACHE: verde: Ben-u-ron 500-1000mg or Brufen 400mg, dark room, hydration. amarelo: >3 days, no OTC response. emergencia: thunderclap headache, meningitis (fever+stiff neck+photophobia). vermelho: neurological symptoms.
ABDOMINAL PAIN: verde: Buscopan 10mg 3x/day, warm compress. amarelo: >48h, fever+vomiting. emergencia: rigid abdomen, appendicitis signs, ectopic pregnancy (women+missed period).
EAR PAIN: verde: warm compress, paracetamol. amarelo: discharge, fever, hearing loss, >48h.
URINARY: amarelo: burning+frequency = UTI needs antibiotic prescription (refer health center). laranja: +fever+back pain = kidney infection. Urinary retention = laranja.
SKIN RASH: verde: Clarityne 10mg daily, Fenistil gel, avoid trigger. amarelo: spreading, +fever, blistering. emergencia: anaphylaxis (rash+breathing difficulty+face swelling = call 112). Petechial rash+fever = call 112.
POISONING: Call CIAV 800 250 250 immediately. Do NOT induce vomiting. Call 112 if unconscious.
MENTAL HEALTH: SNS24 option 4 for psychological counseling (24/7 free). Call 112 if danger to self/others.

OTC MEDICINES IN PORTUGAL:
Ben-u-ron (paracetamol): 500-1000mg every 6-8h, max 4g/day. Children: 15mg/kg/dose.
Brufen/Advil (ibuprofen): 400mg every 8h with food. AVOID: pregnant (esp 3rd trimester), kidney disease, stomach ulcers.
Clarityne (loratadine): 10mg once daily for allergies.
Aerius (desloratadine): 5mg once daily for allergies.
Smecta (diosmectite): 3 sachets/day dissolved in water for diarrhea.
Hidrasec (racecadotril): 100mg 3x/day for diarrhea.
Buscopan (butylscopolamine): 10mg up to 3x/day for abdominal cramps.
Oral Rehydration Salts (SRO): 1 sachet in 200mL water for dehydration.
Sterimar/Rhinomer: saline nasal spray for congestion.
Strepsils/Strepfen: throat lozenges.
Antibiotics: PRESCRIPTION REQUIRED in Portugal.

SPECIAL POPULATIONS:
Children <3m: ANY fever = laranja minimum, call SNS24.
Children 3-6m: fever >38C = call SNS24.
Elderly >65: lower threshold for all symptoms, dehydration risk.
Pregnant: SAFE=paracetamol. AVOID=ibuprofen/aspirin/naproxen especially 3rd trimester.
Immunocompromised: any fever or infection sign = amarelo minimum.

CONTACTS: SNS24=808 24 24 24 (24/7). CIAV=800 250 250 (24/7 free). Emergency=112.
=== END KNOWLEDGE BASE ===`;

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const d = await req.json();

  const pregnant = d.pregnant ? ', grávida' : '';
  const fever = d.fever ? `Sim ${d.temperature}°C` : 'Não';
  const otherSymptoms = d.other_symptoms?.length ? d.other_symptoms.join(', ') : 'Nenhum';
  const chronic = d.chronic_conditions?.length ? d.chronic_conditions.join(', ') : 'Nenhuma';
  const language = d.language === 'en' ? 'English' : 'Português';

  const userMessage = `Paciente: ${d.age} anos, ${d.gender}${pregnant}. Sintoma principal: ${d.main_symptom}. Duração: ${d.duration}. Febre: ${fever}. Dor: ${d.pain_level}/10. Outros sintomas: ${otherSymptoms}. Doenças crónicas: ${chronic}. Medicação atual: ${d.current_medications || 'Nenhuma'}. Alergias: ${d.allergies || 'Nenhuma'}. Idioma preferido: ${language}.`;

  const systemMessage = SNS24_KNOWLEDGE + `

You are an SNS24 triage simulation assistant (PROTOTYPE/EDUCATIONAL only).
Reply ONLY with a single valid JSON object. No markdown, no code blocks, no extra text before or after.
Use ONLY the knowledge base above. Write assessment and recommendations in the patient's preferred language.

Required JSON structure:
{
  "urgency_level": "verde|amarelo|laranja|vermelho|emergencia",
  "urgency_label": "Pode tratar em casa|Consulte hoje|Urgência em 2h|Urgência em 1h|Ligue 112",
  "assessment": "2-3 sentence clinical summary in patient language",
  "recommendations": ["step 1", "step 2", "step 3"],
  "medicines_info": "specific OTC medicines with exact dosing from knowledge base",
  "when_to_worry": "specific warning signs from knowledge base",
  "disclaimer": "AVISO: Protótipo educativo baseado em protocolos SNS24. Não substitui aconselhamento médico. SNS24: 808 24 24 24. Emergências: 112."
}`;

  const groqRes = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    }),
  });

  const groqData = await groqRes.json();
  const raw = groqData?.choices?.[0]?.message?.content;

  if (!raw) {
    return NextResponse.json({ error: 'No response from AI' }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(raw.trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Invalid AI response', raw }, { status: 502 });
  }
}
