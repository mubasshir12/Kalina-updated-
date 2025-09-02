

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { FileIcon, formatFileSize, truncateFileName } from './utils';
import ImageAnalysisAnimation from '../ImageAnalysisAnimation';
import FileAnalysisAnimation from '../FileAnalysisAnimation';
import { Pencil, Copy, Check, Image as ImageIcon } from 'lucide-react';

interface UserMessageProps extends ChatMessageType {
    index: number;
    onEditMessage?: (index: number, newContent: string) => void;
    setModalImage: (url: string) => void;
}

const UserMessage: React.FC<UserMessageProps> = (props) => {
    const {
        content,
        image,
        file,
        hasImage,
        fileInfo,
        isAnalyzingImage,
        isAnalyzingFile,
        index,
        onEditMessage,
        setModalImage,
    } = props;

    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const handleClickOutside = () => {
            if (isMenuVisible) {
                setIsMenuVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuVisible]);

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        pressTimer.current = setTimeout(() => {
            if ('vibrate' in navigator) {
                navigator.vibrate(20);
            }
            setIsMenuVisible(true);
        }, 500);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
    };

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
        setIsMenuVisible(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsMenuVisible(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent(content);
    };

    const handleSaveEdit = () => {
        if (typeof index === 'number' && onEditMessage && editedContent.trim()) {
            onEditMessage(index, editedContent);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="w-full max-w-2xl p-4 rounded-2xl bg-indigo-500 text-white rounded-br-none">
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-indigo-200 resize-none focus:outline-none leading-relaxed whitespace-pre-wrap"
                    rows={Math.max(2, editedContent.split('\n').length)}
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleCancelEdit} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Cancel</button>
                    <button onClick={handleSaveEdit} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-white text-indigo-500 hover:bg-gray-200 transition-colors">Save & Submit</button>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="flex flex-col items-end gap-2"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
            {image ? (
                <div className="relative max-w-[150px] rounded-lg overflow-hidden">
                    <img 
                        src={`data:${image.mimeType};base64,${image.base64}`} 
                        alt="User upload" 
                        className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setModalImage(`data:${image.mimeType};base64,${image.base64}`)}
                    />
                    {isAnalyzingImage && <ImageAnalysisAnimation />}
                </div>
            ) : hasImage && (
                 <div className="relative max-w-[150px] aspect-square rounded-lg bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center text-center p-2">
                    <ImageIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Image Attached</span>
                    {isAnalyzingImage && <ImageAnalysisAnimation />}
                </div>
            )}
            
            {file ? (
                <div className="relative">
                    {file.mimeType === 'application/pdf' ? (
                        <a href={`data:${file.mimeType};base64,${file.base64}`} target="_blank" rel="noopener noreferrer">
                            <div className="relative w-[200px] aspect-[16/9] bg-gray-200 dark:bg-gray-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                                <FileIcon mimeType={file.mimeType} />
                                <span className="font-medium text-sm break-all text-gray-700 dark:text-gray-300">{truncateFileName(file.name)}</span>
                                {file.size && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFileSize(file.size)}</span>
                                )}
                            </div>
                        </a>
                    ) : (
                            <div className="max-w-[200px] p-2.5 rounded-2xl bg-indigo-400 flex items-center gap-2.5 text-white">
                            <FileIcon mimeType={file.mimeType} />
                            <span className="font-medium truncate text-sm">{file.name}</span>
                        </div>
                    )}
                    {isAnalyzingFile && <FileAnalysisAnimation />}
                </div>
            ) : fileInfo && (
                 <div className="relative">
                    <div className="w-[200px] aspect-[16/9] bg-gray-200 dark:bg-gray-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center">
                        <FileIcon mimeType={fileInfo.mimeType} />
                        <span className="font-medium text-sm break-all text-gray-700 dark:text-gray-300">{truncateFileName(fileInfo.name)}</span>
                        {fileInfo.size && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFileSize(fileInfo.size)}</span>
                        )}
                    </div>
                    {isAnalyzingFile && <FileAnalysisAnimation />}
                </div>
            )}

            {content && (
                <div className="max-w-2xl p-4 rounded-2xl bg-indigo-500 text-white rounded-br-none">
                    <p className="leading-relaxed whitespace-pre-wrap break-all">
                        {content}
                    </p>
                </div>
            )}
            
            {isMenuVisible && onEditMessage && (
                <div 
                    className="flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={handleEdit} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" aria-label="Edit">
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button onClick={handleCopy} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" aria-label="Copy">
                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMessage;