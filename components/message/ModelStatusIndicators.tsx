
import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import ThinkingProcess from '../ThinkingProcess';
import WebSearchAnimation from '../WebSearchAnimation';
import UrlReaderAnimation from '../UrlReaderAnimation';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-3 py-2">
        <div className="h-4 blue-shimmer-bg rounded w-5/6"></div>
        <div className="h-4 blue-shimmer-bg rounded w-full"></div>
        <div className="h-4 blue-shimmer-bg rounded w-4/6"></div>
        <style>{`
            .blue-shimmer-bg {
                background-color: #e5e7eb; /* gray-200 */
                background-image: linear-gradient(110deg, #e5e7eb 8%, #dbeafe 18%, #e5e7eb 33%); /* gray-200, blue-200, gray-200 */
                background-size: 200% 100%;
                animation: blue-shimmer 1.5s linear infinite;
            }
            .dark .blue-shimmer-bg {
                background-color: #374151; /* gray-700 */
                background-image: linear-gradient(110deg, #374151 8%, #1e40af 18%, #374151 33%); /* gray-700, blue-800, gray-700 */
                background-size: 200% 100%;
            }
            @keyframes blue-shimmer {
                to {
                    background-position-x: -200%;
                }
            }
        `}</style>
    </div>
);

const ImageGenerationLoader: React.FC<{ count: number; aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | number; isEditing?: boolean; }> = ({ count = 1, aspectRatio = "1:1", isEditing = false }) => {
    const getAspectRatioClass = (ratio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4") => {
        switch (ratio) {
            case "16:9": return "aspect-[16/9]";
            case "9:16": return "aspect-[9/16]";
            case "4:3": return "aspect-[4/3]";
            case "3:4": return "aspect-[3/4]";
            case "1:1":
            default:
                return "aspect-square";
        }
    };
    
    const loaderText = isEditing ? 'Editing image...' : `Generating ${count} image${count > 1 ? 's' : ''}...`;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-circle text-indigo-500 dark:text-indigo-400 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span className="text-gray-500 dark:text-gray-400">{loaderText}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-[420px]">
              {Array.from({ length: count }).map((_, index) => {
                const isNumericRatio = typeof aspectRatio === 'number';
                const className = `w-full ${!isNumericRatio ? getAspectRatioClass(aspectRatio as "1:1" || '1:1') : ''} bg-gray-200 dark:bg-gray-800 rounded-lg shimmer-bg`;
                const style = isNumericRatio ? { aspectRatio: `${aspectRatio}` } : {};
                
                return <div key={index} className={className} style={style}></div>
              })}
            </div>
            <style>{`.shimmer-bg { background: linear-gradient(110deg, #e0e0e0 8%, #f8f8f8 18%, #e0e0e0 33%); background-size: 200% 100%; animation: 1.5s shimmer linear infinite; } .dark .shimmer-bg { background: linear-gradient(110deg, #2E2F33 8%, #4a4b50 18%, #2E2F33 33%); } @keyframes shimmer { to { background-position-x: -200%; } }`}</style>
        </div>
    );
};


interface ModelStatusProps extends ChatMessageType {
    isStreaming?: boolean;
    isThinking?: boolean;
    isSearchingWeb?: boolean;
    isReadingUrl?: boolean;
    isLongUrlRead?: boolean;
}

const ModelStatusIndicators: React.FC<ModelStatusProps> = (props) => {
    const { 
        isPlanning, isReadingUrl, isLongUrlRead, thoughts, thinkingDuration, isThinking,
        isGeneratingImage, imageGenerationCount, aspectRatio, isEditingImage,
        isStreaming, isSearchingWeb, searchPlan, content, generatedImagesBase64
     } = props;
    
    const showThinkingProcess = isThinking || (thoughts && thoughts.length > 0);
    const showStreamingLoader = isStreaming && !content && (!generatedImagesBase64 || generatedImagesBase64.length === 0);

    if (isPlanning) {
        return <SkeletonLoader />;
    }
    if (isReadingUrl) {
        return <UrlReaderAnimation isLongUrlRead={isLongUrlRead} />;
    }
    if (showThinkingProcess) {
        return <ThinkingProcess thoughts={thoughts || []} duration={thinkingDuration} isThinking={!!isThinking} />;
    }
    if (isGeneratingImage) {
        return <ImageGenerationLoader count={imageGenerationCount || 1} aspectRatio={aspectRatio} isEditing={isEditingImage} />;
    }
    if (showStreamingLoader) {
        return isSearchingWeb ? <WebSearchAnimation plan={searchPlan} /> : <SkeletonLoader />;
    }

    return null;
};

export default ModelStatusIndicators;
