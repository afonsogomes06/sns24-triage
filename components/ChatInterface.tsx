'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, TriageResult } from '@/lib/types';
import { t, Language } from '@/lib/i18n';

interface Props {
  triageContext: TriageResult & { main_symptom: string; age: number; language: Language };
  lang: Language;
}

export default function ChatInterface({ triageContext, lang }: Props) {
  const tr = t[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, triage_context: triageContext }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: lang === 'pt' ? 'Erro ao obter resposta. Tente novamente.' : 'Error getting response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[480px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-3 font-semibold flex items-center gap-2">
        <span>💬</span>
        <span>{tr.chatTitle}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-sm text-gray-500 text-center italic">{tr.chatIntro}</div>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none text-sm animate-pulse">
              {lang === 'pt' ? 'A responder...' : 'Thinking...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={tr.chatPlaceholder}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {tr.send}
        </button>
      </div>
    </div>
  );
}
