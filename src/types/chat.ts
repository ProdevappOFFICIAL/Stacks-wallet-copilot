// Chat message interface
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  txHash?: string;
}

// Chat session interface
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat history interface
export interface ChatHistory {
  sessions: ChatSession[];
  activeSessionId: string | null;
}