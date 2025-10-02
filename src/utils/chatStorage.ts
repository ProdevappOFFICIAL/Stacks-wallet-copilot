import type { ChatHistory, ChatSession, Message } from '../types/chat';

const STORAGE_KEY = 'stacks-chat-history';

// Default welcome message
const getWelcomeMessage = (): Message => ({
  id: '1',
  role: 'assistant',
  content: "Hello! I'm your Stacks blockchain assistant. 👋\n\nTo get started:\n1. Install a Stacks wallet (Hiro Wallet, Xverse, or Leather)\n2. Click 'Connect Wallet' above\n3. Start chatting!\n\nI can help you:\n• Send STX to addresses\n• Check your balance\n• Get your wallet address\n• View your transaction history\n• And more blockchain operations!",
  timestamp: new Date()
});

// Generate a title from the first user message
const generateChatTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    if (content.length > 30) {
      return content.substring(0, 30) + '...';
    }
    return content;
  }
  return 'New Chat';
};

// Load chat history from localStorage
export const loadChatHistory = (): ChatHistory => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      const sessions = parsed.sessions.map((session: Record<string, unknown>) => ({
        ...session,
        createdAt: new Date(session.createdAt as string),
        updatedAt: new Date(session.updatedAt as string),
        messages: (session.messages as Record<string, unknown>[]).map((msg: Record<string, unknown>) => ({
          ...msg,
          timestamp: new Date(msg.timestamp as string)
        }))
      }));
      return { ...parsed, sessions };
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  
  // Return default state with initial session
  const initialSession = createNewSession();
  return {
    sessions: [initialSession],
    activeSessionId: initialSession.id
  };
};

// Save chat history to localStorage
export const saveChatHistory = (history: ChatHistory): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Create a new chat session
export const createNewSession = (): ChatSession => {
  const now = new Date();
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    title: 'New Chat',
    messages: [getWelcomeMessage()],
    createdAt: now,
    updatedAt: now
  };
};

// Update session title based on messages
export const updateSessionTitle = (session: ChatSession): ChatSession => {
  const newTitle = generateChatTitle(session.messages);
  return {
    ...session,
    title: newTitle,
    updatedAt: new Date()
  };
};

// Add message to session
export const addMessageToSession = (
  session: ChatSession, 
  role: 'user' | 'assistant', 
  content: string, 
  txHash?: string
): ChatSession => {
  const newMessage: Message = {
    id: Date.now().toString(),
    role,
    content,
    timestamp: new Date(),
    txHash
  };

  const updatedSession = {
    ...session,
    messages: [...session.messages, newMessage],
    updatedAt: new Date()
  };

  // Update title if this is the first user message
  if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 0) {
    return updateSessionTitle(updatedSession);
  }

  return updatedSession;
};

// Delete a session
export const deleteSession = (history: ChatHistory, sessionId: string): ChatHistory => {
  const filteredSessions = history.sessions.filter(s => s.id !== sessionId);
  
  // If we deleted the active session, switch to the most recent one
  let newActiveId = history.activeSessionId;
  if (history.activeSessionId === sessionId) {
    newActiveId = filteredSessions.length > 0 ? filteredSessions[0].id : null;
  }

  // If no sessions left, create a new one
  if (filteredSessions.length === 0) {
    const newSession = createNewSession();
    return {
      sessions: [newSession],
      activeSessionId: newSession.id
    };
  }

  return {
    sessions: filteredSessions,
    activeSessionId: newActiveId
  };
};