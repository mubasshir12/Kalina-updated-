



import React, { useCallback } from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import ThinkingProcess from '../ThinkingProcess';
import WebSearchAnimation from '../WebSearchAnimation';
import UrlReaderAnimation from '../UrlReaderAnimation';
import GeneratedImage from '../GeneratedImage';
import { Brain } from 'lucide-react';
import ImageGenerationAnimation from '../ImageGenerationAnimation';
import { useSmoothStream } from '../../hooks/useSmoothStream';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 py-2">
        <div className="h-4 shimmer-bg rounded w-5/6"></div>
        <div className="h-4 shimmer-bg rounded w-full"></div>
        <div className="h-4 shimmer-bg rounded w-4/6"></div>
    </div>
);

const MemoryUpdateNotification: React.FC = () => (
    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-gray-400 mb-2 font-medium">
        <Brain className="h-3.5 w-3.5" />
        <span>Memory updated</span>
    </div>
);

const ImageGenerationLoader: React.FC<{ count: number; aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | number; isEditing?: boolean; generationComplete?: boolean; }> = ({ count = 1, aspectRatio = "1:1", isEditing = false, generationComplete = false }) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 max-w-[420px]">
              {Array.from({ length: count }).map((_, index) => (
                  <ImageGenerationAnimation key={index} aspectRatio={aspectRatio} isEditing={isEditing && count === 1} generationComplete={generationComplete} />
              ))}
            </div>
        </div>
    );
};


interface MessageContentProps extends ChatMessageType {
    setModalImage: (url: string | null) => void;
    setImageToDownload: (base64: string | null) => void;
    // FIX: Add missing properties that are destructured in the component.
    isStreaming?: boolean;
    isThinking?: boolean;
    isSearchingWeb?: boolean;
    onUpdateMessageContent: (messageId: string, newContent: string) => void;
    onOpenCodePreview?: (code: string, language: string, messageId: string, originalCode: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
    id,
    content,
    isStreaming,
    isThinking,
    isSearchingWeb,
    isReadingUrl,
    isLongUrlRead,
    isGeneratingImage,
    isEditingImage,
    generationComplete,
    generatedImagesBase64,
    imageGenerationCount,
    aspectRatio,
    isPlanning,
    sources,
    thoughts,
    searchPlan,
    thinkingDuration,
    memoryUpdated,
    onUpdateMessageContent,
    setModalImage,
    setImageToDownload,
    onOpenCodePreview,
}) => {
    const showThinkingProcess = isThinking || (thoughts && thoughts.length > 0);
    const smoothContent = useSmoothStream(content, !!isStreaming);
    const showImageLoader = isGeneratingImage || isEditingImage;
    const showFinalImages = generatedImagesBase64 && generatedImagesBase64.length > 0 && !showImageLoader;

    const handleOpenPreviewWithId = useCallback((code: string, language: string, originalCode: string) => {
        onOpenCodePreview?.(code, language, id, originalCode);
    }, [id, onOpenCodePreview]);

    return (
        <>
            <style>{`
                .shimmer-bg {
                    background-color: #e5e5e5; /* neutral-200 */
                    background-image: linear-gradient(110deg, #e5e5e5 8%, #fcd34d 18%, #e5e5e5 33%); /* neutral-200, amber-300, neutral-200 */
                    background-size: 200% 100%;
                    animation: shimmer 1.8s linear infinite;
                }
                .dark .shimmer-bg {
                    background-color: #1e1f22; 
                    background-image: linear-gradient(110deg, #1e1f22 8%, #b45309 18%, #1e1f22 33%); /* dark bg, amber-700, dark bg */
                    background-size: 200% 100%;
                }
                @keyframes shimmer {
                    to {
                        background-position-x: -200%;
                    }
                }
            `}</style>
            {memoryUpdated && <MemoryUpdateNotification />}

            {isPlanning && <SkeletonLoader />}
            
            {!isPlanning && isReadingUrl && <UrlReaderAnimation isLongUrlRead={isLongUrlRead} />}

            {!isPlanning && !isReadingUrl && showThinkingProcess && (
                <ThinkingProcess 
                    thoughts={thoughts || []} 
                    duration={thinkingDuration} 
                    isThinking={!!isThinking} 
                />
            )}

            {!isPlanning && !isReadingUrl && !showThinkingProcess && showImageLoader && <ImageGenerationLoader count={imageGenerationCount || 1} aspectRatio={aspectRatio} isEditing={isEditingImage} generationComplete={generationComplete} />}
            
            {!isPlanning && !isReadingUrl && !showThinkingProcess && !showImageLoader && isStreaming && !content && (!generatedImagesBase64 || generatedImagesBase64.length === 0) && (
                isSearchingWeb ? <div className="flex justify-center items-center"><WebSearchAnimation plan={searchPlan} /></div> : <SkeletonLoader />
            )}
            
            <div className="text-neutral-800 dark:text-gray-200 leading-relaxed">
            
            {showFinalImages && (
                <div className="mb-2 grid grid-cols-2 gap-2 max-w-[420px]">
                    {generatedImagesBase64.map((base64, index) => (
                        <GeneratedImage 
                            key={index} 
                            index={index}
                            base64={base64} 
                            onExpandClick={setModalImage}
                            onDownloadClick={setImageToDownload}
                        />
                    ))}
                </div>
            )}

            {smoothContent ? <MarkdownRenderer content={smoothContent} sources={sources} onContentUpdate={(newContent) => onUpdateMessageContent(id, newContent)} isStreaming={!!isStreaming} onOpenCodePreview={onOpenCodePreview ? handleOpenPreviewWithId : undefined} /> : null}
            
            {isStreaming && smoothContent ? <span className="inline-block w-2 h-4 bg-neutral-800 dark:bg-white animate-pulse ml-1" /> : null}
            </div>
       </>
    );
}

export default MessageContent;