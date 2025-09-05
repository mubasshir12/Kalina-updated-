
import React, { useState, useMemo, useEffect } from 'react';
import { Conversation, LTM, Suggestion, View } from '../types';
import ChatHistory from './ChatHistory';
import WelcomeScreen from './WelcomeScreen';
import Gallery from './Gallery';
import MemoryManagement from './MemoryManagement';
import ConversationNavigator from './ConversationNavigator';
import TranslatorView from './Translator';
import UsageStatsView from './UsageStatsView';

interface ViewRendererProps {
    currentView: View;
    showWelcomeScreen: boolean;
    activeConversation: Conversation | undefined;
    conversations: Conversation[];
    isLoading: boolean;
    isThinking: boolean;
    isSearchingWeb: boolean;
    speakingMessageId: string | null;
    allGeneratedImages: string[];
    ltm: LTM;
    translatorUsage: { input: number; output: number };
    handleRetry: () => void;
    handleEditMessage: (index: number, newContent: string) => void;
    handleUpdateMessageContent: (messageId: string, newContent: string) => void;
    handleToggleAudio: (id: string, text: string) => void;
    handleSelectSuggestion: (suggestion: Suggestion) => void;
    handleCancelStream: () => void;
    setCurrentView: (view: View) => void;
    setAllGeneratedImages: React.Dispatch<React.SetStateAction<string[]>>;
    setLtm: React.Dispatch<React.SetStateAction<LTM>>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    onCloseTranslator: () => void;
    onTranslationComplete: (tokens: { input: number; output: number }) => void;
    setModalImage: (url: string | null) => void;
    setImageToDownload: (base64: string | null) => void;
    setCodeForPreview: (data: { code: string; language: string; onFix: (newCode: string) => void; } | null) => void;
}

const ViewRenderer: React.FC<ViewRendererProps> = ({
    currentView,
    showWelcomeScreen,
    activeConversation,
    conversations,
    isLoading,
    isThinking,
    isSearchingWeb,
    speakingMessageId,
    allGeneratedImages,
    ltm,
    translatorUsage,
    handleRetry,
    handleEditMessage,
    handleUpdateMessageContent,
    handleToggleAudio,
    handleSelectSuggestion,
    handleCancelStream,
    setCurrentView,
    setAllGeneratedImages,
    setLtm,
    scrollContainerRef,
    onCloseTranslator,
    onTranslationComplete,
    setModalImage,
    setImageToDownload,
    setCodeForPreview,
}) => {
    const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);

    const userMessageIndices = useMemo(() => {
        if (!activeConversation) return [];
        const indices: number[] = [];
        activeConversation.messages.forEach((msg, index) => {
            if (msg.role === 'user') {
                indices.push(index);
            }
        });
        return indices;
    }, [activeConversation]);

    useEffect(() => {
        if (!scrollContainerRef.current || userMessageIndices.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries.filter(entry => entry.isIntersecting);
                if (visibleEntries.length > 0) {
                    const topmostEntry = visibleEntries.reduce((topmost, current) => 
                        current.boundingClientRect.top < topmost.boundingClientRect.top ? current : topmost
                    );
                    const index = parseInt(topmostEntry.target.id.split('-')[1], 10);
                    setActiveMessageIndex(index);
                }
            },
            {
                root: scrollContainerRef.current,
                rootMargin: '0px 0px -50% 0px',
                threshold: 0,
            }
        );

        const elements = userMessageIndices
            .map(index => document.getElementById(`message-${index}`))
            .filter((el): el is HTMLElement => el !== null);

        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [userMessageIndices, scrollContainerRef]);

    const handleNavigateToMessage = (index: number) => {
        const element = document.getElementById(`message-${index}`);
        element?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    switch (currentView) {
        case 'gallery':
            return (
                <Gallery
                    images={allGeneratedImages}
                    onBack={() => setCurrentView('chat')}
                    onDeleteImage={(index: number) => {
                        setAllGeneratedImages(prev => prev.filter((_, i) => i !== index));
                    }}
                />
            );
        case 'memory':
            return (
                <MemoryManagement
                    memory={ltm}
                    setMemory={setLtm}
                    onBack={() => setCurrentView('chat')}
                />
            );
        case 'translator':
            return <TranslatorView onBack={onCloseTranslator} onTranslationComplete={onTranslationComplete} />;
        case 'usage':
            return <UsageStatsView conversations={conversations} onBack={() => setCurrentView('chat')} translatorUsage={translatorUsage} />;
        case 'chat':
        default:
            const showNavigators = !showWelcomeScreen && activeConversation && userMessageIndices.length > 1;
            return (
                <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 relative">
                        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto">
                           {showWelcomeScreen ? (
                                <WelcomeScreen onSelectSuggestion={handleSelectSuggestion} />
                            ) : (
                                <div className="p-4 md:p-6">
                                    <div className="max-w-4xl mx-auto">
                                        {activeConversation && (
                                            <ChatHistory
                                                messages={activeConversation.messages}
                                                isLoading={isLoading}
                                                isThinking={isThinking}
                                                isSearchingWeb={isSearchingWeb}
                                                onRetry={handleRetry}
                                                onEditMessage={handleEditMessage}
                                                onUpdateMessageContent={handleUpdateMessageContent}
                                                speakingMessageId={speakingMessageId}
                                                onToggleAudio={handleToggleAudio}
                                                onCancelStream={handleCancelStream}
                                                scrollContainerRef={scrollContainerRef}
                                                setModalImage={setModalImage}
                                                setImageToDownload={setImageToDownload}
                                                setCodeForPreview={setCodeForPreview}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {showNavigators && (
               
                           <></>
                            
                           
                           
                        )}
                    </div>
                </main>
            );
    }
};

export default ViewRenderer;
