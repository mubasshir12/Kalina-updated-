import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRightLeft, Copy, Check, X, Volume2, ClipboardPaste, Languages, StopCircle } from 'lucide-react';
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

const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
};

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
    const [detectedLangName, setDetectedLangName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [tokenCount, setTokenCount] = useState({ input: 0, output: 0 });
    const [speakingFor, setSpeakingFor] = useState<'input' | 'output' | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    
    const debounceTimeout = useRef<number | null>(null);
    const synth = window.speechSynthesis;

    useEffect(() => {
        const loadVoices = () => setVoices(synth.getVoices());
        loadVoices();
        synth.onvoiceschanged = loadVoices;
        return () => {
            synth.cancel();
            synth.onvoiceschanged = null;
        }
    }, [synth]);

    const handleTranslate = useCallback(async (text: string, source: string, target: string) => {
        if (!text.trim()) {
            setOutputText('');
            setTokenCount({ input: 0, output: 0 });
            setDetectedLangName(null);
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
        if (source === 'auto' && result.detectedSourceLanguage) {
            setDetectedLangName(result.detectedSourceLanguage);
        } else {
            setDetectedLangName(null);
        }

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
            setDetectedLangName(null);
        }

        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [inputText, sourceLang, targetLang, handleTranslate]);
    
    const handleSwapLanguages = () => {
        if (sourceLang === 'auto' || isLoading) return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(outputText);
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

    const handleStopSpeaking = () => {
        synth.cancel();
        setSpeakingFor(null);
    };
    
    const handleSpeak = (text: string, langCode: string, side: 'input' | 'output') => {
        if (speakingFor) {
            handleStopSpeaking();
            if (speakingFor !== side) {
                setTimeout(() => speak(text, langCode, side), 100);
            }
            return;
        }
        speak(text, langCode, side);
    };

    const speak = (text: string, langCode: string, side: 'input' | 'output') => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = handleStopSpeaking;
        utterance.onerror = handleStopSpeaking;

        let voiceLang = langCode;
        if (langCode === 'auto' && detectedLangName) {
            const detectedCode = sourceLanguages.find(l => l.name.toLowerCase() === detectedLangName.toLowerCase())?.code;
            if (detectedCode) voiceLang = detectedCode;
        }
        
        const matchingVoice = voices.find(v => v.lang.startsWith(voiceLang));
        if (matchingVoice) utterance.voice = matchingVoice;
        else utterance.lang = voiceLang;
        
        setSpeakingFor(side);
        synth.speak(utterance);
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-[#131314]">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-2 md:mr-4" aria-label="Back to chat">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Translator</h1>
                </div>

                <div className="bg-white dark:bg-[#1e1f22] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                    {/* Source Text Area */}
                    <div className="p-4 flex flex-col flex-1 border-b border-gray-200 dark:border-gray-700">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text..."
                            className="w-full flex-1 p-2 bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200 text-lg leading-relaxed translator-scrollbar"
                        />
                        <div className="pt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-mono">
                            <span>{inputText.length} chars / {countWords(inputText)} words</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleSpeak(inputText, sourceLang, 'input')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Speak input text" disabled={!inputText || isLoading}>
                                    {speakingFor === 'input' ? <StopCircle className="h-4 w-4 text-indigo-500" /> : <Volume2 className="h-4 w-4" />}
                                </button>
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
                        <div className="relative flex-1 min-w-[120px]">
                            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                                {sourceLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                            </select>
                            {sourceLang === 'auto' && detectedLangName && <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">({detectedLangName})</span>}
                        </div>
                        <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto' || isLoading} className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all" aria-label="Swap languages">
                            <ArrowRightLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="flex-1 min-w-[120px] bg-gray-100 dark:bg-[#2E2F33] border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                            {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>

                    {/* Target Text Area */}
                    <div className="p-4 flex flex-col flex-1 bg-gray-50 dark:bg-gray-900/20">
                        <div className="relative flex-1 overflow-y-auto translator-scrollbar">
                            {isLoading ? (
                                <SkeletonLoader />
                            ) : outputText ? (
                                <p className="whitespace-pre-wrap p-2 text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                                    {outputText}
                                </p>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <Languages className="h-8 w-8 mr-2" />
                                    <span>Translation will appear here</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-2 flex justify-between items-center">
                             <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {outputText.length} chars / {countWords(outputText)} words
                            </span>
                             <div className="flex items-center gap-1">
                                {speakingFor !== 'output' && !isLoading && outputText && (
                                    <button onClick={() => handleSpeak(outputText, targetLang, 'output')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Speak translation">
                                        <Volume2 className="h-5 w-5" />
                                    </button>
                                )}
                                {speakingFor === 'output' && (
                                    <button onClick={handleStopSpeaking} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Stop speaking">
                                        <StopCircle className="h-5 w-5 text-indigo-500" />
                                    </button>
                                )}
                                {!isLoading && outputText && (
                                   <button onClick={handleCopy} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Copy translation">
                                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default TranslatorView;