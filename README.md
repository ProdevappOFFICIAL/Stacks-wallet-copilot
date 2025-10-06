# Stacks Chat Assistant

An AI-powered blockchain assistant for seamless Stacks (STX) transactions through a ChatGPT-like interface. Now powered by OpenRouter AI for intelligent conversation and automatic action detection.

## Features

- 🤖 **AI-Powered Chat**: Intelligent responses using OpenRouter AI with natural language understanding
- 🔗 **Wallet Integration**: Connect with Stacks wallets via @stacks/connect
- 💬 **Smart Chat Interface**: AI automatically detects and executes blockchain operations
- 📚 **Chat History**: Persistent chat sessions stored in localStorage
- 🆕 **Multiple Chats**: Create and manage multiple chat sessions
- 🔍 **Transaction Preview**: Review all transaction details before signing
- 📊 **Transaction History**: Complete transaction logging with status tracking
- ✨ **Smooth Animations**: Beautiful UI with Framer Motion
- 🛡️ **Type Safety**: Full TypeScript support
- 🎨 **Modern Design**: Tailwind CSS with gradient themes
- 🧠 **Context Awareness**: AI understands your wallet state, balance, and transaction history

## Supported Commands

- **Send STX**: "Send 0.01 STX to [address]"
- **Check Balance**: "What's my balance?"
- **Get Address**: "What's my address?"
- **Transaction History**: "Show my transaction history"
- **Help**: "Help" or "What can you do?"

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI**: OpenRouter API with Llama 3.2 (free tier)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Blockchain**: Stacks SDK (@stacks/connect, @stacks/transactions, @stacks/network)

## AI Integration

The assistant uses OpenRouter AI to provide intelligent responses and automatic action detection:

- **Smart Parsing**: Understands natural language requests for blockchain operations
- **Context Awareness**: Knows your current balance, address, and network
- **Fallback Support**: Works even without API key (limited functionality)
- **Cost Effective**: Uses free/low-cost models by default
- **Secure**: No sensitive data sent to AI - only transaction intents

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Stacks wallet (Hiro, Xverse, or Leather)
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

### Setup

1. **Clone and install dependencies**:

   ```bash
   git clone <your-repo-url>
   cd stacks-chat-assistant
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenRouter API key:

   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
   ```

   > **Note**: The default model `meta-llama/llama-3.2-3b-instruct:free` is cost-effective for basic operations. You can upgrade to more powerful models like `anthropic/claude-3.5-sonnet` for better performance.

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

5. **Connect your Stacks wallet** and start chatting with the AI!

## Usage

1. Click "Connect Wallet" to connect your Stacks wallet
2. Type natural language commands in the chat
3. Review transaction details in the preview modal
4. Confirm in your wallet to execute transactions

### Chat History

- **New Chat**: Click the "New Chat" button in the sidebar to start a fresh conversation
- **Switch Chats**: Click on any chat in the sidebar to switch between conversations
- **Delete Chats**: Hover over a chat and click the trash icon to delete it
- **Collapse Sidebar**: Use the arrow button to collapse/expand the chat history sidebar
- **Auto-Save**: All chats are automatically saved to your browser's localStorage

### Transaction History

- **View History**: Click the "History" button in the header or ask "Show my transaction history"
- **Filter Transactions**: Filter by status (pending, confirmed, failed, cancelled), type, or network
- **Search**: Search transactions by address, hash, or memo
- **Transaction Details**: View complete transaction information including timestamps and fees
- **Status Tracking**: Real-time status updates from pending to confirmed/failed
- **Explorer Links**: Direct links to view transactions on Stacks Explorer
- **Copy Functions**: Easy copying of transaction hashes and addresses
- **Statistics**: Overview of total transactions, confirmed count, and STX amounts

## AI-Powered Natural Language Commands

The AI assistant understands natural language and can handle various ways of expressing the same request:

### Transfer STX
```
Send 0.01 STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
Transfer 5 STX to my friend's address ST...
I want to send some STX to ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
Can you help me transfer 0.5 STX?
```

### Check Balance
```
What's my balance?
How much STX do I have?
Check my wallet balance
Show me my current balance
```

### Get Address
```
What's my address?
Show me my wallet address
What's my STX address?
I need my address
```

### Transaction History
```
Show my transaction history
What are my recent transactions?
I want to see my past transactions
Transaction history please
```

### General Help
```
Help
What can you do?
How do I use this?
What commands do you support?
```

The AI will understand context and provide helpful responses even for unclear requests!

## Network Configuration

The app uses a centralized network configuration system. To switch between testnet and mainnet:

1. Open `src/utils/network.ts`
2. Change `CURRENT_NETWORK` from `'testnet'` to `'mainnet'` (or vice versa)
3. Restart your development server

```typescript
// In src/utils/network.ts
export const NETWORK_CONFIG = {
  CURRENT_NETWORK: "mainnet" as "testnet" | "mainnet", // Change this line
  // ... rest of config
};
```

**Important**: Make sure your wallet is connected to the same network as your app configuration to avoid transaction failures.

## Security

- No private keys are stored or handled by the application
- All transactions require wallet confirmation
- Transaction details are previewed before execution
- Uses official Stacks SDK methods only

## Build

```bash
npm run build
```

## License

MIT
