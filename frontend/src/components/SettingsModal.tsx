import { useEffect, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { fetchModels } from '../api/client';
import type { ModelOption } from '../types';
import { X } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', color: 'bg-blue-500' },
  { id: 'claude', label: 'Claude', color: 'bg-orange-500' },
  { id: 'chatgpt', label: 'ChatGPT', color: 'bg-green-500' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const { selectedModels, setSelectedModel, enabledProviders, toggleProvider } =
    useChatStore();
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
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-5">
          {PROVIDERS.map(({ id, label, color }) => {
            const enabled = enabledProviders[id] !== false;
            return (
              <div
                key={id}
                className={`rounded-lg border p-4 transition-colors ${
                  enabled
                    ? 'border-gray-600 bg-gray-750'
                    : 'border-gray-700 bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${enabled ? color : 'bg-gray-600'}`} />
                    <span className="text-sm font-medium text-gray-200">{label}</span>
                  </div>
                  <button
                    onClick={() => toggleProvider(id)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${
                      enabled ? color : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                        enabled ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {enabled && (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Model
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
                  </>
                )}
              </div>
            );
          })}
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
