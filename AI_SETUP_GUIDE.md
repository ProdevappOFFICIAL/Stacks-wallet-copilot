# AI Setup Guide

## Quick Start

1. **Get an OpenRouter API Key**
   - Visit [openrouter.ai](https://openrouter.ai)
   - Sign up for a free account
   - Go to the "Keys" section
   - Create a new API key

2. **Add API Key to Your App**
   - Option 1: Click the "Setup AI" button in the app header
   - Option 2: Add to `.env` file: `VITE_OPENROUTER_API_KEY=your_key_here`

3. **Start Chatting!**
   - The AI will understand natural language
   - No need for exact command syntax
   - Context-aware responses based on your wallet state

## AI Features

### Natural Language Understanding
Instead of exact commands, you can say:
- "Send some STX to my friend" → AI will ask for amount and address
- "How much money do I have?" → Checks your balance
- "What transactions have I made?" → Shows transaction history
- "I need help" → Provides guidance

### Context Awareness
The AI knows:
- Your current wallet address
- Your STX balance
- Which network you're on (testnet/mainnet)
- Your recent conversation history

### Fallback Support
- Works without API key (limited functionality)
- Falls back to pattern matching if AI fails
- Always maintains core blockchain functionality

## Cost-Effective Models

### Free Tier (Recommended for Testing)
- `meta-llama/llama-3.2-3b-instruct:free`
- Good for basic operations
- No cost

### Paid Tiers (Better Performance)
- `anthropic/claude-3.5-sonnet` - Best understanding
- `openai/gpt-4o-mini` - Good balance of cost/performance
- `meta-llama/llama-3.1-8b-instruct` - Good and affordable

## Security Notes

- API keys are stored locally in your browser
- No private keys or sensitive wallet data sent to AI
- Only transaction intents and public information shared
- All transactions still require wallet confirmation

## Troubleshooting

### AI Not Working
1. Check if API key is set correctly
2. Verify API key is valid at openrouter.ai
3. Check browser console for errors
4. Try refreshing the page

### Unexpected Responses
1. Be more specific in your requests
2. Include amounts and addresses when sending STX
3. The AI learns from context - clear conversation helps

### Fallback Mode
If AI fails, the app automatically falls back to:
- Pattern matching for common commands
- Manual command parsing
- All core functionality remains available

## Example Conversations

### Sending STX
**User**: "I want to send 0.5 STX to my friend"
**AI**: "I'll help you send 0.5 STX. What's your friend's Stacks address?"
**User**: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
**AI**: "Perfect! Let me prepare the transaction for your review."

### Checking Balance
**User**: "How much STX do I have?"
**AI**: "Let me check your current balance..."
*Shows balance with network and address info*

### Getting Help
**User**: "What can you do?"
**AI**: "I can help you with Stacks blockchain operations! Here's what I can do..."
*Provides comprehensive help*