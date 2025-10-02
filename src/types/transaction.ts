// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Transaction type enum
export enum TransactionType {
  STX_TRANSFER = 'stx_transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_DEPLOY = 'contract_deploy'
}

// Base transaction interface
export interface Transaction {
  id: string;
  txHash?: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  network: 'mainnet' | 'testnet';
  senderAddress: string;
  fee?: number;
  memo?: string;
  errorMessage?: string;
}

// STX Transfer transaction
export interface STXTransferTransaction extends Transaction {
  type: TransactionType.STX_TRANSFER;
  recipientAddress: string;
  amount: number; // in STX
}

// Contract call transaction
export interface ContractCallTransaction extends Transaction {
  type: TransactionType.CONTRACT_CALL;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs?: unknown[];
}

// Contract deploy transaction
export interface ContractDeployTransaction extends Transaction {
  type: TransactionType.CONTRACT_DEPLOY;
  contractName: string;
  contractSource: string;
}

// Union type for all transaction types
export type AnyTransaction = STXTransferTransaction | ContractCallTransaction | ContractDeployTransaction;

// Transaction history interface
export interface TransactionHistory {
  transactions: AnyTransaction[];
  lastUpdated: Date;
}

// Transaction filter options
export interface TransactionFilter {
  status?: TransactionStatus[];
  type?: TransactionType[];
  network?: 'mainnet' | 'testnet';
  dateFrom?: Date;
  dateTo?: Date;
}