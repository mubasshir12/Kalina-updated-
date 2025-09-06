import React, { useState, useRef, useCallback } from 'react';
import { Content, Part } from '@google/ai';
import { ChatMessage as ChatMessageType, Suggestion, ChatModel, LTM, CodeSnippet, GroundingChunk, UserProfile, Tool } from '../types';
import { initializeAiClient } from '../services/aiClient';
import { startChatSession } from '../services/chatService';
import { planResponse } from '../services/geminiService';
import { updateMemory, summarizeConversation } from '../services/memoryService';
import { processAndSaveCode, findRelevantCode } from '../services/codeService';
import * as urlReaderService from '../services/urlReaderService';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { useDebug } from '../contexts/DebugContext';
import { developerProfile } from '../services/developerProfile';
import { getPersonaContext } from '../services/personaService';
import { getCapabilitiesContext } from '../services/capabilitiesService';

const models = [
    { id: 'gemini-2.5-flash', name: 'Kalina 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Kalina 2.5 Pro' },
];

const transformMessagesToHistory = (msgs: ChatMessageType[]): Content[] => {
      const validMessages = msgs.filter(m => !(m.role === 'model' && !m.content?.trim() && !m.image));
      return validMessages.map(msg => {
          const parts: Part[] = [];
          if (msg.content) {
              parts.push({ text: msg.content });
          }
          if (msg.image) {
              parts.push({ inlineData: { data: msg.image.base64, mimeType: msg.image.mimeType } });
          }
          if (msg.file) {
              parts.push({ inlineData: { data: msg.file.base64, mimeType: msg.file.mimeType } });
          }
          return {
              role: msg.role,
              parts: parts,
          };
      }).filter(msg => msg.parts.length > 0);
  };
  
// Simple estimation: ~4 characters per token.
const estimateTokens = (text: string): number => {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
};

export const useChatHandler = ({
    apiKey,
    conversations,
    activeConversationId,
    ltm,
    codeMemory,
    userProfile,
    selectedTool,
    selectedChatModel,
    updateConversation,
    updateConversationMessages,
    setConversations,
    setActiveConversationId,
    setLtm,
    setCodeMemory,
    setUserProfile,
    setActiveSuggestion
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);
    const [isLongToolUse, setIsLongToolUse] = useState<boolean>(false);
    const [error, setError] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const thinkingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const thinkingTimeRef = useRef(0);
    const isCancelledRef = useRef(false);
    const responseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const responseStartTimeRef = useRef(0);
    const { logError } = useDebug();


    const clearThinkingIntervals = useCallback(() => {
        if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
        if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
        thinkingIntervalRef.current = null;
        thinkingTimerRef.current = null;
        setIsThinking(false);
    }, []);
    
    const stopResponseTimer = useCallback(() => {
        if (responseTimerRef.current) {
            clearInterval(responseTimerRef.current);
            responseTimerRef.current = null;
        }
        setElapsedTime(0);
    }, []);

    const handleCancelStream = useCallback(() => {
        isCancelledRef.current = true;
        clearThinkingIntervals();
        stopResponseTimer();
        setIsSearchingWeb(false);
        setIsLoading(false);
    }, [clearThinkingIntervals, stopResponseTimer]);

    const handleSendMessage = useCallback(async (prompt: string, image?: { base64: string; mimeType: string; }, file?: { base64: string; mimeType: string; name: string; size: number; }, overrideModel?: ChatModel, isRetry = false) => {
        const fullPrompt = prompt;
        if ((!fullPrompt.trim() && !image && !file) || isLoading || !apiKey) return;

        const modelToUse = overrideModel || selectedChatModel;

        let currentConversationId = activeConversationId;
        let isFirstTurnInConversation = false;

        if (!currentConversationId) {
            const newId = crypto.randomUUID();
            setConversations(prev => [{ id: newId, title: "New Chat", messages: [] }, ...prev]);
            setActiveConversationId(newId);
            currentConversationId = newId;
            isFirstTurnInConversation = true;
        } else {
            const currentConvo = conversations.find(c => c.id === currentConversationId);
            isFirstTurnInConversation = currentConvo?.messages.length === 0;
        }

        setError(null);
        setIsLoading(true);
        isCancelledRef.current = false;
        
        responseStartTimeRef.current = Date.now();
        setElapsedTime(0);
        responseTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - responseStartTimeRef.current;
            setElapsedTime(elapsed);
        }, 53);

        const planningMessage: ChatMessageType = { id: crypto.randomUUID(), role: 'model', content: '', isPlanning: true, modelUsed: modelToUse };
        
        if (!isRetry) {
            const newUserMessage: ChatMessageType = { id: crypto.randomUUID(), role: 'user', content: fullPrompt, image: image, file: file, modelUsed: modelToUse };
            updateConversationMessages(currentConversationId, prev => [...prev, newUserMessage, planningMessage]);
        } else {
            updateConversationMessages(currentConversationId, prev => [...prev, planningMessage]);
        }

        let longToolUseTimer: ReturnType<typeof setTimeout> | null = null;
        let isImageAnalysisRequest = false;
        let isFileAnalysisRequest = false;

        try {
            const plan = await planResponse(fullPrompt, image, file, modelToUse);
            let developerContext: string | undefined = undefined;
            let personaContext: string | undefined = undefined;
            let capabilitiesContext: string | undefined = undefined;

            if (plan.isCreatorRequest) {
                developerContext = `My developer is ${developerProfile.name}. He is a ${developerProfile.age}-year-old from ${developerProfile.location}, and ${developerProfile.role} of ${developerProfile.appName}.`;
                personaContext = getPersonaContext();
            }

            if (plan.isCapabilitiesRequest) {
                capabilitiesContext = getCapabilitiesContext();
            }

            let isThinkingEnabled = plan.needsThinking;
            let isWebSearchEnabled = plan.needsWebSearch;
            let finalPromptForModel = fullPrompt;

            // Manual tool selection overrides the planner
            const toolOverrides: Partial<Record<Tool, () => void>> = {
                'urlReader': () => { plan.isUrlReadRequest = true; isWebSearchEnabled = false; isThinkingEnabled = false; isImageAnalysisRequest = false; },
                'thinking': () => { isThinkingEnabled = true; isWebSearchEnabled = false; plan.isUrlReadRequest = false; },
                'webSearch': () => { isWebSearchEnabled = true; isThinkingEnabled = false; plan.isUrlReadRequest = false; isImageAnalysisRequest = false; },
            };
            
            if (toolOverrides[selectedTool]) {
                toolOverrides[selectedTool]!();
            }
            
            isImageAnalysisRequest = !!image;
            isFileAnalysisRequest = !!file;

            let toolInUse: ChatMessageType['toolInUse'] = undefined;

            if (isImageAnalysisRequest) {
                isThinkingEnabled = false;
                plan.thoughts = [];
                // Start animation on the user's message
                updateConversationMessages(currentConversationId, prev =>
                    prev.map(m => m.id === prev[prev.length - 2]?.id ? { ...m, isAnalyzingImage: true } : m)
                );
            }

            if (isFileAnalysisRequest) {
                updateConversationMessages(currentConversationId, prev =>
                    prev.map(m => m.id === prev[prev.length - 2]?.id ? { ...m, isAnalyzingFile: true } : m)
                );
            }
            
            const handleToolError = (errorMessage: string) => {
                if (longToolUseTimer) clearTimeout(longToolUseTimer);
                setIsLongToolUse(false);
                updateConversationMessages(currentConversationId, prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    newMessages[newMessages.length - 1] = { ...lastMsg, toolInUse: undefined, isPlanning: false, content: `Sorry, I couldn't use that tool. Error: ${errorMessage}` };
                    return newMessages;
                });
                setIsLoading(false);
                stopResponseTimer();
            };
            
            longToolUseTimer = setTimeout(() => {
                setIsLongToolUse(true);
                updateConversationMessages(currentConversationId, prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'model') {
                        updated[updated.length - 1] = { ...last, isLongToolUse: true };
                    }
                    return updated;
                });
            }, 20000); // 20 seconds for any tool

            if (plan.isUrlReadRequest) {
                toolInUse = 'url';
                const urlMatch = fullPrompt.match(/(https?:\/\/[^\s]+)/);
                if (!urlMatch) {
                    return handleToolError("No valid URL found in your message.");
                }
                updateConversationMessages(currentConversationId, prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, isPlanning: false, toolInUse } : m));
                try {
                    const cleanedContent = await urlReaderService.fetchAndParseUrlContent(urlMatch[0]);
                    finalPromptForModel = `[URL: ${urlMatch[0]}]\n\n[EXTRACTED WEBPAGE CONTENT]:\n${cleanedContent}\n\n[USER QUESTION]:\n${fullPrompt}`;
                } catch (urlError: any) {
                    return handleToolError(urlError.message);
                }
            }


            updateConversationMessages(currentConversationId, prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1]?.isPlanning || newMessages[newMessages.length - 1]?.toolInUse) {
                    newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], isPlanning: false, toolInUse: undefined, thoughts: plan.thoughts };
                }
                return newMessages;
            });
            
            if (isThinkingEnabled && plan.thoughts.length > 0) {
                setIsThinking(true);
                thinkingTimeRef.current = 0;
                thinkingTimerRef.current = setInterval(() => {
                    thinkingTimeRef.current += 0.1;
                    updateConversationMessages(currentConversationId, prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last?.role === 'model') {
                            updated[updated.length-1] = {...last, thinkingDuration: thinkingTimeRef.current };
                        }
                        return updated;
                    });
                }, 100);
            }

            if (isWebSearchEnabled) {
                setIsSearchingWeb(true);
                if (plan.searchPlan && plan.searchPlan.length > 0) {
                     updateConversationMessages(currentConversationId, prev => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last?.role === 'model') {
                            updated[updated.length - 1] = { ...last, searchPlan: plan.searchPlan };
                        }
                        return updated;
                    });
                }
            }

            const currentConversationState = conversations.find(c => c.id === currentConversationId);
            const summary = currentConversationState?.summary;
            // Refine STM to last 10 turns (20 messages)
            const shortTermMemory = currentConversationState ? currentConversationState.messages.slice(-20) : [];
            
            let retrievedCodeSnippets: CodeSnippet[] = [];
            if (plan.needsCodeContext && codeMemory.length > 0) {
                const codeDescriptions = codeMemory.map(({ id, description }) => ({ id, description }));
                const relevantIds = await findRelevantCode(fullPrompt, codeDescriptions);
                retrievedCodeSnippets = codeMemory.filter(snippet => relevantIds.includes(snippet.id));
            }

            const modelName = models.find(m => m.id === modelToUse)?.name || 'Kalina AI';
            const chat = startChatSession(modelToUse, isThinkingEnabled, isWebSearchEnabled, modelName, ltm, userProfile, isFirstTurnInConversation, transformMessagesToHistory(shortTermMemory), summary, retrievedCodeSnippets, developerContext, personaContext, capabilitiesContext);

            const parts: Part[] = [
                ...(image ? [{ inlineData: { data: image.base64, mimeType: image.mimeType } }] : []),
                ...(file ? [{ inlineData: { data: file.base64, mimeType: file.mimeType } }] : []),
                ...(finalPromptForModel ? [{ text: finalPromptForModel }] : []),
            ];
            
            if (parts.length === 0) throw new Error("Cannot send an empty message.");
            
            const stream = await chat.sendMessageStream({ message: parts });
            
            // As soon as the stream starts, clear pre-computation states.
            if (longToolUseTimer) {
                clearTimeout(longToolUseTimer);
                setIsLongToolUse(false);
            }
            if (isThinkingEnabled) clearThinkingIntervals();
            if (isWebSearchEnabled) setIsSearchingWeb(false);
            if (isImageAnalysisRequest) {
                updateConversationMessages(currentConversationId, prev => prev.map(m => m.isAnalyzingImage ? { ...m, isAnalyzingImage: false } : m));
            }
            if (isFileAnalysisRequest) {
                updateConversationMessages(currentConversationId, prev => prev.map(m => m.isAnalyzingFile ? { ...m, isAnalyzingFile: false } : m));
            }

            let finalModelResponse = '';
            let titleExtracted = false;
            let usageMetadata: { promptTokenCount?: number; candidatesTokenCount?: number; } | undefined = undefined;

            for await (const chunk of stream) {
                if (isCancelledRef.current) {
                    updateConversationMessages(currentConversationId, prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.role === 'model') {
                            const updatedMessages = [...prev.slice(0, -1)];
                            updatedMessages.push({
                                ...lastMessage,
                                content: (lastMessage.content || '') + '\n\n*Response generation stopped.*'
                            });
                            return updatedMessages;
                        }
                        return prev;
                    });
                    break;
                }

                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                finalModelResponse += chunk.text;
                
                let displayContent = finalModelResponse;
                if (isFirstTurnInConversation) {
                    if (!titleExtracted) {
                        const titleMatch = displayContent.match(/^\s*TITLE:\s*([^\n]+)/);
                        if (titleMatch && titleMatch[1]) {
                            const currentTitle = titleMatch[1].trim();
                            updateConversation(currentConversationId, c => ({ ...c, title: currentTitle, isGeneratingTitle: false }));

                            if (displayContent.includes('\n')) {
                                titleExtracted = true;
                            }
                        } else if (displayContent.length > 50 && !displayContent.startsWith('TITLE:')) {
                            updateConversation(currentConversationId, c => ({ ...c, isGeneratingTitle: false }));
                            titleExtracted = true;
                        }
                    }
                    
                    displayContent = displayContent.replace(/^\s*TITLE:\s*[^\n]*\n?/, '');
                }

                const sources: GroundingChunk[] | undefined = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c);

                updateConversationMessages(currentConversationId, prevMessages => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage?.role === 'model') {
                        const updatedMessages = [...prevMessages];
                        updatedMessages[prevMessages.length - 1] = { ...lastMessage, content: displayContent, sources, isPlanning: false };
                        return updatedMessages;
                    }
                    // This case handles adding the very first model message chunk
                    return [...prevMessages, { id: crypto.randomUUID(), role: 'model', content: displayContent, sources }];
                });
            }

            if (usageMetadata) {
                updateConversationMessages(currentConversationId, prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'model') {
                        const totalPromptTokens = usageMetadata.promptTokenCount || 0;
                        const outputTokens = usageMetadata.candidatesTokenCount;
                        const userTextTokens = estimateTokens(fullPrompt);

                        // If a tool that adds significant content to the prompt was used (image, url, search), show the total prompt tokens to reflect the tool's cost.
                        // Otherwise (for normal chat or creator requests), only show the user's text tokens to hide history/system prompt cost.
                        const toolUsed = toolInUse || isImageAnalysisRequest || isFileAnalysisRequest || isWebSearchEnabled;
                        const displayInputTokens = toolUsed ? totalPromptTokens : userTextTokens;
                        const systemTokens = toolUsed ? 0 : totalPromptTokens - userTextTokens;

                        return [...prev.slice(0, -1), { 
                            ...lastMessage, 
                            inputTokens: displayInputTokens, 
                            outputTokens: outputTokens,
                            systemTokens: systemTokens > 0 ? systemTokens : undefined,
                        }];
                    }
                    return prev;
                });
            }

            const finalCleanedResponse = finalModelResponse.replace(/^\s*TITLE:\s*[^\n]*\n?/, '');
            const finalConversationState = conversations.find(c => c.id === currentConversationId);
            if (finalConversationState && !isCancelledRef.current) {
                 // Generate episodic summary every ~15 turns (30 messages)
                if (finalConversationState.messages.length > 1 && finalConversationState.messages.length % 30 === 0) {
                    summarizeConversation(transformMessagesToHistory(finalConversationState.messages.slice(-30)), finalConversationState.summary)
                        .then(newSummary => updateConversation(currentConversationId, c => ({...c, summary: newSummary })));
                }

                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let match;
                const codeContextForSaving = transformMessagesToHistory(finalConversationState.messages.slice(-2));
                while ((match = codeBlockRegex.exec(finalCleanedResponse)) !== null) {
                    const capturedMatch = match;
                    processAndSaveCode({ language: capturedMatch[1] || 'text', code: capturedMatch[2] }, codeContextForSaving)
                        .then(result => setCodeMemory(prev => [...prev, { id: crypto.randomUUID(), ...result, language: capturedMatch[1] || 'text', code: capturedMatch[2] }]));
                }

                if (finalCleanedResponse.trim()) {
                    updateMemory([{ role: 'user', parts: [{ text: fullPrompt }] }, { role: 'model', parts: [{ text: finalCleanedResponse }] }], ltm, userProfile, modelToUse)
                        .then(memoryResult => {
                            const { newMemories, updatedMemories, userProfileUpdates } = memoryResult;
                            
                            let ltmAfterUpdates = [...ltm];
                            let memoryWasModified = false;

                            // Process updates
                            if (updatedMemories && updatedMemories.length > 0) {
                                updatedMemories.forEach(update => {
                                    const index = ltmAfterUpdates.findIndex(mem => mem === update.old_memory);
                                    if (index !== -1) {
                                        ltmAfterUpdates[index] = update.new_memory;
                                        memoryWasModified = true;
                                    }
                                });
                            }

                            // Process additions
                            if (newMemories && newMemories.length > 0) {
                                const uniqueNewMemories = newMemories.filter(mem => !ltmAfterUpdates.includes(mem));
                                if (uniqueNewMemories.length > 0) {
                                    ltmAfterUpdates.push(...uniqueNewMemories);
                                    memoryWasModified = true;
                                }
                            }
                            
                            if (memoryWasModified) {
                                setLtm(ltmAfterUpdates);
                                updateConversationMessages(currentConversationId, prev => {
                                    const last = prev[prev.length - 1];
                                    return last?.role === 'model' ? [...prev.slice(0, -1), { ...last, memoryUpdated: true }] : prev;
                                });
                            }
                            
                            // Update user profile
                            if (userProfileUpdates.name && userProfileUpdates.name !== userProfile.name) {
                                setUserProfile(prev => ({ ...prev, name: userProfileUpdates.name }));
                            }
                        });
                }
            }
        } catch (e: any) {
            logError(e);
            const friendlyError = getFriendlyErrorMessage(e);
            setError(friendlyError);
            updateConversationMessages(currentConversationId, prev => {
                if (prev.length === 0) return prev;
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = { ...lastMessage, isPlanning: false, toolInUse: undefined, content: `Sorry, I encountered an error: ${friendlyError.message}` };
                if (lastMessage.role === 'user') {
                    newMessages.push({ id: crypto.randomUUID(), role: 'model', content: `Sorry, I encountered an error: ${friendlyError.message}` });
                }
                return newMessages;
            });
        } finally {
            if (longToolUseTimer) clearTimeout(longToolUseTimer);
            setIsLongToolUse(false);
            
            // Robustly clear any lingering analysis flags
            if (currentConversationId) {
                updateConversationMessages(currentConversationId, prev =>
                    prev.map(m => {
                        const { isAnalyzingImage, isAnalyzingFile, ...rest } = m;
                        return rest;
                    })
                );
            }

            const finalElapsedTime = Date.now() - responseStartTimeRef.current;
            stopResponseTimer();
            
            if (currentConversationId && !isCancelledRef.current) {
                updateConversationMessages(currentConversationId, prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        const isError = lastMessage.content?.startsWith("Sorry, I encountered an error:");
                        if (!isError) {
                            return [...prev.slice(0, -1), { ...lastMessage, generationTime: finalElapsedTime }];
                        }
                    }
                    return prev;
                });
            }

            setIsLoading(false);
            clearThinkingIntervals();
            setIsSearchingWeb(false);
            setActiveSuggestion(null);
            isCancelledRef.current = false;
        }
    }, [
        apiKey, isLoading, activeConversationId, conversations, selectedChatModel, selectedTool, ltm, codeMemory, userProfile,
        setConversations, setActiveConversationId, setError, setIsLoading, updateConversationMessages, 
        updateConversation, setCodeMemory, setLtm, setUserProfile, setActiveSuggestion, clearThinkingIntervals, stopResponseTimer, logError
    ]);

    const handleUpdateMessageContent = (messageId: string, newContent: string) => {
        if (!activeConversationId) return;
        updateConversationMessages(activeConversationId, prev => 
            prev.map(msg => 
                msg.id === messageId ? { ...msg, content: newContent } : msg
            )
        );
    };

    return {
        isLoading,
        isThinking,
        isSearchingWeb,
        error,
        elapsedTime,
        setError,
        setIsLoading,
        setIsThinking,
        setIsSearchingWeb,
        clearThinkingIntervals,
        handleSendMessage,
        handleUpdateMessageContent,
        handleCancelStream,
    };
};