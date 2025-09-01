import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRightLeft, Copy, Check, X } from 'lucide-react';
import { translateText } from '../services/translationService';

interface TranslatorViewProps {
    onBack: () => void;
}

const sourceLanguages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
];

const targetLanguages = sourceLanguages.filter(lang => lang.code !== 'auto');

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
);

const TranslatorView: React.FC<TranslatorViewProps> = ({ onBack }) => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('en');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    const handleTranslate = async (text: string, source: string, target: string) => {
        if (!text.trim()) {
            setOutputText('');
            return;
        }
        setIsLoading(true);
        try {
            const result = await translateText(text, targetLanguages.find(l => l.code === target)?.name || 'English', sourceLanguages.find(l => l.code === source)?.name || 'Auto Detect');
            setOutputText(result);
        } catch (error) {
            setOutputText("Sorry, an error occurred during translation.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        if (inputText.trim()) {
            setIsLoading(true); // Show loading state immediately on typing
            debounceTimeout.current = window.setTimeout(() => {
                handleTranslate(inputText, sourceLang, targetLang);
            }, 500); // 500ms debounce
        } else {
            setOutputText('');
            setIsLoading(false);
        }

        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [inputText, sourceLang, targetLang]);

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(outputText);
    };
    
    const handleCopy = () => {
        if (outputText) {
            navigator.clipboard.writeText(outputText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-[#131314]">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex items-center mb-6">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-2 md:mr-4" aria-label="Back to chat">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Translator</h1>
                </div>

                <div className="flex items-center gap-2 md:gap-4 mb-4">
                    <div className="relative w-full">
                        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full bg-white dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {sourceLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto'} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Swap languages">
                        <ArrowRightLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="relative w-full">
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full bg-white dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative flex flex-col">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text..."
                            className="w-full flex-1 p-3 bg-white dark:bg-[#1e1f22] rounded-lg border border-gray-300 dark:border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-between items-center mt-2">
                             <span className="text-xs text-gray-500 dark:text-gray-400">{inputText.length} / 5000</span>
                             {inputText && (
                                <button onClick={() => setInputText('')} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Clear input text">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="relative flex flex-col">
                        <div className="w-full flex-1 p-3 bg-white dark:bg-[#1e1f22] rounded-lg border border-gray-300 dark:border-gray-600 overflow-y-auto">
                           {isLoading && !outputText ? <SkeletonLoader /> : <p className={`whitespace-pre-wrap ${!outputText ? 'text-gray-400 dark:text-gray-500' : ''}`}>{outputText || 'Translation'}</p>}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                             <span className="text-xs text-gray-500 dark:text-gray-400">{outputText.length} characters</span>
                             {outputText && !isLoading && (
                                <button onClick={handleCopy} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Copy translation">
                                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
