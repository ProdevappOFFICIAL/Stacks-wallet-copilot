import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  
  Filter,

  TrendingUp,
  ExternalLink,
  Copy,
  Search
} from 'lucide-react';
import {
  loadTransactionHistory,
  filterTransactions,
  getTransactionStats
} from '../utils/transactionStorage';
import {
  TransactionStatus,
  TransactionType,
  type AnyTransaction,
  type STXTransferTransaction,
  type TransactionFilter
} from '../types/transaction';
import { abbreviateAddress } from '../utils/stacks';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose
}) => {
  const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<AnyTransaction[]>([]);
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions on component mount
  useEffect(() => {
    const history = loadTransactionHistory();
    setTransactions(history.transactions);
    setFilteredTransactions(history.transactions);
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = filterTransactions(transactions, filter);
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.txHash?.toLowerCase().includes(term) ||
        tx.senderAddress.toLowerCase().includes(term) ||
        (tx.type === TransactionType.STX_TRANSFER && 
         (tx as STXTransferTransaction).recipientAddress?.toLowerCase().includes(term)) ||
        tx.memo?.toLowerCase().includes(term)
      );
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, filter, searchTerm]);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case TransactionStatus.CONFIRMED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case TransactionStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case TransactionStatus.CANCELLED:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TransactionStatus.CONFIRMED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      case TransactionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = (txHash: string, network: 'mainnet' | 'testnet') => {
    const baseUrl = network === 'mainnet' 
      ? 'https://explorer.stacks.co' 
      : 'https://explorer.stacks.co/?chain=testnet';
    window.open(`${baseUrl}/txid/${txHash}`, '_blank');
  };

  const stats = getTransactionStats(filteredTransactions);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] m-2 sm:m-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Transaction History</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Total</div>
                <div className="text-xl font-bold text-blue-900">{stats.total}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Confirmed</div>
                <div className="text-xl font-bold text-green-900">{stats.confirmed}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">Pending</div>
                <div className="text-xl font-bold text-yellow-900">{stats.pending}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">STX Sent</div>
                <div className="text-xl font-bold text-purple-900">{stats.totalSTXSent.toFixed(2)}</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by address, hash, or memo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 sm:py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filter.status?.[0] || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        status: e.target.value ? [e.target.value as TransactionStatus] : undefined
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Statuses</option>
                      <option value={TransactionStatus.PENDING}>Pending</option>
                      <option value={TransactionStatus.CONFIRMED}>Confirmed</option>
                      <option value={TransactionStatus.FAILED}>Failed</option>
                      <option value={TransactionStatus.CANCELLED}>Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={filter.type?.[0] || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        type: e.target.value ? [e.target.value as TransactionType] : undefined
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Types</option>
                      <option value={TransactionType.STX_TRANSFER}>STX Transfer</option>
                      <option value={TransactionType.CONTRACT_CALL}>Contract Call</option>
                      <option value={TransactionType.CONTRACT_DEPLOY}>Contract Deploy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                    <select
                      value={filter.network || ''}
                      onChange={(e) => setFilter(prev => ({
                        ...prev,
                        network: e.target.value as 'mainnet' | 'testnet' | undefined
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Networks</option>
                      <option value="testnet">Testnet</option>
                      <option value="mainnet">Mainnet</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setFilter({});
                      setSearchTerm('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  {transactions.length === 0 
                    ? "You haven't made any transactions yet." 
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          {getStatusIcon(tx.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">
                              {tx.type.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                {tx.network}
                              </span>
                            </div>
                          </div>
                          
                          {tx.type === TransactionType.STX_TRANSFER && (
                            <div className="text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="break-all sm:break-normal">
                                  {(tx as STXTransferTransaction).amount} STX to {abbreviateAddress((tx as STXTransferTransaction).recipientAddress)}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="break-all sm:break-normal">From: {abbreviateAddress(tx.senderAddress)}</div>
                            <div>{tx.timestamp.toLocaleString()}</div>
                            {tx.memo && <div className="break-words">Memo: {tx.memo}</div>}
                            {tx.errorMessage && (
                              <div className="text-red-600 break-words">Error: {tx.errorMessage}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {tx.txHash && (
                          <>
                            <button
                              onClick={() => copyToClipboard(tx.txHash!)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Copy transaction hash"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => openInExplorer(tx.txHash!, tx.network)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="View in explorer"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionHistory;