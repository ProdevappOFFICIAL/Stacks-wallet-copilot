interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ConversationContext {
  pendingTransfer?: {
    amount?: number;
    recipient?: string;
    recipientName?: string;
  };
  lastAction?: string;
}

interface AIResponse {
  message: string;
  action?: {
    type: "transfer" | "balance" | "address" | "help" | "history";
    params?: {
      amount?: number;
      recipient?: string;
      memo?: string;
    };
  };
  context?: ConversationContext;
}

class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 5;
  private readonly failureResetTime = 300000; // 5 minutes

  constructor() {
    // Check both environment variables and localStorage for API key
    this.apiKey =
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      localStorage.getItem("openrouter_api_key") ||
      "";
    this.model =
      import.meta.env.VITE_OPENROUTER_MODEL ||
      "alibaba/tongyi-deepresearch-30b-a3b:free";

    if (!this.apiKey) {
      console.warn(
        "OpenRouter API key not found. AI features will be limited."
      );
    }
  }

  private getSystemPrompt(
    userAddress?: string,
    balance?: number,
    network?: string
  ): string {
    return `You are a helpful Stacks blockchain assistant that can understand context and guide users through transactions.

CONTEXT:
- User address: ${userAddress || "not connected"}
- Balance: ${balance !== undefined ? `${balance.toFixed(6)} STX` : "unknown"}
- Network: ${network || "unknown"}

CAPABILITIES:
- Send STX transfers (ask for recipient address and amount if missing)
- Check balances and addresses
- Show transaction history
- Guide users through multi-step processes

CONVERSATION STYLE:
- Be conversational and helpful
- Remember context from previous messages
- Ask follow-up questions when information is missing
- Guide users step-by-step for complex operations
- Use emojis sparingly but appropriately

TRANSACTION HANDLING:
- For transfers, you need: recipient address and amount
- If user mentions sending to a person's name, ask for their STX address
- Always confirm transaction details before execution
- Validate STX addresses (they start with ST for testnet, SP for mainnet)
- NEVER simulate or fake transaction results
- NEVER generate fake transaction IDs
- Only guide users to provide the required information

IMPORTANT: You are a conversational interface only. You do NOT execute transactions yourself. The system will handle the actual blockchain operations when the user provides complete information.

Be brief but thorough. Help users complete their blockchain tasks efficiently.`;
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: OpenRouterMessage[] = [],
    userAddress?: string,
    balance?: number,
    network?: string
  ): Promise<AIResponse> {
    // Analyze conversation context
    const context = this.analyzeConversationContext(
      conversationHistory,
      userMessage
    );

    // Handle simple cases immediately without AI
    const quickResponse = this.getQuickResponse(userMessage);
    if (quickResponse) {
      console.log("Using quick local response for:", userMessage);
      return quickResponse;
    }

    if (!this.apiKey) {
      console.log("No API key found, using fallback response");
      return this.getFallbackResponse(userMessage, context);
    }

    console.log("Generating AI response for:", userMessage);
    console.log("Using model:", this.model);

    // Check circuit breaker
    const now = Date.now();
    if (
      this.failureCount >= this.maxFailures &&
      now - this.lastFailureTime < this.failureResetTime
    ) {
      console.log("Circuit breaker active, using fallback response");
      return this.getFallbackResponse(userMessage, context);
    }

    // Reset failure count if enough time has passed
    if (now - this.lastFailureTime >= this.failureResetTime) {
      this.failureCount = 0;
    }

    try {
      const result = await this.generateResponseInternal(
        userMessage,
        conversationHistory,
        userAddress,
        balance,
        network,
        context
      );
      // Reset failure count on success
      this.failureCount = 0;
      return result;
    } catch (error) {
      console.error("AI generation failed:", error);
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Only fallback after multiple failures
      if (this.failureCount >= this.maxFailures) {
        console.log("Too many failures, using fallback response");
        return this.getFallbackResponse(userMessage, context);
      }

      // For single failures, throw to let the UI handle it
      throw error;
    }
  }

  private async generateResponseInternal(
    userMessage: string,
    conversationHistory: OpenRouterMessage[] = [],
    userAddress?: string,
    balance?: number,
    network?: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    // Try available models in order
    const modelsToTry = [
      this.model, // Try the selected model first
      ...this.getAvailableModels().filter((m) => m !== this.model), // Then try others
    ];

    for (const modelToTry of modelsToTry) {
      try {
        console.log(`Trying model: ${modelToTry}`);

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: this.getSystemPrompt(userAddress, balance, network),
          },
          ...conversationHistory.slice(-6), // Keep last 6 messages for context
          {
            role: "user",
            content: userMessage,
          },
        ];

        const requestBody = {
          model: modelToTry,
          messages,
          temperature: 0.3,
          max_tokens: 150,
          top_p: 0.9,
        };

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`Request timeout for model ${modelToTry}`);
          controller.abort();
        }, 30000); // 30 second timeout

        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Stacks Chat Assistant",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`Model ${modelToTry} response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Model ${modelToTry} failed:`,
            response.status,
            errorText
          );

          // If it's a 404 (model not found), try the next model
          if (response.status === 404) {
            continue;
          }

          throw new Error(
            `OpenRouter API error: ${response.status} - ${errorText}`
          );
        }

        console.log("Parsing JSON response...");
        let data: OpenRouterResponse;
        try {
          data = await response.json();
          console.log("JSON parsed successfully");
        } catch (jsonError) {
          console.error("JSON parsing failed:", jsonError);
          continue; // Try next model
        }

        console.log(`Model ${modelToTry} response data:`, data);

        // Check if the response has the expected structure
        if (!data || typeof data !== "object") {
          console.error("Invalid response - not an object:", data);
          continue; // Try next model
        }

        if (
          !data.choices ||
          !Array.isArray(data.choices) ||
          data.choices.length === 0
        ) {
          console.error("Invalid response structure - no choices array:", data);
          continue; // Try next model
        }

        const choice = data.choices[0];
        if (!choice || typeof choice !== "object" || !choice.message) {
          console.error("Invalid choice structure:", choice);
          continue; // Try next model
        }

        const aiMessage = choice.message.content;

        if (!aiMessage || typeof aiMessage !== "string") {
          console.error("No message content in response, choice:", choice);
          continue; // Try next model
        }

        console.log("AI response:", aiMessage);

        // Success! Update the model for future requests
        if (modelToTry !== this.model) {
          console.log(`Switching to working model: ${modelToTry}`);
          this.model = modelToTry;
        }

        // Always treat as plain text and extract actions separately
        const result = {
          message: aiMessage,
          action: this.extractActionFromText(userMessage, context),
          context: context,
        };
        console.log("Returning AI result:", result);
        return result;
      } catch (error) {
        console.error(`Error with model ${modelToTry}:`, error);

        if (error instanceof Error && error.name === "AbortError") {
          console.error("Request timed out for model:", modelToTry);
          // Continue to next model instead of returning immediately
          continue;
        }

        // Continue to next model
        continue;
      }
    }

    // If all models failed, throw error instead of fallback
    console.error("All AI models failed");
    throw new Error("All AI models failed to respond");
  }

  private analyzeConversationContext(
    conversationHistory: OpenRouterMessage[],
    currentMessage: string
  ): ConversationContext {
    const context: ConversationContext = {};

    // Look at recent conversation for pending transfer info
    const recentMessages = conversationHistory.slice(-4); // Last 4 messages

    for (const msg of recentMessages) {
      if (msg.role === "assistant") {
        // Check if assistant asked for amount
        if (
          msg.content.includes("How much STX") ||
          msg.content.includes("amount")
        ) {
          context.lastAction = "asked_for_amount";
        }
        // Check if assistant asked for address
        if (
          msg.content.includes("STX address") ||
          msg.content.includes("recipient")
        ) {
          context.lastAction = "asked_for_address";
        }
        // Check if assistant mentioned a person's name
        const nameMatch = msg.content.match(/send.*to\s+([a-zA-Z]+)/i);
        if (nameMatch) {
          context.pendingTransfer = context.pendingTransfer || {};
          context.pendingTransfer.recipientName = nameMatch[1];
        }
      }
    }

    // Analyze current message for transfer components - but exclude numbers that are part of STX addresses
    const amountMatch = currentMessage.match(
      /(?:^|[^A-Z0-9])([\d.]+)\s*(?:stx|STX)?(?:[^A-Z0-9]|$)/i
    );
    const addressMatch = currentMessage.match(/(ST|SP)[a-zA-Z0-9]{39}/);

    if (amountMatch) {
      context.pendingTransfer = context.pendingTransfer || {};
      context.pendingTransfer.amount = parseFloat(amountMatch[1]);
    }

    if (addressMatch) {
      context.pendingTransfer = context.pendingTransfer || {};
      context.pendingTransfer.recipient = addressMatch[0];
    }

    return context;
  }

  private getQuickResponse(
    userMessage: string
    //context?: ConversationContext
  ): AIResponse | null {
    const lowerInput = userMessage.toLowerCase().trim();

    // Handle simple greetings immediately
    if (
      lowerInput === "hi" ||
      lowerInput === "hello" ||
      lowerInput === "hey" ||
      lowerInput === "hi!" ||
      lowerInput === "hello!"
    ) {
      return {
        message:
          "Hi there! I'm your Stacks blockchain assistant. I can help you:\n\n• Send STX to addresses\n• Check your balance\n• View your wallet address\n• Show transaction history\n\nWhat would you like to do?",
      };
    }

    // Handle other simple cases
    if (
      lowerInput === "help" ||
      lowerInput === "help me" ||
      lowerInput === "what can you do"
    ) {
      return {
        message:
          'I can help you with Stacks blockchain operations:\n\n• **Send STX**: "Send 0.01 STX to [address]"\n• **Check Balance**: "What\'s my balance?"\n• **View Address**: "What\'s my address?"\n• **Transaction History**: "Show my transactions"\n\nJust tell me what you\'d like to do in plain English!',
        action: { type: "help" },
      };
    }

    return null;
  }

  private getFallbackResponse(
    userMessage: string,
    context?: ConversationContext
  ): AIResponse {
    const lowerInput = userMessage.toLowerCase();

    // Handle contextual responses first
    if (context?.pendingTransfer) {
      // Check if we have both amount and recipient from context + current message
      const currentAmount = context.pendingTransfer.amount;
      const currentRecipient = context.pendingTransfer.recipient;

      // Parse current message for missing pieces - but exclude numbers that are part of STX addresses
      const messageAmountMatch = userMessage.match(
        /(?:^|[^A-Z0-9])([\d.]+)\s*(?:stx|STX)?(?:[^A-Z0-9]|$)/i
      );
      const messageAddressMatch = userMessage.match(/(ST|SP)[a-zA-Z0-9]{39}/);

      const finalAmount =
        currentAmount ||
        (messageAmountMatch ? parseFloat(messageAmountMatch[1]) : undefined);
      const finalRecipient =
        currentRecipient ||
        (messageAddressMatch ? messageAddressMatch[0] : undefined);

      // If we have both pieces, create the transfer
      if (finalAmount && finalRecipient) {
        return {
          message: `Perfect! I'll help you send ${finalAmount} STX to ${finalRecipient}. Let me prepare the transaction for your review.`,
          action: {
            type: "transfer",
            params: {
              amount: finalAmount,
              recipient: finalRecipient,
              memo: "Sent via Stacks Chat Assistant",
            },
          },
          context: {
            pendingTransfer: {
              amount: finalAmount,
              recipient: finalRecipient,
            },
          },
        };
      }

      // If we just got an amount and were waiting for it
      if (
        messageAmountMatch &&
        !currentAmount &&
        context.lastAction === "asked_for_amount"
      ) {
        const amount = parseFloat(messageAmountMatch[1]);
        return {
          message: `Got it! ${amount} STX ✅\n\nNow I need the recipient's STX address. ${
            context.pendingTransfer.recipientName
              ? `What's ${context.pendingTransfer.recipientName}'s STX address?`
              : "What's the recipient's STX address?"
          }`,
          context: {
            pendingTransfer: {
              ...context.pendingTransfer,
              amount,
            },
            lastAction: "asked_for_address",
          },
        };
      }

      // If we just got an address and were waiting for it
      if (
        messageAddressMatch &&
        !currentRecipient &&
        context.lastAction === "asked_for_address"
      ) {
        const recipient = messageAddressMatch[0];
        return {
          message: `Great! I have the address: ${recipient} ✅\n\n${
            currentAmount
              ? `I'll send ${currentAmount} STX to this address.`
              : "How much STX do you want to send?"
          }`,
          context: {
            pendingTransfer: {
              ...context.pendingTransfer,
              recipient,
            },
            lastAction: currentAmount ? "ready_to_send" : "asked_for_amount",
          },
        };
      }
    }

    // Handle balance check
    if (
      lowerInput.includes("balance") ||
      lowerInput.includes("check balance")
    ) {
      return {
        message: "Let me check your current STX balance.",
        action: { type: "balance" },
      };
    }

    // Handle address requests
    if (lowerInput.includes("address") || lowerInput.includes("my address")) {
      return {
        message: "Here's your Stacks wallet address:",
        action: { type: "address" },
      };
    }

    // Handle help requests
    if (lowerInput.includes("help") || lowerInput.includes("what can you do")) {
      return {
        message: "I can help you with Stacks blockchain operations!",
        action: { type: "help" },
      };
    }

    // Handle transaction history
    if (lowerInput.includes("history") || lowerInput.includes("transactions")) {
      return {
        message: "Let me show you your transaction history.",
        action: { type: "history" },
      };
    }

    // Handle questions about sending (why can't I send, etc.)
    if (
      (lowerInput.includes("why") ||
        lowerInput.includes("how") ||
        lowerInput.includes("cant") ||
        lowerInput.includes("can't")) &&
      lowerInput.includes("send")
    ) {
      return {
        message:
          "I can help you troubleshoot sending issues! Common reasons you might not be able to send STX:\n\n• **Insufficient Balance**: Make sure you have enough STX plus fees (~0.0001 STX)\n• **Invalid Address**: STX addresses start with 'ST' (testnet) or 'SP' (mainnet)\n• **Network Mismatch**: Ensure your wallet and the app are on the same network\n• **Wallet Connection**: Try reconnecting your wallet\n\nWhat specific issue are you experiencing?",
      };
    }

    // Handle contextual sending (mentions sending money/STX but incomplete info)
    // But first check if this is a question about sending rather than an actual send request
    const isQuestion =
      lowerInput.includes("why") ||
      lowerInput.includes("how") ||
      lowerInput.includes("can i") ||
      lowerInput.includes("cant") ||
      lowerInput.includes("can't") ||
      lowerInput.includes("?");

    if (
      !isQuestion &&
      lowerInput.includes("send") &&
      (lowerInput.includes("money") ||
        lowerInput.includes("stx") ||
        lowerInput.includes("to"))
    ) {
      // Check if we have amount and/or recipient - but exclude numbers that are part of STX addresses
      const amountMatch = userMessage.match(
        /(?:^|[^A-Z0-9])([\d.]+)\s*(?:stx|STX)?(?:[^A-Z0-9]|$)/i
      );
      const addressMatch = userMessage.match(/to\s+([a-zA-Z0-9]{34,})/i);
      const nameMatch = userMessage.match(/to\s+([a-zA-Z]+)/i);

      if (amountMatch && addressMatch) {
        // Has both amount and address
        const amount = parseFloat(amountMatch[1]);
        const recipient = addressMatch[1];

        return {
          message: `I'll help you send ${amount} STX to ${recipient}. Let me prepare the transaction for your review.`,
          action: {
            type: "transfer",
            params: {
              amount,
              recipient,
              memo: "Sent via Stacks Chat Assistant",
            },
          },
        };
      } else if (amountMatch && nameMatch) {
        // Has amount and person's name
        const amount = parseFloat(amountMatch[1]);
        const name = nameMatch[1];

        return {
          message: `I can help you send ${amount} STX to ${name}! 💰\n\nI'll need ${name}'s STX address to complete the transfer. STX addresses start with "ST" (testnet) or "SP" (mainnet).\n\nCan you provide ${name}'s STX address?`,
        };
      } else if (nameMatch && !amountMatch) {
        // Has person's name but no amount
        const name = nameMatch[1];

        return {
          message: `I can help you send STX to ${name}! 💰\n\nI need two things:\n1. How much STX do you want to send?\n2. ${name}'s STX address (starts with "ST" or "SP")\n\nCan you provide both details?`,
        };
      } else if (amountMatch && !addressMatch && !nameMatch) {
        // Has amount but no recipient
        const amount = parseFloat(amountMatch[1]);

        return {
          message: `I can help you send ${amount} STX! 💰\n\nI just need the recipient's STX address. STX addresses start with "ST" (testnet) or "SP" (mainnet).\n\nWhat's the recipient's address?`,
        };
      } else {
        // General send request without specifics
        return {
          message: `I can help you send STX! 💰\n\nI need two things:\n1. How much STX do you want to send?\n2. The recipient's STX address (starts with "ST" or "SP")\n\nExample: "Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"`,
        };
      }
    }

    // Handle when user provides just an STX address (might be responding to previous question)
    const standaloneAddressMatch = userMessage.match(
      /^(ST[a-zA-Z0-9]{39}|SP[a-zA-Z0-9]{39})$/
    );
    if (standaloneAddressMatch) {
      return {
        message: `Got the address: ${standaloneAddressMatch[1]} ✅\n\nNow I need to know how much STX you want to send to this address.\n\nExample: "Send 0.01 STX" or just "0.01"`,
      };
    }

    // Handle when user provides just an amount (might be responding to previous question)
    const standaloneAmountMatch = userMessage.match(
      /^([\d.]+)\s*(?:stx|STX)?$/i
    );
    if (standaloneAmountMatch) {
      const amount = parseFloat(standaloneAmountMatch[1]);
      return {
        message: `Got the amount: ${amount} STX ✅\n\nNow I need the recipient's STX address. STX addresses start with "ST" (testnet) or "SP" (mainnet).\n\nWhat's the recipient's address?`,
      };
    }

    // Handle confusion or "I don't understand" type messages
    if (
      lowerInput.includes("don't understand") ||
      lowerInput.includes("confused") ||
      lowerInput.includes("help me")
    ) {
      return {
        message: `No problem! I'm here to help. 😊\n\nTo send STX, I need:\n1. **Amount**: How much STX to send (e.g., "0.01")\n2. **Recipient**: Their STX address (starts with "ST" or "SP")\n\nYou can say something like:\n"Send 0.01 STX to ST1ABC..."\n\nOr I can guide you step by step. What would you like to do?`,
      };
    }

    // Default response
    return {
      message:
        'I can help you with Stacks blockchain operations! Try:\n\n• **Send STX**: "Send 0.01 STX to [address]"\n• **Check Balance**: "What\'s my balance?"\n• **Get Address**: "What\'s my address?"\n• **Transaction History**: "Show my transactions"\n• **Help**: "What can you do?"\n\nJust talk to me naturally - I understand conversational requests! 😊',
    };
  }

  private extractActionFromText(
    userMessage: string,
    context?: ConversationContext
  ): AIResponse["action"] {
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

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
    console.log("Model changed to:", model);
  }

  getAvailableModels(): string[] {
    return [
      "alibaba/tongyi-deepresearch-30b-a3b:free",
      "meituan/longcat-flash-chat:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "anthropic/claude-3.5-sonnet",
    ];
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: "No API key provided" };
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getAvailableFreeModels(): Promise<string[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for free models
        return data.data
          .filter(
            (model: { pricing?: { prompt: string }; id: string }) =>
              model.pricing?.prompt === "0" || model.id.includes(":free")
          )
          .map((model: { id: string }) => model.id)
          .slice(0, 10); // Limit to first 10
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    }

    return [];
  }
}

export const aiService = new AIService();
export type { AIResponse, ConversationContext };
