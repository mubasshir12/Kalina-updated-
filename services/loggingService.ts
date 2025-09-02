
import { IS_DEV_CONSOLE_ENABLED } from '../config';

export interface DevLog {
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'ai-response';
    message: string;
    stack?: string;
    originalError?: Error;
}

// A simple event emitter to notify the console of new logs.
const listeners: ((logs: DevLog[]) => void)[] = [];
let logs: DevLog[] = [];

const notifyListeners = () => {
    listeners.forEach(listener => listener(logs));
};

const truncateBase64InString = (text: string | undefined): string | undefined => {
    if (!text) return text;
    // This regex looks for 'data:application/javascript;base64,' followed by a long base64 string (50+ chars)
    // and replaces the long base64 part with a placeholder to keep the console readable.
    return text.replace(/(data:application\/javascript;base64,)[A-Za-z0-9+/=]{50,}/g, '$1[...omitted for brevity...]');
};

export const subscribeToLogs = (callback: (logs: DevLog[]) => void) => {
    if (!IS_DEV_CONSOLE_ENABLED) return () => {};
    listeners.push(callback);
    // Immediately provide current logs to new subscriber
    callback(logs);
    // Return an unsubscribe function
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
};

export const logDev = (level: DevLog['level'], ...args: any[]) => {
    if (!IS_DEV_CONSOLE_ENABLED) {
        return;
    }

    const messageParts: string[] = [];
    let error: Error | undefined;

    for (const arg of args) {
        if (arg instanceof Error) {
            error = arg;
            messageParts.push(arg.message);
        } else if (typeof arg === 'object' && arg !== null) {
            try {
                // Use a replacer to handle potential circular references gracefully
                const getCircularReplacer = () => {
                    const seen = new WeakSet();
                    return (key: string, value: object | null) => {
                        if (typeof value === "object" && value !== null) {
                            if (seen.has(value)) {
                                return "[Circular Reference]";
                            }
                            seen.add(value);
                        }
                        return value;
                    };
                };
                messageParts.push(JSON.stringify(arg, getCircularReplacer(), 2));
            } catch {
                messageParts.push('[Unserializable Object]');
            }
        } else {
            messageParts.push(String(arg));
        }
    }
    
    const newLog: DevLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level: level,
        message: truncateBase64InString(messageParts.join(' ')) || '',
        stack: truncateBase64InString(error?.stack),
        originalError: error
    };

    logs = [newLog, ...logs].slice(0, 100); // Keep last 100 logs
    notifyListeners();

    // Also log to the actual console for desktop users
    switch(level) {
        case 'error': console.error(...args); break;
        case 'warn': console.warn(...args); break;
        case 'info': console.info(...args); break;
    }
};

export const clearDevLogs = () => {
    if (!IS_DEV_CONSOLE_ENABLED) return;
    logs = [];
    notifyListeners();
}

export const setupGlobalErrorHandlers = () => {
    if (!IS_DEV_CONSOLE_ENABLED) return;

    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        logDev('error', `Unhandled Error: ${message}`, error || new Error(`${message} at ${source}:${lineno}:${colno}`));
        if (originalOnError) {
            return originalOnError(message, source, lineno, colno, error);
        }
        // Prevents default browser error handling if there was no original handler
        return false;
    };
    
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
        logDev('error', 'Unhandled Promise Rejection:', event.reason);
        if (originalOnUnhandledRejection) {
             originalOnUnhandledRejection.call(window, event);
        }
    };
}