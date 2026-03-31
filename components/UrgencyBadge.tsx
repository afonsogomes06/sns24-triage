'use client';

import { TriageResult } from '@/lib/types';

const config: Record<TriageResult['urgency_level'], { bg: string; text: string; border: string; icon: string }> = {
  verde:     { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  icon: '✅' },
  amarelo:   { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⚠️' },
  laranja:   { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '🟠' },
  vermelho:  { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    icon: '🔴' },
  emergencia:{ bg: 'bg-red-600',    text: 'text-white',      border: 'border-red-800',    icon: '🚨' },
};

export default function UrgencyBadge({ level, label }: { level: TriageResult['urgency_level']; label: string }) {
  const c = config[level];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold text-lg ${c.bg} ${c.text} ${c.border}`}>
      <span>{c.icon}</span>
      <span>{label}</span>
    </div>
  );
}
