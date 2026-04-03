import { useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import type { ProviderResponse } from '../types';
import { Loader2 } from 'lucide-react';

interface Props {
  response: ProviderResponse;
  compact?: boolean;
}

export default function ResponsePanel({ response }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      userScrolledRef.current = !atBottom;
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (response.status === 'streaming' && !userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response.content, response.status]);

  if (response.status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Waiting for response...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overscroll-contain p-4"
    >
      {response.status === 'streaming' && !response.content && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Thinking...
        </div>
      )}
      <MarkdownRenderer content={response.content} />
      {response.status === 'streaming' && response.content && (
        <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1" />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
