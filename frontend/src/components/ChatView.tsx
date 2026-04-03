import { useEffect, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { getChat } from '../api/client';
import ResponseTabs from './ResponseTabs';
import SplitView from './SplitView';
import PromptInput from './PromptInput';
import ClassQuestionsSummary from './ClassQuestionsMode';
import SettingsModal from './SettingsModal';
import PdfExportMenu from './PdfExportMenu';
import MarkdownRenderer from './MarkdownRenderer';
import type { Message } from '../types';
import {
  Settings,
  SplitSquareVertical,
  LayoutList,
  GraduationCap,
} from 'lucide-react';

export default function ChatView() {
  const {
    activeChatId,
    viewMode,
    setViewMode,
    classQuestionsMode,
    setClassQuestionsMode,
    responses,
    resetResponses,
  } = useChatStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);

  useEffect(() => {
    if (!activeChatId) {
      setHistory([]);
      return;
    }
    resetResponses();
    getChat(activeChatId).then((data) => {
      setHistory(data.messages || []);
    });
  }, [activeChatId, resetResponses]);

  const hasCurrentResponse = Object.values(responses).some((r) => r.content);

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-900/80 shrink-0">
        <h1 className="text-sm font-semibold text-gray-300">ClassQuestions</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setClassQuestionsMode(!classQuestionsMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              classQuestionsMode
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Class Questions Mode"
          >
            <GraduationCap className="w-4 h-4" />
            Class Mode
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'tabs' ? 'split' : 'tabs')}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
            title={viewMode === 'tabs' ? 'Switch to Split View' : 'Switch to Tab View'}
          >
            {viewMode === 'tabs' ? (
              <SplitSquareVertical className="w-5 h-5" />
            ) : (
              <LayoutList className="w-5 h-5" />
            )}
          </button>
          <PdfExportMenu />
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat history */}
      {history.length > 0 && (
        <div className="overflow-y-auto border-b border-gray-700 max-h-64 shrink-0">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gray-800/40'
                  : 'bg-gray-900/40'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {msg.role === 'user'
                  ? 'You'
                  : msg.provider
                  ? msg.provider.charAt(0).toUpperCase() + msg.provider.slice(1)
                  : 'Assistant'}
              </div>
              <div className="text-sm text-gray-200">
                <MarkdownRenderer content={msg.content} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Questions Summary */}
      {classQuestionsMode && <ClassQuestionsSummary />}

      {/* Response area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {hasCurrentResponse ? (
          viewMode === 'tabs' ? (
            <ResponseTabs />
          ) : (
            <SplitView />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">Ask a question to all three models</p>
              <p className="text-sm mt-1">Responses will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <PromptInput />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
