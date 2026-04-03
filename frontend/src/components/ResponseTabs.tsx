import { useChatStore } from '../stores/chatStore';
import ResponsePanel from './ResponsePanel';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', color: 'text-blue-400' },
  { id: 'claude', label: 'Claude', color: 'text-orange-400' },
  { id: 'chatgpt', label: 'ChatGPT', color: 'text-green-400' },
];

export default function ResponseTabs() {
  const { responses, activeProvider, setActiveProvider, enabledProviders } =
    useChatStore();

  const visibleProviders = PROVIDERS.filter(
    ({ id }) => enabledProviders[id] !== false
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'streaming':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        {visibleProviders.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setActiveProvider(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeProvider === id
                ? `${color} border-b-2 border-current bg-gray-800/50`
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            {label}
            {statusIcon(responses[id]?.status)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {responses[activeProvider] && (
          <ResponsePanel response={responses[activeProvider]} />
        )}
      </div>
    </div>
  );
}
