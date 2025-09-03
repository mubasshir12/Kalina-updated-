import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';

interface ChatHistoryProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isThinking: boolean;
  isSearchingWeb: boolean;
  onRetry: () => void;
  onEditMessage: (index: number, newContent: string) => void;
  onUpdateMessageContent: (messageId: string, newContent: string) => void;
  speakingMessageId: string | null;
  onToggleAudio: (id: string, text: string) => void;
  onCancelStream: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onOpenCodePreview: (code: string, language: string, messageId: string, originalCode: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, isThinking, isSearchingWeb, onRetry, onEditMessage, onUpdateMessageContent, speakingMessageId, onToggleAudio, onCancelStream, scrollContainerRef, onOpenCodePreview }) => {
  const lastMessageRef = useRef<HTMLDivElement>(null);
  // Using a ref is more performant as it doesn't trigger re-renders on scroll.
  const userHasScrolledUpRef = useRef(false);

  // This single effect manages both user scrolling and auto-scrolling during streaming.
  useEffect(() => {
    const scrollable = scrollContainerRef.current;
    if (!scrollable) return;

    // Function to update our ref based on the user's scroll position.
    const handleScroll = () => {
      // A generous buffer helps prevent unintended locking/unlocking.
      const atBottom = scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight < 100;
      userHasScrolledUpRef.current = !atBottom;
    };

    scrollable.addEventListener('scroll', handleScroll, { passive: true });
    
    let observer: MutationObserver | undefined;
    // Only set up the observer if a response is actively streaming.
    if (isLoading && lastMessageRef.current) {
      observer = new MutationObserver(() => {
        // If the user hasn't scrolled up, scroll to the bottom instantly.
        // 'auto' behavior is crucial here to avoid jank from rapid 'smooth' scrolls.
        if (!userHasScrolledUpRef.current) {
          scrollable.scrollTo({ top: scrollable.scrollHeight, behavior: 'auto' });
        }
      });
      observer.observe(lastMessageRef.current, { childList: true, subtree: true });
    }

    // Cleanup: remove the event listener and disconnect the observer.
    return () => {
      scrollable.removeEventListener('scroll', handleScroll);
      if (observer) {
        observer.disconnect();
      }
    };
    // This effect re-runs when `isLoading` changes, attaching/detaching the observer as needed.
  }, [isLoading, scrollContainerRef]);


  return (
    <div className="space-y-6 pb-2">
      {messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const canRetry = isLastMessage && msg.role === 'model' && !isLoading && !isThinking && !msg.isGeneratingImage && !msg.isPlanning;
        const isStreamingNow = isLoading && isLastMessage && !msg.isGeneratingImage && !msg.isPlanning && !msg.isEditingImage;
        
        return (
          <div key={msg.id} ref={isLastMessage ? lastMessageRef : null}>
            <ChatMessage
              {...msg}
              isStreaming={isStreamingNow}
              isThinking={isThinking && index === messages.length - 1}
              isSearchingWeb={isSearchingWeb && index === messages.length - 1}
              onRetry={canRetry ? onRetry : undefined}
              index={index}
              onEditMessage={msg.role === 'user' ? onEditMessage : undefined}
              onUpdateMessageContent={onUpdateMessageContent}
              isSpeaking={msg.id === speakingMessageId}
              onToggleAudio={onToggleAudio}
              onCancelStream={isStreamingNow ? onCancelStream : undefined}
              onOpenCodePreview={onOpenCodePreview}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatHistory;