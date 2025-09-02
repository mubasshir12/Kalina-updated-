
import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import GeneratedImage from '../GeneratedImage';
import MessageActions from './MessageActions';
import MessageMetadata from './MessageMetadata';
import ModelStatusIndicators from './ModelStatusIndicators';

interface ModelResponseProps extends ChatMessageType {
    isStreaming?: boolean;
    isThinking?: boolean;
    isSearchingWeb?: boolean;
    isReadingUrl?: boolean;
    isLongUrlRead?: boolean;
    onRetry?: () => void;
    onUpdateMessageContent: (messageId: string, newContent: string) => void;
    isSpeaking?: boolean;
    onToggleAudio?: (id: string, text: string) => void;
    onCancelStream?: () => void;
    setModalImage: (url: string) => void;
    setImageToDownload: (base64: string) => void;
}

const ModelResponse: React.FC<ModelResponseProps> = (props) => {
    const { 
        id, content, isStreaming, memoryUpdated, generatedImagesBase64, sources,
        onUpdateMessageContent, setModalImage, setImageToDownload
    } = props;

    const showStatus = props.isPlanning || props.isReadingUrl || props.isThinking || props.isGeneratingImage || (isStreaming && !content && (!generatedImagesBase64 || generatedImagesBase64.length === 0));
    const showContent = content || (generatedImagesBase64 && generatedImagesBase64.length > 0);

    return (
        <div className="w-full">
            {memoryUpdated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08.5.5 0 0 1 .92.38 1.5 1.5 0 0 0 2.94 1.54.5.5 0 0 1 .92.38v-3.32a.5.5 0 0 1-.46-.5c-.32-.64-.63-1.28-1.1-1.92s-1-1.28-1.5-1.92c-.52-.65-1-1.3-1.42-2-.42-.7-.8-1.42-1.12-2.15a.5.5 0 0 1 .92-.38c.33.74.65 1.45.98 2.12.33.68.68 1.3.98 1.9.3.6.6.1.88 1.7.28.6.58 1.18.9 1.72.33.55.65 1.08.98 1.6.32.5.65.98.98 1.45.32.48.65.92.98 1.35.32.42.65.8.98 1.15.33.35.65.68.98.98.32.3.65.58.98.85.32.28.65.52.98.72V4.5A2.5 2.5 0 0 1 14.5 2h-5z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08.5.5 0 0 0-.92.38 1.5 1.5 0 0 1-2.94 1.54.5.5 0 0 0-.92.38v-3.32a.5.5 0 0 0 .46-.5c.32-.64.63-1.28 1.1-1.92s1-1.28 1.5-1.92c.52-.65 1-1.3 1.42-2 .42-.7.8-1.42 1.12-2.15a.5.5 0 0 0-.92-.38c-.33.74-.65 1.45-.98 2.12-.33.68-.68 1.3-.98 1.9-.3.6-.6.1-.88 1.7-.28.6-.58 1.18-.9 1.72-.33.55-.65 1.08-.98 1.6-.32.5-.65.98-.98 1.45-.32.48-.65.92-.98 1.35-.32.42-.65.8-.98 1.15-.33.35-.65.68-.98.98-.32.3-.65.58-.98.85-.32.28-.65.52-.98.72V4.5A2.5 2.5 0 0 0 9.5 2h5z"/></svg>
                    <span>Memory updated</span>
                </div>
            )}

            {showStatus && <ModelStatusIndicators {...props} />}

            {showContent && (
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {generatedImagesBase64 && generatedImagesBase64.length > 0 && (
                        <div className="mb-2 grid grid-cols-2 gap-2 max-w-[420px]">
                            {generatedImagesBase64.map((base64, index) => (
                                <GeneratedImage 
                                    key={index} 
                                    base64={base64} 
                                    onExpandClick={setModalImage}
                                    onDownloadClick={setImageToDownload}
                                />
                            ))}
                        </div>
                    )}

                    {content ? <MarkdownRenderer content={content} sources={sources} onContentUpdate={(newContent) => onUpdateMessageContent(id, newContent)} isStreaming={!!isStreaming} /> : null}
                    
                    {isStreaming && content ? <span className="inline-block w-2 h-4 bg-gray-800 dark:bg-white animate-pulse ml-1" /> : null}
                </div>
            )}
            
            {!isStreaming && showContent && (
                <>
                    <MessageActions {...props} />
                    <MessageMetadata {...props} />
                </>
            )}
        </div>
    );
};

export default ModelResponse;
