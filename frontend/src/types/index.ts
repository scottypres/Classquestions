export interface Chat {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  provider: string | null;
  content: string;
  model: string | null;
  created_at: string;
}

export interface ProviderResponse {
  provider: string;
  content: string;
  status: 'idle' | 'streaming' | 'done' | 'error';
  model?: string;
}

export interface ModelOption {
  id: string;
  name: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string;
}

export type ViewMode = 'tabs' | 'split';
