import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import type { ChatSession } from '../types/chat';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isCollapsed,
  onToggleCollapse
}) => {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  // Sort sessions by most recent first
  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 60 : 280 }}
      className="bg-slate-900/50 backdrop-blur-sm border-r border-slate-700 flex flex-col h-screen lg:h-full"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-white font-semibold text-sm">Chat History</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors lg:block"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2.5 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all text-sm font-medium"
          >
            <Plus size={16} />
            New Chat
          </button>
        )}

        {isCollapsed && (
          <button
            onClick={onNewChat}
            className="w-full mt-3 flex items-center justify-center p-2.5 sm:p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {sortedSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`relative group ${session.id === activeSessionId
                ? 'bg-slate-700/50 border-r-2 border-purple-500'
                : 'hover:bg-slate-800/50'
                }`}
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
            >
              <button
                onClick={() => onSessionSelect(session.id)}
                className={`w-full p-3 sm:p-3 text-left transition-colors ${isCollapsed ? 'flex justify-center' : ''
                  }`}
                title={isCollapsed ? session.title : undefined}
              >
                {isCollapsed ? (
                  <MessageSquare
                    size={18}
                    className={`${session.id === activeSessionId ? 'text-purple-400' : 'text-slate-400'
                      }`}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${session.id === activeSessionId ? 'text-purple-400' : 'text-slate-400'
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${session.id === activeSessionId ? 'text-white' : 'text-slate-300'
                        }`}>
                        {session.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500 truncate">
                          {formatDate(session.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>

              {/* Delete button */}
              {!isCollapsed && hoveredSession === session.id && sessions.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ChatSidebar;