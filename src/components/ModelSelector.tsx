import React from 'react';
import { Bot } from 'lucide-react';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,

}) => {
  const getModelDisplayName = (model: string) => {
    if (model === 'alibaba/tongyi-deepresearch-30b-a3b:free') {
      return 'Tongyi DeepResearch 30B';
    }
    
    // Fallback for any other models
    const parts = model.split('/');
    const name = parts[parts.length - 1];
    return name.replace(':free', '').replace('-', ' ');
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300">
      <Bot size={16} />
      <span className="text-sm">
        {getModelDisplayName(currentModel)}
      </span>
      <span className="text-xs text-green-600 font-medium">FREE</span>
    </div>
  );
};