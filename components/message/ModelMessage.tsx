
import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import MessageContent from './MessageContent';
import MessageToolbar from './MessageToolbar';
import MessageMetadata from './MessageMetadata';

interface ModelMessageProps extends ChatMessageType {
    setModalImage: (url: string | null) => void;
    setImageToDownload: (base64: string | null) => void;
    isStreaming?: boolean;
    isThinking?: boolean;
    isSearchingWeb?: boolean;
    onRetry?: () => void;
    index: number;
    onUpdateMessageContent: (messageId: string, newContent: string) => void;
    isSpeaking?: boolean;
    onToggleAudio?: (id: string, text: string) => void;
    setCodeForPreview: (data: { code: string; language: string; onFix: (newCode: string) => void; } | null) => void;
}

const ModelMessage: React.FC<ModelMessageProps> = (props) => {
    const showToolbar = !props.isStreaming && (props.content || (props.generatedImagesBase64 && props.generatedImagesBase64.length > 0));
    const showMetadata = !props.isStreaming && (props.modelUsed || typeof props.inputTokens === 'number' || typeof props.outputTokens === 'number' || (props.generationTime && props.generationTime > 0));

    return (
        <div id={`message-${props.index}`} className="w-full">
            <MessageContent {...props} />
            {showToolbar && <MessageToolbar {...props} />}
            {showMetadata && <MessageMetadata {...props} />}
        </div>
    );
};

export default ModelMessage;
