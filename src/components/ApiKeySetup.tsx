import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

interface ApiKeySetupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkApiKey = async () => {
    if (!apiKey.trim()) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        }
      });
      
      setIsValid(response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API key validation failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      setIsValid(false);
    } finally {
      setIsChecking(false);
    }
  };

  const saveApiKey = () => {
    if (isValid && apiKey.trim()) {
      // In a real app, you'd want to store this securely
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      window.location.reload(); // Reload to apply the new API key
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Setup OpenRouter AI</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">AI Features Available</p>
                <p>Get an API key from OpenRouter to enable intelligent conversation and better command understanding.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsValid(null);
              }}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isValid === true && (
              <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                API key is valid!
              </div>
            )}
            {isValid === false && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Invalid API key. Please check and try again.
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">How to get an API key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Visit <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">openrouter.ai <ExternalLink className="w-3 h-3" /></a></li>
              <li>Sign up for a free account</li>
              <li>Go to Keys section and create a new API key</li>
              <li>Copy and paste it here</li>
            </ol>
          </div>

          {/* Debug info in development */}
          {import.meta.env.DEV && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-yellow-800 mb-1">Debug Info:</p>
              <p className="text-yellow-700">
                Configured model: {import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'}
              </p>
              <p className="text-yellow-700">
                Check browser console for detailed logs
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={checkApiKey}
              disabled={!apiKey.trim() || isChecking}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isChecking ? 'Checking...' : 'Verify'}
            </button>
            <button
              onClick={saveApiKey}
              disabled={!isValid}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApiKeySetup;