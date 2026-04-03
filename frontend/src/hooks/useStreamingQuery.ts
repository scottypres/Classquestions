import { useRef, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { streamQuery } from '../api/client';

export function useStreamingQuery() {
  const controllerRef = useRef<AbortController | null>(null);
  const {
    selectedModels,
    uploadedFiles,
    classQuestionsMode,
    setResponse,
    appendContent,
    resetResponses,
    setIsQuerying,
  } = useChatStore();

  const send = useCallback(
    (prompt: string, providers: string[] = ['gemini', 'claude', 'chatgpt']) => {
      resetResponses();
      setIsQuerying(true);

      providers.forEach((p) =>
        setResponse(p, { status: 'streaming', content: '' })
      );

      const fileIds = uploadedFiles.map((f) => f.id);
      let doneCount = 0;

      controllerRef.current = streamQuery(
        prompt,
        providers,
        selectedModels,
        fileIds,
        classQuestionsMode,
        {
          onToken: (provider, token) => {
            appendContent(provider, token);
          },
          onDone: (provider) => {
            setResponse(provider, { status: 'done' });
            doneCount++;
            if (doneCount >= providers.length) {
              setIsQuerying(false);
            }
          },
          onError: (provider, error) => {
            setResponse(provider, {
              status: 'error',
              content:
                useChatStore.getState().responses[provider].content +
                `\n\n[Error: ${error}]`,
            });
            doneCount++;
            if (doneCount >= providers.length) {
              setIsQuerying(false);
            }
          },
        }
      );
    },
    [selectedModels, uploadedFiles, classQuestionsMode, setResponse, appendContent, resetResponses, setIsQuerying]
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setIsQuerying(false);
  }, [setIsQuerying]);

  return { send, cancel };
}
