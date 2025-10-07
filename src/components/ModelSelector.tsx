import React, { useState } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { aiService } from '../services/aiService';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onModelChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableModels = aiService.getAvailableModels();

  const getModelDisplayName = (model: string) => {
    const modelNames: Record<string, string> = {
      'alibaba/tongyi-deepresearch-30b-a3b:free': 'Tongyi DeepResearch 30B',
      'meituan/longcat-flash-chat:free': 'LongCat Flash Chat',
      'nvidia/nemotron-nano-9b-v2:free': 'Nemotron Nano 9B',
      'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    };
    
    return modelNames[model] || model.split('/').pop()?.replace(':free', '').replace('-', ' ') || model;
  };

  const isModelFree = (model: string) => {
    return model.includes(':free');
  };

  const handleModelSelect = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Bot size={16} />
          <span className="text-sm">
            {getModelDisplayName(currentModel)}
          </span>
          {isModelFree(currentModel) && (
            <span className="text-xs text-green-600 font-medium">FREE</span>
          )}
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => handleModelSelect(model)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                model === currentModel ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot size={14} />
                <span>{getModelDisplayName(model)}</span>
              </div>
              <div className="flex items-center gap-1">
                {isModelFree(model) && (
                  <span className="text-xs text-green-600 font-medium">FREE</span>
                )}
                {!isModelFree(model) && (
                  <span className="text-xs text-orange-600 font-medium">PAID</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};