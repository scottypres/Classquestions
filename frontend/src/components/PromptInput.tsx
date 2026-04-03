import { useState, useCallback, type KeyboardEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { useChatStore } from '../stores/chatStore';
import { useStreamingQuery } from '../hooks/useStreamingQuery';
import { useChats } from '../hooks/useChats';
import { uploadFile, saveMessages } from '../api/client';
import { Send, Paperclip, X, StopCircle } from 'lucide-react';

export default function PromptInput() {
  const [text, setText] = useState('');
  const {
    uploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    setUploadedFiles,
    isQuerying,
    activeChatId,
  } = useChatStore();
  const { send, cancel } = useStreamingQuery();
  const { create } = useChats();

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const uploaded = await uploadFile(file, activeChatId || undefined);
        addUploadedFile(uploaded);
      }
    },
    [activeChatId, addUploadedFile]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleSubmit = async () => {
    const prompt = text.trim();
    if (!prompt || isQuerying) return;

    let chatId = activeChatId;
    if (!chatId) {
      const chat = await create(prompt.slice(0, 50));
      chatId = chat.id;
    }

    setText('');
    send(prompt);

    // Save user message
    await saveMessages(chatId!, [{ role: 'user', content: prompt }]);

    // Wait for all responses to complete, then save
    const checkDone = setInterval(async () => {
      const state = useChatStore.getState();
      const allDone = ['gemini', 'claude', 'chatgpt'].every(
        (p) => state.responses[p].status === 'done' || state.responses[p].status === 'error'
      );
      if (allDone) {
        clearInterval(checkDone);
        const msgs = ['gemini', 'claude', 'chatgpt']
          .filter((p) => state.responses[p].content)
          .map((p) => ({
            role: 'assistant',
            provider: p,
            content: state.responses[p].content,
            model: state.responses[p].model,
          }));
        if (msgs.length > 0) {
          await saveMessages(chatId!, msgs);
        }
        setUploadedFiles([]);
      }
    }, 500);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div {...getRootProps()} className="border-t border-gray-700 bg-gray-900 p-3">
      <input {...getInputProps()} />
      {uploadedFiles.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {uploadedFiles.map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-full"
            >
              {f.filename}
              <button onClick={() => removeUploadedFile(f.id)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={open}
          className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask all three models..."
          rows={1}
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          style={{ minHeight: '44px', maxHeight: '200px' }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 200) + 'px';
          }}
        />
        {isQuerying ? (
          <button
            onClick={cancel}
            className="p-2 text-red-400 hover:text-red-300 transition-colors"
            title="Stop"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-2 text-blue-400 hover:text-blue-300 disabled:text-gray-600 transition-colors"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
