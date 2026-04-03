import { useCallback, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import * as api from '../api/client';

export function useChats() {
  const { chats, setChats, activeChatId, setActiveChatId } = useChatStore();

  const load = useCallback(async () => {
    const data = await api.fetchChats();
    setChats(data);
  }, [setChats]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (name?: string) => {
      const chat = await api.createChat(name);
      setChats([chat, ...chats]);
      setActiveChatId(chat.id);
      return chat;
    },
    [chats, setChats, setActiveChatId]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await api.renameChat(id, name);
      setChats(chats.map((c) => (c.id === id ? { ...c, name } : c)));
    },
    [chats, setChats]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteChat(id);
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      if (activeChatId === id) {
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [chats, setChats, activeChatId, setActiveChatId]
  );

  return { chats, activeChatId, setActiveChatId, create, rename, remove, reload: load };
}
