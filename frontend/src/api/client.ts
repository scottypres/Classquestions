import type { Chat, UploadedFile } from '../types';

const BASE = import.meta.env.DEV ? '/api' : '/_/backend/api';

export async function fetchChats(): Promise<Chat[]> {
  try {
    const res = await fetch(`${BASE}/chats`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createChat(name: string = 'New Chat'): Promise<Chat> {
  const res = await fetch(`${BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getChat(id: string) {
  const res = await fetch(`${BASE}/chats/${id}`);
  return res.json();
}

export async function renameChat(id: string, name: string) {
  const res = await fetch(`${BASE}/chats/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteChat(id: string) {
  await fetch(`${BASE}/chats/${id}`, { method: 'DELETE' });
}

export async function saveMessages(
  chatId: string,
  messages: { role: string; provider?: string; content: string; model?: string }[]
) {
  try {
    const res = await fetch(`${BASE}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchModels(provider: string) {
  try {
    const res = await fetch(`${BASE}/models/${provider}`);
    if (!res.ok) return { provider, models: [] };
    return res.json();
  } catch {
    return { provider, models: [] };
  }
}

export async function uploadFile(file: File, chatId?: string): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  if (chatId) form.append('chat_id', chatId);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  return res.json();
}

export async function exportPdf(chatId: string, provider?: string): Promise<Blob> {
  const params = new URLSearchParams({ chat_id: chatId });
  if (provider) params.set('provider', provider);
  const res = await fetch(`${BASE}/export/pdf?${params}`);
  return res.blob();
}

export interface StreamCallbacks {
  onToken: (provider: string, token: string) => void;
  onDone: (provider: string) => void;
  onError: (provider: string, error: string) => void;
}

export function streamQuery(
  prompt: string,
  providers: string[],
  models: Record<string, string>,
  fileIds: string[],
  classQuestionsMode: boolean,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      providers,
      models,
      file_ids: fileIds,
      class_questions_mode: classQuestionsMode,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        providers.forEach((p) => callbacks.onError(p, `Server error: ${response.status} ${text}`));
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token') {
                callbacks.onToken(data.provider, data.content);
              } else if (data.type === 'done') {
                callbacks.onDone(data.provider);
              } else if (data.type === 'error') {
                callbacks.onError(data.provider, data.content);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        providers.forEach((p) => callbacks.onError(p, err.message));
      }
    });

  return controller;
}
