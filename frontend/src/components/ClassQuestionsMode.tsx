import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', color: 'bg-blue-600' },
  { id: 'claude', label: 'Claude', color: 'bg-orange-600' },
  { id: 'chatgpt', label: 'ChatGPT', color: 'bg-green-600' },
];

function extractShortAnswer(content: string): string {
  if (!content) return '...';
  const firstLine = content.trim().split('\n')[0].trim();
  // Match patterns like "A", "B)", "3.", "(C)", etc.
  const match = firstLine.match(/^[\(\[]?([A-Ea-e]|[0-9]+)[\)\].]?\s*$/);
  if (match) return match[1].toUpperCase();
  // If first line is short enough, show it as the answer
  if (firstLine.length <= 5) return firstLine;
  return firstLine.slice(0, 3) + '...';
}

export default function ClassQuestionsSummary() {
  const { responses, enabledProviders } = useChatStore();

  const visibleProviders = PROVIDERS.filter(
    ({ id }) => enabledProviders[id] !== false
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const hasContent = Object.values(responses).some((r) => r.content);
  if (!hasContent) return null;

  return (
    <div className="border border-gray-700 rounded-lg mx-4 mt-3 bg-gray-800/60">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-400 mr-2">Quick Answers:</span>
        {visibleProviders.map(({ id, label, color }) => (
          <span
            key={id}
            className={`${color} text-white text-sm font-bold px-3 py-1 rounded-full`}
          >
            {label}: {extractShortAnswer(responses[id]?.content || '')}
          </span>
        ))}
      </div>
      <div className="divide-y divide-gray-700">
        {visibleProviders.map(({ id, label }) => (
          <div key={id}>
            <button
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
              }
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center justify-between"
            >
              <span>{label} full response</span>
              <span>{expanded[id] ? '−' : '+'}</span>
            </button>
            {expanded[id] && (
              <div className="px-3 pb-3 text-sm text-gray-200 whitespace-pre-wrap">
                {responses[id]?.content || 'No response yet'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
