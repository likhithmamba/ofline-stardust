// ─── Offline AI Wrapper (Ollama) ─────────────────────────────────────────────
// Replaces Google Gemini API with local Ollama inference.
// Works in both Electron (via IPC) and browser dev mode (direct HTTP).

const OLLAMA_BASE = 'http://localhost:11434';
const MODEL_KEY = 'stardust_ollama_model';
const DEFAULT_MODEL = 'llama3.2';

// ─── Model Preference ─────────────────────────────────────────────────────────
export const saveSelectedModel = (model: string) => {
  localStorage.setItem(MODEL_KEY, model);
};

export const getSelectedModel = (): string => {
  return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
};

// ─── Ollama Status & Models ───────────────────────────────────────────────────
export const checkOllamaStatus = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.status();
    return result.running;
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
};

export const getOllamaModels = async (): Promise<string[]> => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.models();
    return (result.models || []).map((m: any) => m.name || m.model || m);
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await res.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
};

export const startOllama = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.start();
    return result.started;
  }
  return false;
};

export const pullOllamaModel = async (model: string): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.pull({ model });
    return result.success;
  }
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const generateContent = async (prompt: string, context: string = ''): Promise<string> => {
  const model = getSelectedModel();

  const fullPrompt = context
    ? `You are a thoughtful AI assistant in a space-themed canvas notes app called Stardust.\n\nContext: ${context}\n\nTask: ${prompt}\n\nBe concise, creative, and insightful.`
    : `You are a thoughtful AI assistant in a space-themed notes app called Stardust.\n\n${prompt}\n\nBe concise and helpful.`;

  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.generate({ model, prompt: fullPrompt });
    if (result.error) throw new Error(result.error);
    return result.text;
  }

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: fullPrompt, stream: false, options: { temperature: 0.7, num_predict: 600 } }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
  const data = await res.json();
  return data.response || '';
};

export const chatWithAI = async (
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<string> => {
  const model = getSelectedModel();

  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    const result = await (window as any).electronAPI.ollama.chat({ model, messages });
    if (result.error) throw new Error(result.error);
    return result.text;
  }

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) throw new Error(`Ollama chat error: ${res.statusText}`);
  const data = await res.json();
  return data.message?.content || '';
};

// Legacy stubs for backward compat
export const saveApiKey = async (_key: string, _password: string) => {};
export const getApiKey = async (_password: string): Promise<string | null> => null;
