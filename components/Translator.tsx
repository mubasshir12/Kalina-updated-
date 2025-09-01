
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRightLeft, Copy, Check, X, Volume2, ClipboardPaste, Languages } from 'lucide-react';
import { translateText } from '../services/translationService';

interface TranslatorViewProps {
    onBack: () => void;
    onTranslationComplete: (tokens: { input: number, output: number }) => void;
}

const sourceLanguages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' }, { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
    { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' }, { code: 'ar', name: 'Arabic' },
];

const targetLanguages = sourceLanguages.filter(lang => lang.code !== 'auto');

// Simple token estimation: ~4 chars per token.
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const SkeletonLoader: React.FC = () => (
    <div className="w-full h-full p-2 space-y-3">
        <div className="h-4 rounded w-5/6 shimmer-bg"></div>
        <div className="h-4 rounded w-full shimmer-bg"></div>
        <div className="h-4 rounded w-4/6 shimmer-bg"></div>
        <style>{`.shimmer-bg { background-color: #e5e7eb; background-image: linear-gradient(110deg, #e5e7eb 8%, #f3f4f6 18%, #e5e7eb 33%); background-size: 200% 100%; animation: 1.5s shimmer linear infinite; } .dark .shimmer-bg { background-color: #374151; background-image: linear-gradient(110deg, #374151 8%, #4b5563 18%, #374151 33%); } @keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
);

const TranslatorView: React.FC<TranslatorViewProps> = ({ onBack, onTranslationComplete }) => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [tokenCount, setTokenCount] = useState({ input: 0, output: 0 });
    const debounceTimeout = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTranslate = useCallback(async (text: string, source: string, target: string) => {
        if (!text.trim()) {
            setOutputText('');
            setTokenCount({ input: 0, output: 0 });
            return;
        }
        setIsLoading(true);
        setOutputText('');
        
        const result = await translateText(
            text, 
            targetLanguages.find(l => l.code === target)?.name || 'English', 
            sourceLanguages.find(l => l.code === source)?.name || 'Auto Detect'
        );
        
        setOutputText(result.translatedText);
        setTokenCount({ input: result.inputTokens, output: result.outputTokens });
        if (result.inputTokens > 0 || result.outputTokens > 0) {
            onTranslationComplete({ input: result.inputTokens, output: result.outputTokens });
        }
        setIsLoading(false);
    }, [onTranslationComplete]);
    
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        if (inputText.trim()) {
            setIsLoading(true);
            setOutputText('');
            debounceTimeout.current = window.setTimeout(() => {
                handleTranslate(inputText, sourceLang, targetLang);
            }, 800);
        } else {
            setOutputText('');
            setIsLoading(false);
            setTokenCount({ input: 0, output: 0 });
        }

        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [inputText, sourceLang, targetLang, handleTranslate]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [inputText]);

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto' || isLoading) return;
        const currentInput = inputText;
        const currentOutput = outputText;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(currentOutput);
        setOutputText(currentInput);
    };
    
    const handleCopy = () => {
        if (outputText && !outputText.startsWith('Error:')) {
            navigator.clipboard.writeText(outputText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (error) {
            console.error('Failed to read clipboard contents: ', error);
        }
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-[#131314]">
            <div className="max-w-4xl mx-auto w-full flex flex-col">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-2 md:mr-4" aria-label="Back to chat">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Translator</h1>
                </div>

                <div className="bg-white dark:bg-[#1e1f22] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                    {/* Source Text Area */}
                    <div className="p-4 flex flex-col flex-1">
                        <div className="relative flex-1 flex flex-col">
                            <textarea
                                ref={textareaRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter text..."
                                className="w-full flex-1 p-2 bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200 text-lg leading-relaxed min-h-[150px] max-h-[40vh] scrollbar-hide"
                            />
                        </div>
                        <div className="pt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-mono">
                            <span>{inputText.length} chars / ~{estimateTokens(inputText)} tokens</span>
                            <div className="flex items-center gap-1">
                                <button onClick={handlePaste} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Paste text">
                                    <ClipboardPaste className="h-4 w-4" />
                                </button>
                                {inputText && (
                                    <button onClick={() => setInputText('')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Clear input text">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Language Controls */}
                    <div className="border-y border-gray-200 dark:border-gray-700 flex items-center justify-between p-2 sm:p-3 gap-2 flex-wrap">
                        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="flex-1 min-w-[120px] bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {sourceLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                        <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto' || isLoading} className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Swap languages">
                            <ArrowRightLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="flex-1 min-w-[120px] bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>

                    {/* Target Text Area */}
                    <div className="p-4 flex flex-col flex-1 bg-gray-50 dark:bg-gray-900/20">
                        <div className="relative flex-1 min-h-[150px] flex flex-col">
                            {isLoading ? (
                                <SkeletonLoader />
                            ) : outputText ? (
                                <p className="whitespace-pre-wrap p-2 text-gray-800 dark:text-gray-200 text-lg leading-relaxed overflow-y-auto max-h-[40vh] scrollbar-hide flex-1">
                                    {outputText}
                                </p>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <Languages className="h-8 w-8 mr-2" />
                                    <span>Translation will appear here</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-2 flex justify-between items-center">
                             <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                 {outputText.length} chars / ~{tokenCount.output > 0 ? tokenCount.output : estimateTokens(outputText)} tokens
                            </span>
                            {!isLoading && outputText && (
                               <button onClick={handleCopy} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Copy translation">
                                    {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default TranslatorView;
