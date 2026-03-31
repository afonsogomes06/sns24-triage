export interface TriageFormData {
  age: number;
  gender: 'Masculino' | 'Feminino' | 'Male' | 'Female';
  pregnant: boolean;
  main_symptom: string;
  duration: string;
  fever: boolean;
  temperature: number | null;
  pain_level: number;
  other_symptoms: string[];
  chronic_conditions: string[];
  current_medications: string;
  allergies: string;
  language: 'pt' | 'en';
}

export interface TriageResult {
  urgency_level: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'emergencia';
  urgency_label: string;
  assessment: string;
  recommendations: string[];
  medicines_info: string;
  when_to_worry: string;
  disclaimer: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
