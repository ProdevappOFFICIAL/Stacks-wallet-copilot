// Simple test utility to verify transaction history functionality
import {
  addTransaction,
  loadTransactionHistory,
  createSTXTransferTransaction,
  updateTransactionStatus,
} from "./transactionStorage";
import { TransactionStatus } from "../types/transaction";

export const testTransactionHistory = () => {
  console.log("Testing transaction history functionality...");

  // Create a test transaction
  const testTx = createSTXTransferTransaction(
    "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    0.01,
    "testnet",
    "Test transaction",
    0.0001
  );

  console.log("Created test transaction:", testTx);

  // Add to history
  addTransaction(testTx);
  console.log("Added transaction to history");

  // Load history
  const history = loadTransactionHistory();
  console.log("Loaded history:", history);

  // Update status
  updateTransactionStatus(
    testTx.id,
    TransactionStatus.CONFIRMED,
    "0x123456789abcdef"
  );
  console.log("Updated transaction status");

  // Load updated history
  const updatedHistory = loadTransactionHistory();
  console.log("Updated history:", updatedHistory);

  return updatedHistory;
};
