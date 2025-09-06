
import React from 'react';
import { Conversation, LTM, Suggestion, View } from '../types';
import ChatHistory from './ChatHistory';
import WelcomeScreen from './WelcomeScreen';
import MemoryManagement from './MemoryManagement';
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
    ltm: LTM;
    translatorUsage: { input: number; output: number };
    handleRetry: () => void;
    handleEditMessage: (index: number, newContent: string) => void;
    handleUpdateMessageContent: (messageId: string, newContent: string) => void;
    handleToggleAudio: (id: string, text: string) => void;
    handleSelectSuggestion: (suggestion: Suggestion) => void;
    handleCancelStream: () => void;
    setCurrentView: (view: View) => void;
    setLtm: React.Dispatch<React.SetStateAction<LTM>>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    onCloseTranslator: () => void;
    onTranslationComplete: (tokens: { input: number; output: number }) => void;
    setModalImage: (url: string | null) => void;
    setCodeForPreview: (data: { code: string; language: string; } | null) => void;
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
    ltm,
    translatorUsage,
    handleRetry,
    handleEditMessage,
    handleUpdateMessageContent,
    handleToggleAudio,
    handleSelectSuggestion,
    handleCancelStream,
    setCurrentView,
    setLtm,
    scrollContainerRef,
    onCloseTranslator,
    onTranslationComplete,
    setModalImage,
    setCodeForPreview,
}) => {

    switch (currentView) {
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
            return (
                <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 relative">
                        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto">
                           {showWelcomeScreen ? (
                                <WelcomeScreen onSelectSuggestion={handleSelectSuggestion} />
                            ) : (
                                <div className="px-4 pt-4 md:px-6 md:pt-6 pb-2">
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
                                                setCodeForPreview={setCodeForPreview}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            );
    }
};

export default ViewRenderer;
