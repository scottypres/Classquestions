import React, { useEffect, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { fetchModels } from '../api/client';
import type { ModelOption } from '../types';
import { X } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const { selectedModels, setSelectedModel } = useChatStore();
  const [modelOptions, setModelOptions] = useState<Record<string, ModelOption[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    PROVIDERS.forEach(async ({ id }) => {
      setLoading((prev) => ({ ...prev, [id]: true }));
      try {
        const data = await fetchModels(id);
        setModelOptions((prev) => ({ ...prev, [id]: data.models || [] }));
      } catch {
        setModelOptions((prev) => ({ ...prev, [id]: [] }));
      }
      setLoading((prev) => ({ ...prev, [id]: false }));
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-5">
          {PROVIDERS.map(({ id, label }) => (
            <div key={id}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {label} Model
              </label>
              {loading[id] ? (
                <div className="text-gray-500 text-sm">Loading models...</div>
              ) : (
                <select
                  value={selectedModels[id] || ''}
                  onChange={(e) => setSelectedModel(id, e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Default</option>
                  {(modelOptions[id] || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
