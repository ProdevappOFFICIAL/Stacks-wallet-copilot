// Simple test to verify action extraction works correctly

// Mock the AIService class with just the extractActionFromText method
class TestAIService {
  extractActionFromText(userMessage, context) {
    const lowerInput = userMessage.toLowerCase();

    if (lowerInput.includes("balance")) {
      return { type: "balance" };
    }

    if (lowerInput.includes("address")) {
      return { type: "address" };
    }

    if (lowerInput.includes("help")) {
      return { type: "help" };
    }

    if (lowerInput.includes("history") || lowerInput.includes("transactions")) {
      return { type: "history" };
    }

    // Handle complete STX transfers (amount + valid STX address)
    const completeTransferMatch = userMessage.match(
      /send\s+([\d.]+)\s*(?:stx|STX)?\s+to\s+(ST[a-zA-Z0-9]{39}|SP[a-zA-Z0-9]{39})/i
    );
    if (completeTransferMatch) {
      const amount = parseFloat(completeTransferMatch[1]);
      const recipient = completeTransferMatch[2];

      return {
        type: "transfer",
        params: {
          amount,
          recipient,
          memo: "Sent via Stacks Chat Assistant",
        },
      };
    }

    // Handle partial transfer commands (amount but no valid address)
    const partialTransferMatch = userMessage.match(
      /send\s+([\d.]+)\s*(?:stx|STX)?\s+to\s+([a-zA-Z]+)/i
    );
    if (partialTransferMatch) {
      // This indicates user wants to send but provided a name instead of address
      // Let the AI handle asking for the actual STX address
      return undefined;
    }

    // Check if we have complete transfer info from context + current message
    if (context?.pendingTransfer) {
      const messageAmountMatch = userMessage.match(
        /(?:^|[^A-Z0-9])([\d.]+)\s*(?:stx|STX)?(?:[^A-Z0-9]|$)/i
      );
      const messageAddressMatch = userMessage.match(/(ST|SP)[a-zA-Z0-9]{39}/);

      const finalAmount =
        context.pendingTransfer.amount ||
        (messageAmountMatch ? parseFloat(messageAmountMatch[1]) : undefined);
      const finalRecipient =
        context.pendingTransfer.recipient ||
        (messageAddressMatch ? messageAddressMatch[0] : undefined);

      if (finalAmount && finalRecipient) {
        return {
          type: "transfer",
          params: {
            amount: finalAmount,
            recipient: finalRecipient,
            memo: "Sent via Stacks Chat Assistant",
          },
        };
      }
    }

    return undefined;
  }
}

// Test cases
const aiService = new TestAIService();

console.log("Testing action extraction...\n");

// Test 1: Complete transfer with valid STX address
const test1 = aiService.extractActionFromText("send 30 stx to ST1WNVWY7WCJESTHM050RAMRRE44KJTKZKJCSRFCQ");
console.log("Test 1 - Complete transfer:", test1);

// Test 2: Partial transfer with person's name (should return undefined to let AI handle)
const test2 = aiService.extractActionFromText("send 30 stx to my friend");
console.log("Test 2 - Partial transfer with name:", test2);

// Test 3: Balance check
const test3 = aiService.extractActionFromText("what's my balance");
console.log("Test 3 - Balance check:", test3);

// Test 4: Transfer with context (user provides address after being asked)
const context = {
  pendingTransfer: { amount: 30 },
  lastAction: "asked_for_address"
};
const test4 = aiService.extractActionFromText("ST1WNVWY7WCJESTHM050RAMRRE44KJTKZKJCSRFCQ", context);
console.log("Test 4 - Transfer with context:", test4);

console.log("\nAll tests completed!");