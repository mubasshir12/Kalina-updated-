

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, Trash2, AlertTriangle, Info, AlertCircle, Sparkles, Copy, Check, Lightbulb } from 'lucide-react';
import { DevLog, subscribeToLogs, clearDevLogs } from '../services/loggingService';
import { errorHints, ErrorHint } from '../utils/errorHints';
import MarkdownRenderer from './MarkdownRenderer';

interface DevConsoleProps {
    isOpen: boolean;
    onClose: () => void;
    onAskAi: (log: DevLog) => void;
}

const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode; }> = ({ content, children }) => (
    <div className="relative group flex items-center">
        {children}
        <div className="absolute bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-md p-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg">
            {content}
        </div>
    </div>
);

const LogItem: React.FC<{ log: DevLog; onAskAi: (log: DevLog) => void }> = ({ log, onAskAi }) => {
    const [isCopied, setIsCopied] = useState(false);
    const getLevelStyles = (level: DevLog['level']) => {
        switch (level) {
            case 'error': return { Icon: AlertCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10' };
            case 'warn': return { Icon: AlertTriangle, color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-500/10' };
            case 'info': return { Icon: Info, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' };
            case 'ai-response': return { Icon: Sparkles, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10' };
            default: return { Icon: Terminal, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10' };
        }
    };

    const { Icon, color, bg } = getLevelStyles(log.level);
    const matchedHint = log.level === 'error' ? errorHints.find(h => h.matcher.test(log.message)) : null;

    const handleCopy = () => {
        const textToCopy = `[${log.level.toUpperCase()}] ${log.timestamp}\nMessage: ${log.message}\nStack: ${log.stack || 'N/A'}`;
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`p-2 border-b border-gray-100 dark:border-gray-800 ${bg}`}>
            <div className={`flex items-center justify-between font-semibold ${color}`}>
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{log.level.toUpperCase()}</span>
                    <span className="text-gray-400 dark:text-gray-600 font-sans">{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                    {log.level === 'error' && matchedHint && (
                        <Tooltip content={
                            <div>
                                <p className="font-bold">{matchedHint.hint}</p>
                                <p className="mt-1">{matchedHint.suggestion}</p>
                            </div>
                        }>
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                        </Tooltip>
                    )}
                     <button onClick={handleCopy} className="p-1 rounded-full hover:bg-gray-500/20" aria-label="Copy Log">
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                    </button>
                    {log.level === 'error' && (
                        <button onClick={() => onAskAi(log)} className="p-1 rounded-full hover:bg-gray-500/20" aria-label="Ask AI to fix">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                        </button>
                    )}
                </div>
            </div>
             {log.level === 'ai-response' ? (
                <div className="mt-1 text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2">
                    <MarkdownRenderer content={log.message} onContentUpdate={() => {}} isStreaming={false} />
                </div>
            ) : (
                <pre className="mt-1 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{log.message}</pre>
            )}
            {log.stack && (
                <details className="mt-1">
                    <summary className="cursor-pointer text-gray-500 dark:text-gray-400 text-xs">Show Stack Trace</summary>
                    <pre className="mt-1 p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] whitespace-pre-wrap break-words">{log.stack}</pre>
                </details>
            )}
        </div>
    );
};


const DevConsole: React.FC<DevConsoleProps> = ({ isOpen, onClose, onAskAi }) => {
    const [logs, setLogs] = useState<DevLog[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToLogs(setLogs);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isOpen) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);
    
    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-[9998] bg-white dark:bg-[#131314] border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ height: '50vh' }}
        >
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Developer Console</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clearDevLogs} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Clear logs">
                            <Trash2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close console">
                            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
                    {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            No logs yet.
                        </div>
                    ) : (
                        logs.map(log => <LogItem key={log.id} log={log} onAskAi={onAskAi} />)
                    )}
                     <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};

export default DevConsole;