

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Play } from 'lucide-react';
import CodePreviewModal from './CodePreviewModal';

declare const hljs: any;

interface CodeBlockProps {
    language: string;
    code: string;
    onPersistUpdate: (oldCode: string, newCode: string) => void;
    isStreaming?: boolean;
    // FIX: Make setCodeForPreview optional to align with MarkdownRenderer and disable "Run" button when not provided.
    setCodeForPreview?: (data: { code: string; language: string; onFix: (newCode: string) => void; } | null) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code: initialCode, onPersistUpdate, isStreaming, setCodeForPreview }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [currentCode, setCurrentCode] = useState(initialCode);
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // If the parent's code changes (e.g., from a re-render), update the local state.
        setCurrentCode(initialCode);
    }, [initialCode]);

    useEffect(() => {
        // When streaming is finished, or code is updated, apply highlighting.
        if (codeRef.current && !isStreaming && typeof hljs !== 'undefined') {
            hljs.highlightElement(codeRef.current);
        }
    }, [isStreaming, currentCode, language]);

    // FIX: Only show run button if setCodeForPreview is provided.
    const isRunnable = setCodeForPreview && ['html', 'htmlbars', 'javascript', 'css'].includes(language.toLowerCase());

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };
    
    const handleRunClick = () => {
        const onFix = (newCode: string) => {
            setCurrentCode(newCode);
            onPersistUpdate(initialCode, newCode);
        };
        // FIX: Use optional chaining in case setCodeForPreview is not provided.
        setCodeForPreview?.({
            code: currentCode,
            language: language,
            onFix: onFix,
        });
    };

    return (
        <>
            <div className="bg-neutral-100 dark:bg-[#1e1f22] rounded-lg my-4 border border-neutral-200 dark:border-gray-700 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-neutral-200 dark:bg-gray-800/50">
                    <span className="text-xs font-sans text-neutral-500 dark:text-gray-400 uppercase font-semibold">
                        {language || 'code'}
                    </span>
                    <div className="flex items-center gap-4">
                        {isRunnable && (
                             <button
                                onClick={handleRunClick}
                                className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                aria-label="Run code"
                            >
                                <Play className="h-3.5 w-3.5" />
                                <span>Run</span>
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-gray-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            aria-label={isCopied ? 'Copied' : 'Copy code'}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <pre className="p-4 text-sm whitespace-pre overflow-x-auto code-scrollbar">
                    <code ref={codeRef} className={`font-mono hljs language-${language}`}>
                        {currentCode}
                    </code>
                </pre>
            </div>
        </>
    );
};

export default CodeBlock;
