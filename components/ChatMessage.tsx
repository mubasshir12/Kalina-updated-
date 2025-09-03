
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import UserMessage from './message/UserMessage';
import ModelMessage from './message/ModelMessage';

interface ChatMessageProps extends ChatMessageType {
  isStreaming?: boolean;
  isThinking?: boolean;
  isSearchingWeb?: boolean;
  isReadingUrl?: boolean;
  isLongUrlRead?: boolean;
  onRetry?: () => void;
  index: number;
  onEditMessage?: (index: number, newContent: string) => void;
  onUpdateMessageContent: (messageId: string, newContent: string) => void;
  isSpeaking?: boolean;
  onToggleAudio?: (id: string, text: string) => void;
  onCancelStream?: () => void;
  setModalImage: (url: string | null) => void;
  setImageToDownload: (base64: string | null) => void;
  setCodeForPreview: (data: { code: string; language: string; onFix: (newCode: string) => void; } | null) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = (props) => {
  const isUser = props.role === 'user';

  return (
    <>
      {isUser ? (
        <UserMessage {...props} />
      ) : (
        <ModelMessage {...props} />
      )}
    </>
  );
};

export default ChatMessage;
