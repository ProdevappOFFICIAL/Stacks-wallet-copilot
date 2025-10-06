import React, { useState } from 'react';
import { aiService } from '../services/aiService';

const AIDebugInfo: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testAI = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      const response = await aiService.generateResponse(
        "Hello, can you help me?",
        [],
        "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        1.5,
        "testnet"
      );
      
      setTestResult(`Success! AI responded: "${response.message}"`);
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">AI Debug Info</h3>
      <div className="space-y-2">
        <div>
          <strong>Has API Key:</strong> {aiService.hasApiKey() ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Model:</strong> {aiService.getModel()}
        </div>
        <div>
          <strong>API Key (first 10 chars):</strong> {
            aiService.hasApiKey() 
              ? localStorage.getItem('openrouter_api_key')?.substring(0, 10) + '...' || 'From env'
              : 'None'
          }
        </div>
        <button
          onClick={testAI}
          disabled={isLoading || !aiService.hasApiKey()}
          className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test AI'}
        </button>
        {testResult && (
          <div className="mt-2 p-2 bg-white rounded border">
            <strong>Test Result:</strong> {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDebugInfo;