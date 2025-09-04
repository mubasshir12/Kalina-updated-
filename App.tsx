
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Suggestion, Tool, ChatModel, ModelInfo, View, ConsoleMode } from './types';
import { initializeAiClient } from './services/aiClient';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ImageOptionsModal from './components/ImageOptionsModal';
import ApiKeyModal from './components/ApiKeyModal';
import ChatHistorySheet from './components/ChatHistorySheet';
import ViewRenderer from './components/ViewRenderer';
import { useConversations } from './hooks/useConversations';
import { useMemory } from './hooks/useMemory';
import { useAudio } from './hooks/useAudio';
import { useChatHandler } from './hooks/useChatHandler';
import ConfirmationModal from './components/ConfirmationModal';
import ImagePromptSuggestions from './components/ImagePromptSuggestions';
import ModelSwitchModal from './components/ModelSwitchModal';
import { codeKeywords } from './utils/codeKeywords';
import { IS_DEV_CONSOLE_ENABLED } from './config';
import DevConsole from './components/DevConsole';
import ConsoleToggleButton from './components/ConsoleToggleButton';
import { useDebug } from './contexts/DebugContext';
import ParticleUniverse from './components/ParticleUniverse';
//import Globe from './components/Globe';
import ImageModal from './components/ImageModal';
import CodePreviewModal from './components/CodePreviewModal';

const models: ModelInfo[] = [
    { id: 'gemini-2.5-flash', name: 'Kalina 2.5 Flash', description: 'Optimized for speed and efficiency.' },
    { id: 'gemini-2.5-pro', name: 'Kalina 2.5 Pro', description: 'Advanced capabilities for complex tasks.' },
];

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
    const [selectedTool, setSelectedTool] = useState<Tool>('smart');
    const [selectedChatModel, setSelectedChatModel] = useState<ChatModel>('gemini-2.5-flash');
    const [isImageOptionsOpen, setIsImageOptionsOpen] = useState(false);
    const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
    const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
    const [allGeneratedImages, setAllGeneratedImages] = useState<string[]>(() => {
        try {
            const storedImages = localStorage.getItem('kalina_generated_images');
            return storedImages ? JSON.parse(storedImages) : [];
        } catch (e) {
            console.error("Failed to parse generated images from localStorage", e);
            return [];
        }
    });
    const [currentView, setCurrentView] = useState<View>('chat');
    const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
    const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
    const [isModelSwitchModalOpen, setIsModelSwitchModalOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string; image?: { base64: string; mimeType: string; }; file?: { base64: string; mimeType: string; name: string; size: number; } } | null>(null);
    const [translatorUsage, setTranslatorUsage] = useState<{ input: number, output: number }>(() => {
        try {
            const storedUsage = localStorage.getItem('kalina_translator_usage');
            return storedUsage ? JSON.parse(storedUsage) : { input: 0, output: 0 };
        } catch (e) {
            console.error("Failed to parse translator usage from localStorage", e);
            return { input: 0, output: 0 };
        }
    });
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    
    // State for modals lifted from child components
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [imageToDownload, setImageToDownload] = useState<string | null>(null);
    const [codeForPreview, setCodeForPreview] = useState<{ code: string; language: string; onFix: (newCode: string) => void; } | null>(null);

    // Dev Console State
    const { logs } = useDebug();
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [consoleMode, setConsoleMode] = useState<ConsoleMode>('auto');

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const conversationManager = useConversations();
    const { ltm, setLtm, codeMemory, setCodeMemory, userProfile, setUserProfile } = useMemory();
    const { speakingMessageId, handleToggleAudio, stopAudio, setSpeakingMessageId } = useAudio();
    
    const chatHandler = useChatHandler({
        apiKey,
        conversations: conversationManager.conversations,
        activeConversationId: conversationManager.activeConversationId,
        ltm,
        codeMemory,
        userProfile,
        selectedTool,
        selectedChatModel,
        imageGenerationPrompt,
        updateConversation: conversationManager.updateConversation,
        updateConversationMessages: conversationManager.updateConversationMessages,
        setConversations: conversationManager.setConversations,
        setActiveConversationId: conversationManager.setActiveConversationId,
        setLtm,
        setCodeMemory,
        setUserProfile,
        setAllGeneratedImages,
        setIsImageOptionsOpen,
        setImageGenerationPrompt,
        setActiveSuggestion
    });

    const { activeConversation, sortedConversations, handleNewChat, handleSelectConversation } = conversationManager;
    const { handleSendMessage, handleUpdateMessageContent, handleCancelStream, elapsedTime } = chatHandler;

    const showWelcomeScreen = !activeConversation || activeConversation.messages.length === 0;
    
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (IS_DEV_CONSOLE_ENABLED && consoleMode === 'auto' && logs.length > 0) {
            setIsConsoleOpen(true);
        }
    }, [logs, consoleMode]);

    useEffect(() => {
        try {
            localStorage.setItem('kalina_generated_images', JSON.stringify(allGeneratedImages));
        } catch (e) {
            console.error("Failed to save generated images to localStorage", e);
        }
    }, [allGeneratedImages]);

    useEffect(() => {
        try {
            localStorage.setItem('kalina_translator_usage', JSON.stringify(translatorUsage));
        } catch (e) {
            console.error("Failed to save translator usage to localStorage", e);
        }
    }, [translatorUsage]);

    useEffect(() => {
        const storedApiKey = localStorage.getItem('kalina_api_key');
        if (storedApiKey) {
            try {
                initializeAiClient(storedApiKey);
                setApiKey(storedApiKey);
            } catch (e) {
                console.error("Failed to initialize with stored API key:", e);
                localStorage.removeItem('kalina_api_key');
                setIsApiKeyModalOpen(true);
            }
        } else {
            setIsApiKeyModalOpen(true);
        }
    }, []);

    const resetStateForNewChat = useCallback(() => {
        chatHandler.setError(null);
        chatHandler.clearThinkingIntervals();
        chatHandler.setIsLoading(false);
        chatHandler.setIsThinking(false);
        chatHandler.setIsSearchingWeb(false);
        setSelectedTool('smart');
        stopAudio();
        setActiveSuggestion(null);
        setCurrentView('chat');
        setIsHistorySheetOpen(false);
    }, [chatHandler, stopAudio]);

    const onNewChat = useCallback(() => {
        handleNewChat();
        resetStateForNewChat();
    }, [handleNewChat, resetStateForNewChat]);

    const onSelectConversation = (id: string) => {
        handleSelectConversation(id);
        resetStateForNewChat();
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        if (suggestion.prompt) {
            setActiveSuggestion(suggestion);
        }
    };

    const handleSetApiKey = (key: string) => {
        try {
            initializeAiClient(key);
            localStorage.setItem('kalina_api_key', key);
            setApiKey(key);
            setIsApiKeyModalOpen(false);
        } catch (e) {
            console.error("Failed to set API key:", e);
        }
    };

    const isCodeRelated = (text: string): boolean => {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return codeKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    };

    const executeSendMessage = useCallback((prompt: string, image?: { base64: string; mimeType: string; }, file?: { base64: string; mimeType: string; name: string; size: number; }, overrideModel?: ChatModel, isRetry = false) => {
        const convo = conversationManager.conversations.find(c => c.id === conversationManager.activeConversationId);
        const isFirstMessage = !convo || convo.messages.length === 0;

        handleSendMessage(prompt, image, file, overrideModel, isRetry);

        setTimeout(() => {
            if (scrollContainerRef.current) {
                if (isFirstMessage) {
                    // For the first message in a chat, scroll to the top to ensure the user's prompt is clearly visible below the header.
                    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // For all subsequent messages, scroll to the bottom to show the latest response.
                    scrollContainerRef.current.scrollTo({
                        top: scrollContainerRef.current.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }
        }, 100);
    }, [handleSendMessage, conversationManager.conversations, conversationManager.activeConversationId]);

    const handleSendMessageWrapper = useCallback((prompt: string, image?: { base64: string; mimeType: string; }, file?: { base64: string; mimeType: string; name: string; size: number; }, isRetry = false) => {
        if (selectedChatModel !== 'gemini-2.5-pro' && isCodeRelated(prompt) && !isRetry) {
            setPendingPrompt({ prompt, image, file });
            setIsModelSwitchModalOpen(true);
        } else {
            executeSendMessage(prompt, image, file, undefined, isRetry);
        }
    }, [selectedChatModel, executeSendMessage]);

    const handleConfirmSwitch = () => {
        if (!pendingPrompt) return;
        executeSendMessage(pendingPrompt.prompt, pendingPrompt.image, pendingPrompt.file, 'gemini-2.5-pro');
        setIsModelSwitchModalOpen(false);
        setPendingPrompt(null);
    };

    const handleDeclineSwitch = () => {
        if (!pendingPrompt) return;
        executeSendMessage(pendingPrompt.prompt, pendingPrompt.image, pendingPrompt.file);
        setIsModelSwitchModalOpen(false);
        setPendingPrompt(null);
    };

    const handleRetry = useCallback(() => {
        if (!activeConversation || activeConversation.messages.length === 0) return;

        // FIX: Property 'findLastIndex' does not exist on type 'ChatMessage[]'. Replaced with a manual reverse loop for broader compatibility.
        let lastModelMessageIndex = -1;
        for (let i = activeConversation.messages.length - 1; i >= 0; i--) {
            if (activeConversation.messages[i].role === 'model') {
                lastModelMessageIndex = i;
                break;
            }
        }

        if (lastModelMessageIndex !== -1) {
            const lastUserMessage = activeConversation.messages[lastModelMessageIndex - 1];
            if (lastUserMessage?.role === 'user') {
                conversationManager.updateConversationMessages(activeConversation.id, prev => prev.slice(0, lastModelMessageIndex));
                handleSendMessageWrapper(lastUserMessage.content, lastUserMessage.image, lastUserMessage.file, true);
            }
        }
    }, [activeConversation, conversationManager, handleSendMessageWrapper]);

    const handleEditMessage = (index: number, newContent: string) => {
        if (!activeConversation) return;
        
        const messageToEdit = activeConversation.messages[index];
        if (messageToEdit.role !== 'user') return;
        
        conversationManager.updateConversationMessages(activeConversation.id, prev => prev.slice(0, index));
        handleSendMessageWrapper(newContent, messageToEdit.image, messageToEdit.file);
    };
    
    const onConfirmCancelStream = () => {
        handleCancelStream();
        setIsStopConfirmOpen(false);
    };

    const handleToolChange = (tool: Tool) => {
        setSelectedTool(tool);
        if (tool === 'translator') {
            setCurrentView('translator');
        } else {
            if (currentView === 'translator') {
                setCurrentView('chat');
            }
        }
    };

    const handleTranslationComplete = useCallback((tokens: { input: number, output: number }) => {
        setTranslatorUsage(prev => ({
            input: prev.input + tokens.input,
            output: prev.output + tokens.output,
        }));
    }, []);
    
    const handleConfirmDownload = () => {
        if (!imageToDownload) return;
        const imageUrl = `data:image/png;base64,${imageToDownload}`;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `kalina-ai-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setImageToDownload(null);
    };

    const showConsoleToggleButton = consoleMode === 'manual' || (consoleMode === 'auto' && logs.length > 0);

    return (
        <>
            <div className="relative flex flex-col h-[100dvh] bg-[#F9F6F2] dark:bg-transparent text-neutral-800 dark:text-white transition-colors duration-300">
                <div className="absolute inset-0 z-0">
                    {isDarkMode ? <ParticleUniverse /> : <></>}
                </div>

                <Header
                    onShowGallery={() => setCurrentView('gallery')}
                    onShowMemory={() => setCurrentView('memory')}
                    onShowUsage={() => setCurrentView('usage')}
                    isChatView={currentView === 'chat'}
                    consoleMode={consoleMode}
                    setConsoleMode={setConsoleMode}
                />

                <ViewRenderer
                    currentView={currentView}
                    showWelcomeScreen={showWelcomeScreen}
                    activeConversation={activeConversation}
                    conversations={conversationManager.conversations}
                    isLoading={chatHandler.isLoading}
                    isThinking={chatHandler.isThinking}
                    isSearchingWeb={chatHandler.isSearchingWeb}
                    speakingMessageId={speakingMessageId}
                    allGeneratedImages={allGeneratedImages}
                    ltm={ltm}
                    translatorUsage={translatorUsage}
                    handleRetry={handleRetry}
                    handleEditMessage={handleEditMessage}
                    handleUpdateMessageContent={handleUpdateMessageContent}
                    handleToggleAudio={handleToggleAudio}
                    handleSelectSuggestion={handleSelectSuggestion}
                    handleCancelStream={handleCancelStream}
                    setCurrentView={setCurrentView}
                    setAllGeneratedImages={setAllGeneratedImages}
                    setLtm={setLtm}
                    scrollContainerRef={scrollContainerRef}
                    onCloseTranslator={() => {
                        setSelectedTool('smart');
                        setCurrentView('chat');
                    }}
                    onTranslationComplete={handleTranslationComplete}
                    setModalImage={setModalImage}
                    setImageToDownload={setImageToDownload}
                    setCodeForPreview={setCodeForPreview}
                />

                {currentView === 'chat' && (
                    <div className="relative z-20 p-4 md:p-6 bg-white/5 dark:bg-black/5 backdrop-blur-sm border-t border-neutral-200/50 dark:border-white/10 rounded-tl-3xl rounded-tr-3xl">
                        <div className="max-w-4xl mx-auto relative">
                            {selectedTool === 'imageGeneration' && <ImagePromptSuggestions onSelectPrompt={(p) => handleSendMessageWrapper(p)} />}
                            
                            <ChatInput
                                onSendMessage={handleSendMessageWrapper}
                                isLoading={chatHandler.isLoading}
                                elapsedTime={elapsedTime}
                                selectedTool={selectedTool}
                                onToolChange={handleToolChange}
                                activeSuggestion={activeSuggestion}
                                onClearSuggestion={() => setActiveSuggestion(null)}
                                onOpenHistory={() => setIsHistorySheetOpen(true)}
                                conversationCount={conversationManager.conversations.length}
                                onCancelStream={() => setIsStopConfirmOpen(true)}
                                models={models}
                                selectedChatModel={selectedChatModel}
                                onSelectChatModel={setSelectedChatModel}
                                apiKey={apiKey}
                                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                            />
                        </div>
                    </div>
                )}
                
                {IS_DEV_CONSOLE_ENABLED && (
                    <>
                        {showConsoleToggleButton && (
                            <ConsoleToggleButton
                                onClick={() => setIsConsoleOpen(prev => !prev)}
                                errorCount={logs.length}
                            />
                        )}
                        <DevConsole
                            isOpen={isConsoleOpen}
                            onClose={() => setIsConsoleOpen(false)}
                            mode={consoleMode}
                        />
                    </>
                )}
            </div>
            
            {/* Modals are rendered here, outside the main scrolling container */}
            <ModelSwitchModal
                isOpen={isModelSwitchModalOpen}
                onClose={() => {
                    setIsModelSwitchModalOpen(false);
                    setPendingPrompt(null);
                }}
                onConfirm={handleConfirmSwitch}
                onDecline={handleDeclineSwitch}
            />

            <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onSetApiKey={handleSetApiKey}
                onClose={() => { if (apiKey) setIsApiKeyModalOpen(false); }}
                currentApiKey={apiKey}
            />

            <ImageOptionsModal
                isOpen={isImageOptionsOpen}
                onClose={() => setIsImageOptionsOpen(false)}
                onGenerate={chatHandler.handleExecuteImageGeneration}
                prompt={imageGenerationPrompt}
            />
            <ChatHistorySheet
                isOpen={isHistorySheetOpen}
                onClose={() => setIsHistorySheetOpen(false)}
                conversations={sortedConversations}
                activeConversationId={conversationManager.activeConversationId}
                onSelectConversation={onSelectConversation}
                onNewChat={onNewChat}
                onRenameConversation={conversationManager.handleRenameConversation}
                onDeleteConversation={conversationManager.handleDeleteConversation}
                onPinConversation={conversationManager.handlePinConversation}
            />
            <ConfirmationModal
                isOpen={isStopConfirmOpen}
                onClose={() => setIsStopConfirmOpen(false)}
                onConfirm={onConfirmCancelStream}
                title="Stop Generation"
                message="Are you sure you want to stop generating the response?"
                confirmButtonText="Stop"
                confirmButtonVariant="danger"
            />
            
            {modalImage && <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />}
            
            <ConfirmationModal
                isOpen={imageToDownload !== null}
                onClose={() => setImageToDownload(null)}
                onConfirm={handleConfirmDownload}
                title="Confirm Download"
                message="Do you want to download this image?"
                confirmButtonText="Download"
            />

            {codeForPreview && (
                <CodePreviewModal
                    initialCode={codeForPreview.code}
                    language={codeForPreview.language}
                    onClose={() => setCodeForPreview(null)}
                    onCodeFixed={codeForPreview.onFix}
                />
            )}
        </>
    );
};

export default App;
