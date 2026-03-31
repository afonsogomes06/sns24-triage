'use client';

import { useState } from 'react';
import { t, Language } from '@/lib/i18n';
import { TriageFormData, TriageResult } from '@/lib/types';
import UrgencyBadge from '@/components/UrgencyBadge';
import ChatInterface from '@/components/ChatInterface';

const EMERGENCY_QUESTIONS = ['q_unconscious', 'q_breathing', 'q_chestpain', 'q_stroke', 'q_bleeding'] as const;

const DURATION_KEYS = ['dur1', 'dur2', 'dur3'] as const;
const DURATION_VALUES_PT = ['Menos de 24 horas', '1-3 dias', 'Mais de 3 dias'];
const DURATION_VALUES_EN = ['Less than 24 hours', '1-3 days', 'More than 3 days'];

export default function Home() {
  const [lang, setLang] = useState<Language>('pt');
  const tr = t[lang];

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [emergencyFlags, setEmergencyFlags] = useState<Record<string, boolean>>({});
  const [mainSymptom, setMainSymptom] = useState('');
  const [durationIdx, setDurationIdx] = useState<number | null>(null);
  const [hasFever, setHasFever] = useState(false);
  const [temperature, setTemperature] = useState('');
  const [painLevel, setPainLevel] = useState(0);
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>([]);
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [currentMeds, setCurrentMeds] = useState('');
  const [allergies, setAllergies] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [formData, setFormData] = useState<TriageFormData | null>(null);
  const [error, setError] = useState('');

  const hasEmergency = Object.values(emergencyFlags).some(Boolean);

  function toggleOther(item: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasEmergency) return;
    setLoading(true);
    setError('');

    const durationValues = lang === 'pt' ? DURATION_VALUES_PT : DURATION_VALUES_EN;
    const data: TriageFormData = {
      age: parseInt(age),
      gender: gender as TriageFormData['gender'],
      pregnant,
      main_symptom: mainSymptom,
      duration: durationIdx !== null ? durationValues[durationIdx] : '',
      fever: hasFever,
      temperature: hasFever && temperature ? parseFloat(temperature) : null,
      pain_level: painLevel,
      other_symptoms: otherSymptoms,
      chronic_conditions: chronicConditions,
      current_medications: currentMeds,
      allergies,
      language: lang,
    };

    setFormData(data);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json);
    } catch {
      setError(lang === 'pt' ? 'Erro ao contactar o servidor. Tente novamente.' : 'Error contacting server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setFormData(null);
    setAge('');
    setGender('');
    setPregnant(false);
    setEmergencyFlags({});
    setMainSymptom('');
    setDurationIdx(null);
    setHasFever(false);
    setTemperature('');
    setPainLevel(0);
    setOtherSymptoms([]);
    setChronicConditions([]);
    setCurrentMeds('');
    setAllergies('');
    setError('');
  }

  if (result && formData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-900">{tr.resultTitle}</h1>
            <button onClick={reset} className="text-sm text-blue-600 underline hover:text-blue-800">
              ← {tr.newTriage}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex justify-center">
              <UrgencyBadge level={result.urgency_level} label={result.urgency_label} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-700 mb-1">{tr.assessment}</h2>
              <p className="text-gray-800">{result.assessment}</p>
            </div>

            <div>
              <h2 className="font-semibold text-gray-700 mb-2">{tr.recommendations}</h2>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-800">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-gray-700 mb-1">{tr.medicines}</h2>
              <p className="text-gray-800">{result.medicines_info}</p>
            </div>

            <div>
              <h2 className="font-semibold text-gray-700 mb-1">{tr.whenToWorry}</h2>
              <p className="text-orange-700 bg-orange-50 rounded-xl px-4 py-2 text-sm">{result.when_to_worry}</p>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 italic">
              {result.disclaimer}
            </div>
          </div>

          <ChatInterface
            lang={lang}
            triageContext={{
              ...result,
              main_symptom: formData.main_symptom,
              age: formData.age,
              language: lang,
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">{tr.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{tr.subtitle}</p>
            <p className="text-sm font-medium text-blue-700 mt-1">📞 {tr.callReal}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="text-sm border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{tr.section1}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr.age}</label>
              <input
                type="number" min="0" max="120" required
                value={age} onChange={e => setAge(e.target.value)}
                placeholder={tr.agePlaceholder}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tr.gender}</label>
              <div className="flex gap-3">
                {(['Masculino', 'Feminino'] as const).map((g, i) => (
                  <button
                    key={g} type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl border-2 font-medium transition-colors text-sm ${
                      gender === g ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {i === 0 ? tr.male : tr.female}
                  </button>
                ))}
              </div>
            </div>

            {gender === 'Feminino' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr.pregnant}</label>
                <div className="flex gap-3">
                  {([true, false] as const).map(v => (
                    <button
                      key={String(v)} type="button"
                      onClick={() => setPregnant(v)}
                      className={`flex-1 py-2 rounded-xl border-2 font-medium transition-colors text-sm ${
                        pregnant === v ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {v ? tr.yes : tr.no}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 2 — Emergency */}
          <section className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-red-700">{tr.section2}</h2>
            <p className="text-sm text-red-600">{tr.section2Desc}</p>

            {EMERGENCY_QUESTIONS.map(q => (
              <label key={q} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!emergencyFlags[q]}
                  onChange={e => setEmergencyFlags({ ...emergencyFlags, [q]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-red-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-red-700 transition-colors">
                  {tr[q]}
                </span>
              </label>
            ))}

            {hasEmergency && (
              <div className="bg-red-600 text-white rounded-xl px-4 py-3 text-center font-bold animate-pulse">
                {tr.emergency}
                <p className="font-normal text-sm mt-1">{tr.emergencyDesc}</p>
              </div>
            )}
          </section>

          {/* Section 3 — Symptoms */}
          {!hasEmergency && (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-800">{tr.section3}</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.mainSymptom}</label>
                <select
                  required value={mainSymptom} onChange={e => setMainSymptom(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{tr.selectSymptom}</option>
                  {tr.symptoms.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr.duration}</label>
                <div className="flex flex-col gap-2">
                  {DURATION_KEYS.map((key, i) => (
                    <button
                      key={key} type="button"
                      onClick={() => setDurationIdx(i)}
                      className={`py-2 px-4 rounded-xl border-2 text-sm text-left transition-colors ${
                        durationIdx === i ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {tr[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr.hasFever}</label>
                <div className="flex gap-3">
                  {([true, false] as const).map(v => (
                    <button
                      key={String(v)} type="button"
                      onClick={() => setHasFever(v)}
                      className={`flex-1 py-2 rounded-xl border-2 font-medium transition-colors text-sm ${
                        hasFever === v ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {v ? tr.yes : tr.no}
                    </button>
                  ))}
                </div>
                {hasFever && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tr.temperature}</label>
                    <input
                      type="number" step="0.1" min="35" max="42"
                      value={temperature} onChange={e => setTemperature(e.target.value)}
                      placeholder={tr.tempPlaceholder}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr.painLevel}: <span className="font-bold text-blue-700">{painLevel}/10</span>
                </label>
                <input
                  type="range" min="0" max="10" value={painLevel}
                  onChange={e => setPainLevel(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span><span>5</span><span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr.otherSymptoms}</label>
                <div className="flex flex-wrap gap-2">
                  {tr.otherSymptomsList.map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => toggleOther(s, otherSymptoms, setOtherSymptoms)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                        otherSymptoms.includes(s) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr.chronicConditions}</label>
                <div className="flex flex-wrap gap-2">
                  {tr.chronicList.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => toggleOther(c, chronicConditions, setChronicConditions)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                        chronicConditions.includes(c) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.currentMeds}</label>
                <input
                  type="text" value={currentMeds} onChange={e => setCurrentMeds(e.target.value)}
                  placeholder={tr.medsPlaceholder}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr.allergies}</label>
                <input
                  type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
                  placeholder={tr.allergiesPlaceholder}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {!hasEmergency && (
            <button
              type="submit" disabled={loading || !age || !gender || !mainSymptom || durationIdx === null}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? tr.submitting : tr.submit}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
