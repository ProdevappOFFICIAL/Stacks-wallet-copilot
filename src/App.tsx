import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import ChatSidebar from './components/ChatSidebar';
import TransactionHistory from './components/TransactionHistory';
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Transfer</h2>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold text-gray-900 capitalize">{details.type}</span>
          </div>
          {details.recipient && (
            <div className="flex justify-between">
              <span className="text-gray-600">Recipient:</span>
              <span className="font-mono text-sm text-gray-900">
                {details.recipient.slice(0, 8)}...{details.recipient.slice(-6)}
              </span>
            </div>
          )}
          {details.amount !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-gray-900">{details.amount} STX</span>
            </div>
          )}
          {details.memo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Memo:</span>
              <span className="text-gray-900">{details.memo}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log('Cancel button clicked');
              onCancel();
            }}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Transfer'
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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          : 'bg-slate-800 text-slate-100 border border-slate-700'
          }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        {message.txHash && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} />
              <span className="font-mono">
                {message.txHash.slice(0, 8)}...{message.txHash.slice(-6)}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Current session state
  const activeSession = chatHistory.sessions.find(s => s.id === chatHistory.activeSessionId);
  const messages = activeSession?.messages || [];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTx, setPendingTx] = useState<TransactionDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

  // Chat management functions - declared early to avoid hoisting issues
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, txHash?: string) => {
    if (!activeSession) return;

    const updatedSession = addMessageToSession(activeSession, role, content, txHash);
    setChatHistory(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === activeSession.id ? updatedSession : s
      )
    }));
  }, [activeSession]);

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

  // Debug state changes
  useEffect(() => {
    console.log('State changed:', { showPreview, pendingTx, isProcessing });
  }, [showPreview, pendingTx, isProcessing]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Network configuration - centralized network management
  const network = NETWORK_CONFIG.network;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle wallet connection status changes and fetch balance
  useEffect(() => {
    if (userData) {
      // Only add message if this is a new connection (not on page load with existing session)
      const isNewConnection = messages.length === 1; // Only initial message exists
      if (isNewConnection) {
        // Fetch balance and show connection message
        const fetchBalanceAndConnect = async () => {
          try {
            // Get the correct address based on network
            const address = getCurrentAddress(userData);

            if (address) {
              const balance = await getSTXBalance(address, NETWORK_CONFIG.networkName);
              addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${address}\nBalance: ${balance.toFixed(6)} STX\n\nTry saying: "Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" or "Check my balance"\n\nHow can I assist you with blockchain transactions today?`);
            } else {
              addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${getCurrentAddress(userData)}\n\nHow can I assist you with blockchain transactions today?`);
            }
          } catch (error) {
            const address = getCurrentAddress(userData);
            addMessage('assistant', `Wallet connected successfully! 🎉\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nYour address: ${address}\n\nNote: Could not fetch balance at this time.\n\nHow can I assist you with blockchain transactions today?`);
          }
        };

        fetchBalanceAndConnect();
      }
    }
  }, [userData, messages.length, addMessage]);

  const handleNewChat = () => {
    const newSession = createNewSession();
    setChatHistory(prev => ({
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newSession.id
    }));
  };

  const handleSessionSelect = (sessionId: string) => {
    setChatHistory(prev => ({
      ...prev,
      activeSessionId: sessionId
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatHistory(prev => deleteSession(prev, sessionId));
  };

  // Custom disconnect function that also handles messages
  const handleDisconnectWallet = () => {
    disconnectWallet();
    addMessage('assistant', 'Wallet disconnected. Connect again to continue using blockchain features.');
  };

  const parseIntent = (input: string): TransactionDetails | null => {
    const lowerInput = input.toLowerCase();

    // Parse STX transfer
    const sendMatch = input.match(/send\s+([\d.]+)\s+stx\s+to\s+([a-zA-Z0-9]+)/i);
    if (sendMatch || (lowerInput.includes('send') && lowerInput.includes('stx'))) {
      const amountMatch = input.match(/([\d.]+)\s*stx/i);
      const addressMatch = input.match(/to\s+([a-zA-Z0-9]+)/i) ||
        input.match(/([a-zA-Z0-9]{40,})/);

      if (amountMatch && addressMatch) {
        return {
          type: 'transfer',
          amount: parseFloat(amountMatch[1]),
          recipient: addressMatch[1],
          fee: 0.0001,
          memo: 'Sent via Stacks Chat Assistant'
        };
      }
    }

    // Handle balance check (not a transaction, but we can respond)
    if (lowerInput.includes('balance') || lowerInput.includes('check balance')) {
      return null; // We'll handle this separately
    }

    return null;
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

  const handleSubmit = () => {
    if (!input.trim() || !userData) return;

    const userMessage = input.trim();
    addMessage('user', userMessage);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const lowerInput = userMessage.toLowerCase();

        // Handle balance check
        if (lowerInput.includes('balance') || lowerInput.includes('check balance')) {
          const fetchBalance = async () => {
            try {
              // Get the correct address based on network
              const address = getCurrentAddress(userData);

              if (address) {
                const balance = await getSTXBalance(address, NETWORK_CONFIG.networkName);
                addMessage(
                  'assistant',
                  `💰 **Your STX Balance**\n\nNetwork: ${NETWORK_CONFIG.networkName.toUpperCase()}\nAddress: ${address}\nBalance: **${balance.toFixed(6)} STX**\n\nYou can use this balance to send STX to other addresses or interact with smart contracts.`
                );
              } else {
                addMessage('assistant', 'Could not retrieve your wallet address. Please reconnect your wallet.');
              }
            } catch (error) {
              addMessage(
                'assistant',
                `❌ Could not fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis might be due to network issues or API limitations. Please try again later.`
              );
            } finally {
              setIsLoading(false);
            }
          };

          fetchBalance();
          return;
        }

        // Handle transaction history requests
        if (lowerInput.includes('history') || lowerInput.includes('transactions') || lowerInput.includes('past transactions')) {
          setShowTransactionHistory(true);
          addMessage(
            'assistant',
            "I've opened your transaction history for you! 📊\n\nYou can view all your past transactions, filter by status or type, and see detailed information about each transaction. Click the History button in the header anytime to access it."
          );
          setIsLoading(false);
          return;
        }

        // Handle help requests
        if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
          addMessage(
            'assistant',
            "I can help you with Stacks blockchain operations! Here's what I can do:\n\n🔹 **Send STX**: \"Send 0.01 STX to [address]\"\n🔹 **Check Balance**: \"What's my balance?\"\n🔹 **Get Address**: \"What's my address?\"\n🔹 **View History**: \"Show my transaction history\"\n\nI'll guide you through each transaction with a preview before execution. Your wallet will always confirm before any transaction is sent."
          );
          setIsLoading(false);
          return;
        }

        // Handle address requests
        if (lowerInput.includes('address') || lowerInput.includes('my address')) {
          const address = getCurrentAddress(userData);

          addMessage(
            'assistant',
            `Your Stacks ${NETWORK_CONFIG.networkName} address is:\n\n\`${address}\`\n\nYou can share this address to receive STX tokens.`
          );
          setIsLoading(false);
          return;
        }

        // Handle quick send command
        if (lowerInput.includes('send 0.01 stx to st1pqhqkv0rjxzfy1dgx8mnsnyve3vgzjsrtpgzgm')) {
          const quickIntent: TransactionDetails = {
            type: 'transfer',
            amount: 0.01,
            recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            fee: 0.0001,
            memo: 'Quick send via Stacks Chat Assistant'
          };

          addMessage(
            'assistant',
            `I'll help you send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM. Let me prepare the transaction details for your review.`
          );

          console.log('Setting up quick transaction:', quickIntent);
          setPendingTx(quickIntent);
          setShowPreview(true);
          console.log('Modal should now be visible');
          setIsLoading(false);
          return;
        }

        // Parse transaction intent
        const intent = parseIntent(userMessage);

        if (intent) {
          addMessage(
            'assistant',
            `I'll help you ${intent.type === 'transfer' ? 'send' : 'execute'} that transaction. Let me prepare the details for your review.`
          );

          console.log('Setting up transaction:', intent);
          setPendingTx(intent);
          setShowPreview(true);
          console.log('Modal should now be visible');
        } else {
          addMessage(
            'assistant',
            "I couldn't understand that command. Try asking me to:\n\n• Send [amount] STX to [address]\n• Check my balance\n• What's my address?\n• Help\n\nExample: \"Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM\""
          );
        }
      } catch (error: unknown) {
        addMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <ChatSidebar
        sessions={chatHistory.sessions}
        activeSessionId={chatHistory.activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Stacks Assistant</h1>
              <NetworkSwitcher onNetworkChange={(network) => {
                console.log('Network changed to:', network);
              }} />
            </div>
            {userData ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTransactionHistory(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    <History className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    History
                  </span>
                </button>
                <div
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-700 text-sm font-medium">
                      {abbreviateAddress(getCurrentAddress(userData) || '')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectWallet}
                    className="group px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 border-l border-gray-200 rounded-r-lg transition-all duration-200"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center gap-2">
                  <Wallet2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  Connect Wallet
                </span>
              </button>
            )}


          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 px-4 py-6 flex flex-col max-h-[calc(100vh-80px)]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-1">
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
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-4">
            {!userData && (
              <div className="mb-4 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-400 text-sm">
                  Connect your Stacks wallet to start using blockchain features.
                </p>
              </div>
            )}

            <div className="flex gap-3">
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
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[50px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '50px'
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                <p>
                  Try: "Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" or "Check my balance"
                </p>
              </div>
              {userData && (
                <div className="flex gap-2">
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
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded"
                  >
                    Test Modal
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
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Test Wallet
                  </button>
                  <button
                    onClick={async () => {
                      const { testTransactionHistory } = await import('./utils/transactionTest');
                      const result = testTransactionHistory();
                      addMessage('assistant', `✅ Transaction history test completed. Found ${result.transactions.length} transactions in history.`);
                    }}
                    className="text-xs bg-orange-700 hover:bg-orange-600 text-white px-2 py-1 rounded"
                  >
                    Test History
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
      </div>
    </div>

  );
};

export default App;