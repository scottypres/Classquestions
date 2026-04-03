import { Fragment } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useChatStore } from '../stores/chatStore';
import ResponsePanel from './ResponsePanel';

const PANELS = [
  { id: 'gemini', label: 'Gemini', color: 'border-blue-500' },
  { id: 'claude', label: 'Claude', color: 'border-orange-500' },
  { id: 'chatgpt', label: 'ChatGPT', color: 'border-green-500' },
];

export default function SplitView() {
  const { responses, enabledProviders } = useChatStore();

  const visiblePanels = PANELS.filter(
    ({ id }) => enabledProviders[id] !== false
  );

  return (
    <Group orientation="vertical" className="h-full">
      {visiblePanels.map(({ id, label, color }, idx) => (
        <Fragment key={id}>
          {idx > 0 && (
            <Separator className="h-1.5 bg-gray-700 hover:bg-gray-500 transition-colors cursor-row-resize" />
          )}
          <Panel minSize={15}>
            <div className={`h-full flex flex-col border-l-4 ${color}`}>
              <div className="px-3 py-1.5 bg-gray-800/80 text-xs font-semibold text-gray-300 border-b border-gray-700 shrink-0">
                {label}
              </div>
              <div className="flex-1 overflow-y-auto">
                <ResponsePanel response={responses[id]} compact />
              </div>
            </div>
          </Panel>
        </Fragment>
      ))}
    </Group>
  );
}
