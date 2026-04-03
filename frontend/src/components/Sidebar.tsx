import React, { useState } from 'react';
import { useChats } from '../hooks/useChats';
import { Plus, Trash2, Pencil, Check, X, MessageSquare } from 'lucide-react';

export default function Sidebar() {
  const { chats, activeChatId, setActiveChatId, create, rename, remove } = useChats();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const confirmRename = async () => {
    if (editingId && editName.trim()) {
      await rename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={() => create()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {chats.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8">No chats yet</div>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${
              activeChatId === chat.id
                ? 'bg-gray-700/80 text-gray-100'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
            onClick={() => setActiveChatId(chat.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {editingId === chat.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                  className="flex-1 bg-gray-600 rounded px-1 py-0.5 text-sm text-gray-100 outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); confirmRename(); }}>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-sm">{chat.name}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(chat.id, chat.name);
                    }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(chat.id);
                    }}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
