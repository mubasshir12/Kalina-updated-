import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';
import { Plus, MoreVertical, Pencil, Trash2, Pin } from 'lucide-react';

interface ChatHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onRenameConversation: (id: string, newTitle: string) => void;
    onDeleteConversation: (id: string) => void;
    onPinConversation: (id: string) => void;
}

const ChatHistorySheet: React.FC<ChatHistorySheetProps> = ({
    isOpen,
    onClose,
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewChat,
    onRenameConversation,
    onDeleteConversation,
    onPinConversation,
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    const handleStartRename = (convo: Conversation) => {
        setOpenMenuId(null);
        setRenamingId(convo.id);
        setRenameValue(convo.title);
    };

    const handleFinishRename = () => {
        if (renamingId && renameValue.trim()) {
            onRenameConversation(renamingId, renameValue.trim());
        }
        setRenamingId(null);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-20"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div
                className={`fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-dark-sheet rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ height: '60vh' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-sheet-title"
            >
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <h2 id="history-sheet-title" className="text-lg font-semibold text-neutral-800 dark:text-gray-200">
                        Chat History
                    </h2>
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm"
                        aria-label="Start new chat"
                    >
                        <Plus className="h-4 w-4" />
                        New Chat
                    </button>
                </div>
                <div className="overflow-y-auto p-2 flex-grow">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 dark:text-gray-400">
                            No conversations yet.
                        </div>
                    ) : (
                        <ul>
                            {conversations.map((convo, index) => {
                                const isLastTwo = conversations.length > 2 && index >= conversations.length - 2;
                                const menuPositionClass = isLastTwo ? 'bottom-12' : 'top-12';

                                return (
                                <li key={convo.id} className="group relative">
                                    {renamingId === convo.id ? (
                                        <div className="flex items-center w-full text-left p-2 my-1">
                                            <input
                                                ref={renameInputRef}
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onBlur={handleFinishRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFinishRename();
                                                    if (e.key === 'Escape') setRenamingId(null);
                                                }}
                                                className="w-full bg-neutral-100 dark:bg-gray-800/60 text-neutral-800 dark:text-gray-200 focus:outline-none ring-1 ring-amber-500 rounded p-1.5"
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onSelectConversation(convo.id)}
                                            className={`w-full text-left p-3 my-1 rounded-lg transition-colors flex items-center gap-3 ${
                                                convo.id === activeConversationId
                                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                                                    : 'text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800/60'
                                            }`}
                                        >
                                            {convo.isGeneratingTitle ? (
                                                 <div className="w-3/4 h-4 bg-neutral-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                                            ) : (
                                                 <span className="font-medium flex-1 break-words">{convo.title}</span>
                                            )}
                                            {convo.isPinned && <Pin className="h-4 w-4 text-amber-500 dark:text-amber-400 transform -rotate-45 flex-shrink-0" />}
                                        </button>
                                    )}

                                    {renamingId !== convo.id && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === convo.id ? null : convo.id); }}
                                                className="p-2 rounded-full text-neutral-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-gray-700/70"
                                                aria-label="Conversation options"
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}

                                    {openMenuId === convo.id && (
                                        <div ref={menuRef} className={`absolute right-4 ${menuPositionClass} z-50 w-40 bg-white dark:bg-dark-menu border border-neutral-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden`}>
                                            <button onClick={() => handleStartRename(convo)} className="w-full flex items-center gap-3 p-2.5 text-sm text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/70 transition-colors">
                                                <Pencil className="w-4 h-4" /> Rename
                                            </button>
                                            <button onClick={() => { onPinConversation(convo.id); setOpenMenuId(null); }} className="w-full flex items-center gap-3 p-2.5 text-sm text-neutral-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-700/70 transition-colors">
                                                <Pin className="w-4 h-4" /> {convo.isPinned ? 'Unpin' : 'Pin'}
                                            </button>
                                            <button onClick={() => { onDeleteConversation(convo.id); setOpenMenuId(null); }} className="w-full flex items-center gap-3 p-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatHistorySheet;