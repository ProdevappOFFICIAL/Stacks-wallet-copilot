import { 
  TransactionStatus,
  TransactionType,
  type TransactionHistory, 
  type AnyTransaction, 
  type STXTransferTransaction,
  type TransactionFilter
} from '../types/transaction';

const TRANSACTION_STORAGE_KEY = 'stacks-transaction-history';

// Load transaction history from localStorage
export const loadTransactionHistory = (): TransactionHistory => {
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      const transactions = parsed.transactions.map((tx: Record<string, unknown>) => ({
        ...tx,
        timestamp: new Date(tx.timestamp as string)
      }));
      return {
        transactions,
        lastUpdated: new Date(parsed.lastUpdated)
      };
    }
  } catch (error) {
    console.error('Error loading transaction history:', error);
  }
  
  // Return empty history
  return {
    transactions: [],
    lastUpdated: new Date()
  };
};

// Save transaction history to localStorage
export const saveTransactionHistory = (history: TransactionHistory): void => {
  try {
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving transaction history:', error);
  }
};

// Add a new transaction to history
export const addTransaction = (transaction: AnyTransaction): void => {
  const history = loadTransactionHistory();
  history.transactions.unshift(transaction); // Add to beginning for newest first
  history.lastUpdated = new Date();
  
  // Keep only last 100 transactions to prevent storage bloat
  if (history.transactions.length > 100) {
    history.transactions = history.transactions.slice(0, 100);
  }
  
  saveTransactionHistory(history);
};

// Update transaction status (e.g., when confirmed or failed)
export const updateTransactionStatus = (
  txId: string, 
  status: TransactionStatus, 
  txHash?: string,
  errorMessage?: string
): void => {
  const history = loadTransactionHistory();
  const txIndex = history.transactions.findIndex(tx => tx.id === txId);
  
  if (txIndex !== -1) {
    history.transactions[txIndex] = {
      ...history.transactions[txIndex],
      status,
      ...(txHash && { txHash }),
      ...(errorMessage && { errorMessage })
    };
    history.lastUpdated = new Date();
    saveTransactionHistory(history);
  }
};

// Create a new STX transfer transaction
export const createSTXTransferTransaction = (
  senderAddress: string,
  recipientAddress: string,
  amount: number,
  network: 'mainnet' | 'testnet',
  memo?: string,
  fee?: number
): STXTransferTransaction => {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: TransactionType.STX_TRANSFER,
    status: TransactionStatus.PENDING,
    timestamp: new Date(),
    network,
    senderAddress,
    recipientAddress,
    amount,
    fee,
    memo
  };
};

// Filter transactions based on criteria
export const filterTransactions = (
  transactions: AnyTransaction[],
  filter: TransactionFilter
): AnyTransaction[] => {
  return transactions.filter(tx => {
    // Filter by status
    if (filter.status && filter.status.length > 0 && !filter.status.includes(tx.status)) {
      return false;
    }
    
    // Filter by type
    if (filter.type && filter.type.length > 0 && !filter.type.includes(tx.type)) {
      return false;
    }
    
    // Filter by network
    if (filter.network && tx.network !== filter.network) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateFrom && tx.timestamp < filter.dateFrom) {
      return false;
    }
    
    if (filter.dateTo && tx.timestamp > filter.dateTo) {
      return false;
    }
    
    return true;
  });
};

// Get transaction statistics
export const getTransactionStats = (transactions: AnyTransaction[]) => {
  const stats = {
    total: transactions.length,
    pending: 0,
    confirmed: 0,
    failed: 0,
    cancelled: 0,
    totalSTXSent: 0,
    totalSTXReceived: 0,
    totalFees: 0
  };
  
  transactions.forEach(tx => {
    // Count by status
    switch (tx.status) {
      case TransactionStatus.PENDING:
        stats.pending++;
        break;
      case TransactionStatus.CONFIRMED:
        stats.confirmed++;
        break;
      case TransactionStatus.FAILED:
        stats.failed++;
        break;
      case TransactionStatus.CANCELLED:
        stats.cancelled++;
        break;
    }
    
    // Calculate STX amounts and fees
    if (tx.type === TransactionType.STX_TRANSFER) {
      const stxTx = tx as STXTransferTransaction;
      stats.totalSTXSent += stxTx.amount;
      if (tx.fee) {
        stats.totalFees += tx.fee;
      }
    }
  });
  
  return stats;
};