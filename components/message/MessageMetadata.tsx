
import React from 'react';
import { ChatModel, ModelInfo } from '../../types';
import { BrainCircuit, Zap } from 'lucide-react';

const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode; position?: 'top' | 'bottom', align?: 'left' | 'right', wrap?: boolean }> = ({ content, children, position = 'top', align = 'left', wrap = true }) => {
    const positionClass = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
    const alignClass = align === 'right' ? 'right-0' : 'left-0';
    const wrapClass = wrap ? 'max-w-xs' : 'whitespace-nowrap';
    return (
        <div className="relative group flex items-center">
            {children}
            <div className={`absolute ${positionClass} ${alignClass} ${wrapClass} bg-gray-900 dark:bg-black text-white text-xs rounded-md py-1.5 px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg`}>
                {content}
            </div>
        </div>
    );
};

const models: ModelInfo[] = [
    { id: 'gemini-2.5-flash', name: 'Kalina 2.5 Flash', description: 'Optimized for speed and efficiency.' },
    { id: 'gemini-2.5-pro', name: 'Kalina 2.5 Pro', description: 'Advanced capabilities for complex tasks.' },
];

const ModelInfoDisplay: React.FC<{ modelId: ChatModel }> = ({ modelId }) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const isPro = model.id === 'gemini-2.5-pro';
    const Icon = isPro ? BrainCircuit : Zap;
    const displayName = model.name.replace('Kalina ', '');

    return (
        <Tooltip content={
            <div className="text-left">
                <p className="font-bold">{model.name}</p>
                <p>{model.description}</p>
            </div>
        } position="bottom" align="left" wrap={false}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium cursor-help">
                <Icon className={`h-3.5 w-3.5 ${isPro ? 'text-purple-500' : 'text-yellow-500'}`} />
                <span>{displayName}</span>
            </div>
        </Tooltip>
    );
};

interface MessageMetadataProps {
    modelUsed?: ChatModel;
    inputTokens?: number;
    outputTokens?: number;
    generationTime?: number;
}

const MessageMetadata: React.FC<MessageMetadataProps> = ({ modelUsed, inputTokens, outputTokens, generationTime }) => {
    if (!modelUsed && typeof inputTokens !== 'number' && typeof outputTokens !== 'number' && (!generationTime || generationTime <= 0)) {
        return null;
    }
    
    return (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-mono flex flex-col items-start gap-y-1">
            {/* Tokens part */}
            {(() => {
                const tokenParts = [];
                if (typeof inputTokens === 'number') tokenParts.push(`${inputTokens} in`);
                if (typeof outputTokens === 'number') tokenParts.push(`${outputTokens} out`);
                if (tokenParts.length > 0) {
                    return (
                      <Tooltip 
                        content={
                            <div>
                                Input tokens (your prompt) / Output tokens
                                <br />
                                (AI's response).
                            </div>
                        } 
                        position="bottom"
                        wrap={false}
                      >
                          <span className="cursor-help">Tokens: {tokenParts.join(' / ')}</span>
                      </Tooltip>
                    );
                }
                return null;
            })()}

            {/* Time and Model part */}
            <div className="flex items-center gap-x-4 flex-wrap">
                {modelUsed && <ModelInfoDisplay modelId={modelUsed} />}
                {generationTime && generationTime > 0 && (
                  <Tooltip content="Total time from request to full response." position="bottom" wrap={false}>
                      <span className="cursor-help">{`${(generationTime / 1000).toFixed(1)}s`}</span>
                  </Tooltip>
                )}
            </div>
      </div>
    );
};

export default MessageMetadata;
