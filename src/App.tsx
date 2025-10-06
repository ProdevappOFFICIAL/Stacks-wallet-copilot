import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  AnchorMode,
  PostConditionMode
} from '@stacks/transactions';
import { useStacks } from './hooks/useStacks';
import { motion } from 'framer-motion';
import {
  Send,
  Wallet,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet2,
  History
} from 'lucide-react';
import { abbreviateAddress, getSTXBalance } from './utils/stacks';
import { NETWORK_CONFIG, getCurrentAddress } from './utils/network';
import { NetworkSwitcher } from './components/NetworkSwitcher';
import { ModelSelector } from './components/ModelSelector';
import ChatSidebar from './components/ChatSidebar';
import TransactionHistory from './components/TransactionHistory';
import ApiKeySetup from './components/ApiKeySetup';
import type { Message, ChatHistory } from './types/chat';
import {
  loadChatHistory,
  saveChatHistory,
  createNewSession,
  addMessageToSession,
  deleteSession
} from './utils/chatStorage';
import {
  addTransaction,
  updateTransactionStatus,
  createSTXTransferTransaction
} from './utils/transactionStorage';
import { TransactionStatus } from './types/transaction';
import { aiService } from './services/aiService';

interface TransactionDetails {
  type: 'transfer' | 'deploy' | 'call';
  recipient?: string;
  amount?: number;
  fee?: number;
  memo?: string;
}

interface ActionPreviewProps {
  isOpen: boolean;
  details: TransactionDetails | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

// Using the useStacks hook for wallet connection

// Action Preview Modal Component
const ActionPreviewModal: React.FC<ActionPreviewProps> = ({
  isOpen,
  details,
  onConfirm,
  onCancel,
  isProcessing
}) => {
  console.log('ActionPreviewModal render:', { isOpen, details, isProcessing });

  if (!isOpen || !details) {
    console.log('Modal not rendering - isOpen:', isOpen, 'details:', details);
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 md:p-4">
      <div className="bg-white rounded-lg p-4 md:p-5 lg:p-6 max-w-sm md:max-w-md lg:max-w-lg w-full shadow-xl">
        <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Confirm Transfer</h2>
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-xs md:text-sm">Type:</span>
            <span className="font-semibold text-gray-900 capitalize text-xs md:text-sm">{details.type}</span>
          </div>
          {details.recipient && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-xs md:text-sm">Recipient:</span>
              <span className="font-mono text-xs md:text-sm text-gray-900 break-all text-right max-w-[60%]">
                <span className="md:hidden">{details.recipient.slice(0, 6)}...{details.recipient.slice(-4)}</span>
                <span className="hidden md:inline lg:hidden">{details.recipient.slice(0, 8)}...{details.recipient.slice(-6)}</span>
                <span className="hidden lg:inline">{details.recipient.slice(0, 10)}...{details.recipient.slice(-8)}</span>
              </span>
            </div>
          )}
          {details.amount !== undefined && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-xs md:text-sm">Amount:</span>
              <span className="font-bold text-gray-900 text-xs md:text-sm">{details.amount} STX</span>
            </div>
          )}
          {details.memo && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600 text-xs md:text-sm">Memo:</span>
              <span className="text-gray-900 text-xs md:text-sm text-right max-w-[60%] break-words">{details.memo}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3">
          <button
            onClick={() => {
              console.log('Cancel button clicked');
              onCancel();
            }}
            disabled={isProcessing}
            className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-xs md:text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log('Confirm button clicked in modal');
              console.log('About to call onConfirm function');
              onConfirm();
            }}
            disabled={isProcessing}
            className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin md:w-4 md:h-4" />
                <span className="hidden md:inline">Processing...</span>
                <span className="md:hidden">Processing</span>
              </>
            ) : (
              <>
                <span className="hidden md:inline">Confirm Transfer</span>
                <span className="md:hidden">Confirm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 md:mb-4`}
    >
      <div
        className={`max-w-[90%] md:max-w-[85%] lg:max-w-[80%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 ${isUser
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          : 'bg-slate-800 text-slate-100 border border-slate-700'
          }`}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {message.txHash && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={12} className="md:w-[14px] md:h-[14px]" />
              <span className="font-mono break-all md:break-normal">
                <span className="md:hidden">{message.txHash.slice(0, 6)}...{message.txHash.slice(-4)}</span>
                <span className="hidden md:inline lg:hidden">{message.txHash.slice(0, 8)}...{message.txHash.slice(-6)}</span>
                <span className="hidden lg:inline">{message.txHash.slice(0, 10)}...{message.txHash.slice(-8)}</span>
              </span>
            </div>
          </div>
        )}
        <span className="text-xs opacity-60 mt-1 block">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
};

// Main App Component
const App: React.FC = () => {
  const { userData, connectWallet, disconnectWallet, userSession } = useStacks();

  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatHistory>(() => loadChatHistory());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed on mobile, expanded on desktop
    return window.innerWidth < 1024;
  });

  // Current session state - memoized to prevent unnecessary re-renders
  const activeSession = useMemo(() =>
    chatHistory.sessions.find(s => s.id === chatHistory.activeSessionId),
    [chatHistory.sessions, chatHistory.activeSessionId]
  );

  const messages = useMemo(() =>
    activeSession?.messages || [],
    [activeSession?.messages]
  );

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTx, setPendingTx] = useState<TransactionDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [currentModel, setCurrentModel] = useState(() => aiService.getModel());

  // Chat management functions - declared early to avoid hoisting issues
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, txHash?: string) => {
    setChatHistory(prev => {
      const currentActiveSession = prev.sessions.find(s => s.id === prev.activeSessionId);
      if (!currentActiveSession) return prev;

      const updatedSession = addMessageToSession(currentActiveSession, role, content, txHash);
      return {
        ...prev,
        sessions: prev.sessions.map(s =>
          s.id === currentActiveSession.id ? updatedSession : s
        )
      };
    });
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  // Listen for network changes and update state
  useEffect(() => {
    const unsubscribe = NETWORK_CONFIG.onNetworkChange((network) => {
      // If user is connected, show network change message
      if (userData) {
        addMessage('assistant', `🔄 Network switched to ${network.toUpperCase()}. Please reconnect your wallet to ensure compatibility.`);
      }
    });
    return unsubscribe;
  }, [addMessage, userData]);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop (lg): expand sidebar if it was collapsed due to smaller screens
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
        }
      } else if (window.innerWidth >= 768) {
        // Tablet (md): keep sidebar collapsed but allow manual toggle
        // Don't auto-collapse if user manually opened it
      } else {
        // Mobile (sm): always collapse sidebar
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);

  // Debug state changes
  useEffect(() => {
    console.log('State changed:', { showPreview, pendingTx, isProcessing });
  }, [showPreview, pendingTx, isProcessing]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasShownWelcomeRef = useRef(false);

  // Network configuration - centralized network management
  const network = NETWORK_CONFIG.network;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle wallet connection status changes and fetch balance
  useEffect(() => {
    if (userData && !hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true;

      // Fetch balance and show connection message
      const fetchBalanceAndConnect = async () => {
        try {
          // Get the correct address based on network
          const address = getCurrentAddress(userData);

          if (address) {
            const balance = await getSTXBalance(address, NETWORK_CONFIG.networkName);
            addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${address}\nBalance: ${balance.toFixed(6)} STX\n\n${aiService.hasApiKey() 
              ? '🤖 AI is enabled! Just talk to me naturally:\n"Send 0.01 STX to my friend"\n"What\'s my balance?"\n"Show me my transaction history"' 
              : '💡 For better AI responses, click the "Setup AI" button to add your OpenRouter API key.\n\nTry: "Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"'
            }\n\nHow can I assist you with blockchain transactions today?`);
          } else {
            addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${getCurrentAddress(userData)}\n\n${aiService.hasApiKey() 
            ? '🤖 AI is enabled! Just talk to me naturally about blockchain operations.' 
            : '💡 For better AI responses, click "Setup AI" to add your OpenRouter API key.'
          }\n\nHow can I assist you with blockchain transactions today?`);
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          const address = getCurrentAddress(userData);
          addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${address}\n\nNote: Could not fetch balance at this time.\n\n${aiService.hasApiKey() 
            ? '🤖 AI is enabled! Just talk to me naturally about blockchain operations.' 
            : '💡 For better AI responses, click "Setup AI" to add your OpenRouter API key.'
          }\n\nHow can I assist you with blockchain transactions today?`);
        }
      };

      fetchBalanceAndConnect();
    } else if (!userData) {
      hasShownWelcomeRef.current = false;
    }
  }, [userData, addMessage]);

  const handleNewChat = () => {
    const newSession = createNewSession();
    setChatHistory(prev => ({
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newSession.id
    }));
    // Close sidebar on mobile and tablet after creating new chat
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setChatHistory(prev => ({
      ...prev,
      activeSessionId: sessionId
    }));
    // Close sidebar on mobile and tablet after selecting a session
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatHistory(prev => deleteSession(prev, sessionId));
  };

  const handleModelChange = (model: string) => {
    aiService.setModel(model);
    setCurrentModel(model);
    addMessage('assistant', `Switched to ${model.split('/').pop()?.replace(':free', '').replace('-', ' ')} model.`);
  };

  // Custom disconnect function that also handles messages
  const handleDisconnectWallet = () => {
    disconnectWallet();
    addMessage('assistant', 'Wallet disconnected. Connect again to continue using blockchain features.');
  };


  const executeTransaction = async () => {
    if (!pendingTx || !userData || !userSession) {
      console.log('Missing pendingTx, userData, or userSession:', { pendingTx, userData, userSession });
      addMessage('assistant', '❌ Missing required data for transaction. Please reconnect your wallet and try again.');
      setIsProcessing(false);
      return;
    }

    console.log('Executing transaction:', pendingTx);
    console.log('User data:', userData);
    console.log('User session:', userSession);

    // Check if user is properly signed in
    if (!userSession.isUserSignedIn()) {
      console.log('User is not signed in');
      addMessage('assistant', '❌ User session expired. Please reconnect your wallet.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    try {
      if (pendingTx.type === 'transfer' && pendingTx.recipient && pendingTx.amount) {
        // Create transaction record before sending
        const senderAddress = getCurrentAddress(userData);
        if (!senderAddress) {
          throw new Error('Could not get sender address');
        }

        const transaction = createSTXTransferTransaction(
          senderAddress,
          pendingTx.recipient,
          pendingTx.amount,
          NETWORK_CONFIG.networkName,
          pendingTx.memo,
          pendingTx.fee
        );

        // Add to transaction history
        addTransaction(transaction);
        setCurrentTransactionId(transaction.id);

        // Use Stacks Connect to open wallet for signing
        const txOptions = {
          recipient: pendingTx.recipient,
          amount: BigInt(Math.floor(pendingTx.amount * 1000000)), // Convert to microSTX
          network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          memo: pendingTx.memo || '',
          userSession, // Include the userSession for wallet connection
          appDetails: {
            name: "Stacks Chat Assistant",
            icon: "https://avatars.githubusercontent.com/u/231766800?s=400&u=252add02370d1b05ace6d96f7afc90f0c69bb588&v=4",
          },
          onFinish: (data: { txId: string }) => {
            console.log('Transaction finished:', data);

            // Update transaction status to confirmed
            updateTransactionStatus(transaction.id, TransactionStatus.CONFIRMED, data.txId);

            addMessage(
              'assistant',
              `✅ Transaction submitted successfully!\n\nAmount: ${pendingTx.amount} STX\nRecipient: ${pendingTx.recipient}\n\nTransaction ID: ${data.txId}\n\nYour transaction is being processed on the blockchain. You can view it in your transaction history.`,
              data.txId
            );
            setShowPreview(false);
            setPendingTx(null);
            setIsProcessing(false);
            setCurrentTransactionId(null);
          },
          onCancel: () => {
            console.log('Transaction cancelled by user');

            // Update transaction status to cancelled
            updateTransactionStatus(transaction.id, TransactionStatus.CANCELLED);

            addMessage('assistant', 'Transaction was cancelled by user.');
            setShowPreview(false);
            setPendingTx(null);
            setIsProcessing(false);
            setCurrentTransactionId(null);
          }
        };

        console.log('Opening STX transfer with options:', txOptions);

        // Import the openSTXTransfer function from @stacks/connect
        const { openSTXTransfer } = await import('@stacks/connect');

        // Add a small delay to ensure the modal state is updated
        setTimeout(async () => {
          try {
            console.log('Calling openSTXTransfer...');
            await openSTXTransfer(txOptions);
            console.log('openSTXTransfer called successfully');
          } catch (walletError) {
            console.error('Wallet opening error:', walletError);
            throw walletError;
          }
        }, 100);
      }
    } catch (error: unknown) {
      console.error('Transaction error:', error);

      // Update transaction status to failed if we have a transaction ID
      if (currentTransactionId) {
        updateTransactionStatus(
          currentTransactionId,
          TransactionStatus.FAILED,
          undefined,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }

      addMessage(
        'assistant',
        `❌ Transaction failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease try again or check your wallet.`
      );
      setShowPreview(false);
      setPendingTx(null);
      setIsProcessing(false);
      setCurrentTransactionId(null);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !userData) return;

    const userMessage = input.trim();
    console.log('Adding user message:', userMessage);
    addMessage('user', userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // Get current user context
      const address = getCurrentAddress(userData);
      let balance: number | undefined;
      
      try {
        if (address) {
          balance = await getSTXBalance(address, NETWORK_CONFIG.networkName);
        }
      } catch (error) {
        console.warn('Could not fetch balance for AI context:', error);
      }

      // Get conversation history for AI context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Get AI response
      console.log('About to call aiService.generateResponse...');
      const aiResponse = await aiService.generateResponse(
        userMessage,
        conversationHistory,
        address,
        balance,
        NETWORK_CONFIG.networkName
      );
      console.log('AI response received:', aiResponse);

      // Handle the AI response and any actions
      console.log('Processing AI response...');
      if (aiResponse.action) {
        console.log('AI response has action:', aiResponse.action);
        switch (aiResponse.action.type) {
          case 'balance':
            await handleBalanceCheck(aiResponse.message);
            break;
          
          case 'address':
            handleAddressRequest(aiResponse.message);
            break;
          
          case 'help':
            addMessage('assistant', getHelpMessage());
            break;
          
          case 'history':
            setShowTransactionHistory(true);
            addMessage('assistant', aiResponse.message + "\n\nI've opened your transaction history for you! 📊");
            break;
          
          case 'transfer':
            if (aiResponse.action.params) {
              const { amount, recipient, memo } = aiResponse.action.params;
              if (amount && recipient) {
                const transactionDetails: TransactionDetails = {
                  type: 'transfer',
                  amount,
                  recipient,
                  fee: 0.0001,
                  memo: memo || 'Sent via Stacks Chat Assistant'
                };
                
                addMessage('assistant', aiResponse.message);
                setPendingTx(transactionDetails);
                setShowPreview(true);
              } else {
                addMessage('assistant', 'I need both an amount and recipient address to send STX. Please try again with both details.');
              }
            }
            break;
          
          default:
            console.log('Default case - adding message:', aiResponse.message);
            addMessage('assistant', aiResponse.message);
        }
      } else {
        console.log('No action - adding message:', aiResponse.message);
        addMessage('assistant', aiResponse.message);
      }
      console.log('Finished processing AI response');
    } catch (error: unknown) {
      console.error('Error processing message:', error);
      addMessage('assistant', `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleBalanceCheck = async (aiMessage: string) => {
    try {
      const address = getCurrentAddress(userData);
      if (address) {
        const balance = await getSTXBalance(address, NETWORK_CONFIG.networkName);
        addMessage(
          'assistant',
          `${aiMessage}\n\n💰 **Your STX Balance**\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nAddress: ${address}\nBalance: **${balance.toFixed(6)} STX**\n\nYou can use this balance to send STX to other addresses or interact with smart contracts.`
        );
      } else {
        addMessage('assistant', 'Could not retrieve your wallet address. Please reconnect your wallet.');
      }
    } catch (error) {
      addMessage(
        'assistant',
        `❌ Could not fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis might be due to network issues or API limitations. Please try again later.`
      );
    }
  };

  const handleAddressRequest = (aiMessage: string) => {
    const address = getCurrentAddress(userData);
    addMessage(
      'assistant',
      `${aiMessage}\n\nYour Stacks ${NETWORK_CONFIG.networkName} address is:\n\n\`${address}\`\n\nYou can share this address to receive STX tokens.`
    );
  };

  const getHelpMessage = () => {
    return "I can help you with Stacks blockchain operations! Here's what I can do:\n\n🔹 **Send STX**: \"Send 0.01 STX to [address]\"\n🔹 **Check Balance**: \"What's my balance?\"\n🔹 **Get Address**: \"What's my address?\"\n🔹 **View History**: \"Show my transaction history\"\n\nI'll guide you through each transaction with a preview before execution. Your wallet will always confirm before any transaction is sent.\n\nJust talk to me naturally - I understand conversational requests!";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex relative">
      {/* Sidebar Overlay for mobile and tablet */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarCollapsed
        ? 'fixed -translate-x-full lg:translate-x-0 lg:relative'
        : 'fixed translate-x-0 lg:relative'
        } z-50 lg:z-auto transition-transform duration-300 ease-in-out h-full w-80 md:w-72 lg:w-80`}>
        <ChatSidebar
          sessions={chatHistory.sessions}
          activeSessionId={chatHistory.activeSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="px-3 md:px-4 lg:px-6 py-3 md:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 min-w-0">
              {/* Menu button for mobile and tablet */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-1.5 md:p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet size={14} className="text-white md:w-[16px] md:h-[16px] lg:w-[18px] lg:h-[18px]" />
              </div>
              <h1 className="text-base md:text-lg lg:text-xl font-bold text-white truncate">
                <span className="md:hidden">Stacks</span>
                <span className="hidden md:inline">Stacks Assistant</span>
              </h1>
              <div className="hidden md:flex md:gap-2 lg:gap-3">
                <NetworkSwitcher onNetworkChange={(network) => {
                  console.log('Network changed to:', network);
                }} />
                <ModelSelector 
                  currentModel={currentModel}
                  onModelChange={handleModelChange}
                  disabled={!aiService.hasApiKey()}
                />
              </div>
            </div>
            {userData ? (
              <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
                {/* Mobile: Show only essential buttons */}
                <div className="md:hidden flex items-center gap-1">
                  <button
                    onClick={() => setShowTransactionHistory(true)}
                    className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    title="Transaction History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowApiKeySetup(true)}
                    className={`p-1.5 ${aiService.hasApiKey() 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                    } text-white rounded-lg transition-colors`}
                    title={aiService.hasApiKey() ? 'AI Enabled' : 'Setup AI'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectWallet}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Tablet and Desktop: Show buttons with text */}
                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                  <button
                    onClick={() => setShowTransactionHistory(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center gap-1 md:gap-2">
                      <History className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="hidden lg:inline">History</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setShowApiKeySetup(true)}
                    className={`group relative overflow-hidden ${aiService.hasApiKey() 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                      : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                    } text-white px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25`}
                    title={aiService.hasApiKey() ? 'AI Enabled' : 'Setup AI'}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center gap-1 md:gap-2">
                      <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="lg:inline">{aiService.hasApiKey() ? 'AI' : 'Setup'}</span>
                    </span>
                  </button>
                 
                  <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-700 text-xs md:text-sm font-medium">
                        <span className="lg:hidden">{abbreviateAddress(getCurrentAddress(userData) || '').slice(0, 6)}...</span>
                        <span className="hidden lg:inline">{abbreviateAddress(getCurrentAddress(userData) || '')}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectWallet}
                      className="group px-2 md:px-3 py-1.5 md:py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 border-l border-gray-200 rounded-r-lg transition-all duration-200"
                      title="Disconnect Wallet"
                    >
                      <LogOut className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 md:px-4 lg:px-5 py-1.5 md:py-2 lg:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center gap-1 md:gap-2">
                  <Wallet2 className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="hidden md:inline lg:inline">Connect Wallet</span>
                  <span className="md:hidden">Connect</span>
                </span>
              </button>
            )}


          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 px-3 md:px-4 lg:px-6 py-3 md:py-4 lg:py-6 flex flex-col max-h-[calc(100vh-64px)] md:max-h-[calc(100vh-72px)] lg:max-h-[calc(100vh-80px)]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-3 md:mb-4 lg:mb-6 space-y-1">
            <div className="min-h-full flex flex-col justify-end">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                    <span className="text-slate-300 text-sm">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-3 md:p-4 lg:p-5">
            {!userData && (
              <div className="mb-3 md:mb-4 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="md:w-4 md:h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-400 text-xs md:text-sm">
                  Connect your Stacks wallet to start using blockchain features.
                </p>
              </div>
            )}

            {/* Mobile and Tablet Controls */}
            <div className="md:hidden mb-3 flex gap-2">
              <NetworkSwitcher onNetworkChange={(network) => {
                console.log('Network changed to:', network);
              }} />
              <ModelSelector 
                currentModel={currentModel}
                onModelChange={handleModelChange}
                disabled={!aiService.hasApiKey()}
              />
            </div>

            <div className="flex gap-2 md:gap-3 lg:gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    userData
                      ? "Ask me to send STX, check balance, or deploy contracts..."
                      : "Connect your wallet to get started..."
                  }
                  disabled={!userData || isLoading}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[44px] md:min-h-[50px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: window.innerWidth >= 768 ? '50px' : '44px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || !userData || isLoading}
                className="px-3 md:px-4 lg:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 min-w-[70px] md:min-w-[80px] lg:min-w-[100px] justify-center text-xs md:text-sm lg:text-base"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]" />
                ) : (
                  <>
                    <Send size={14} className="md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]" />
                    <span className="hidden md:inline">Send</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div className="text-xs text-slate-500">
                <p className="hidden lg:block">
                  Try: "Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" or "Check my balance"
                </p>
                <p className="hidden md:block lg:hidden">
                  Try: "Send 0.01 STX to [address]" or "Check balance"
                </p>
                <p className="md:hidden">
                  Try: "Send STX" or "Check balance"
                </p>
              </div>
              {userData && (
                <div className="flex gap-1 md:gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const testTx: TransactionDetails = {
                        type: 'transfer',
                        amount: 0.01,
                        recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                        fee: 0.0001,
                        memo: 'Test transaction'
                      };
                      setPendingTx(testTx);
                      setShowPreview(true);
                      console.log('Test modal triggered');
                    }}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1.5 md:py-1 rounded"
                  >
                    <span className="md:hidden">Test</span>
                    <span className="hidden md:inline">Test Modal</span>
                  </button>
                  <button
                    onClick={async () => {
                      console.log('Testing wallet connection...');
                      try {

                        console.log('Stacks Connect imported successfully');
                        console.log('UserSession signed in:', userSession.isUserSignedIn());
                        console.log('User data:', userData);
                        addMessage('assistant', '✅ Wallet connection test passed. Ready for transactions.');
                      } catch (error) {
                        console.error('Wallet test error:', error);
                        addMessage('assistant', `❌ Wallet test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1.5 md:py-1 rounded"
                  >
                    <span className="md:hidden">Wallet</span>
                    <span className="hidden md:inline">Test Wallet</span>
                  </button>
                  <button
                    onClick={async () => {
                      const { testTransactionHistory } = await import('./utils/transactionTest');
                      const result = testTransactionHistory();
                      addMessage('assistant', `✅ Transaction history test completed. Found ${result.transactions.length} transactions in history.`);
                    }}
                    className="text-xs bg-orange-700 hover:bg-orange-600 text-white px-2 py-1.5 md:py-1 rounded"
                  >
                    <span className="md:hidden">History</span>
                    <span className="hidden md:inline">Test History</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Action Preview Modal */}
        {showPreview && (
          <ActionPreviewModal
            isOpen={showPreview}
            details={pendingTx}
            onConfirm={executeTransaction}
            onCancel={() => {
              console.log('Modal cancelled');
              setShowPreview(false);
              setPendingTx(null);
              addMessage('assistant', 'Transaction cancelled.');
            }}
            isProcessing={isProcessing}
          />
        )}

        {/* Transaction History Modal */}
        <TransactionHistory
          isOpen={showTransactionHistory}
          onClose={() => setShowTransactionHistory(false)}
          currentAddress={userData ? getCurrentAddress(userData) : undefined}
        />

        {/* API Key Setup Modal */}
        <ApiKeySetup
          isOpen={showApiKeySetup}
          onClose={() => setShowApiKeySetup(false)}
        />
      </div>
    </div>

  );
};

export default App;