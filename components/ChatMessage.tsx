
import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ImageModal from './ImageModal';
import ConfirmationModal from './ConfirmationModal';
import UserMessage from './message/UserMessage';
import ModelResponse from './message/ModelResponse';

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
}

const ChatMessage: React.FC<ChatMessageProps> = (props) => {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageToDownload, setImageToDownload] = useState<string | null>(null);

  const handleConfirmDownload = () => {
    if (!imageToDownload) return;
    const imageUrl = `data:image/png;base64,${imageToDownload}`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `kalina-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUser = props.role === 'user';
  const messageId = `message-${props.index}`;

  return (
    <>
      {modalImage && <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />}
      <ConfirmationModal
        isOpen={imageToDownload !== null}
        onClose={() => setImageToDownload(null)}
        onConfirm={handleConfirmDownload}
        title="Confirm Download"
        message="Do you want to download this image?"
        confirmButtonText="Download"
      />
      <div id={messageId} className={isUser ? 'flex justify-end' : 'w-full'}>
        {isUser ? (
          <UserMessage {...props} setModalImage={setModalImage} />
        ) : (
          <ModelResponse {...props} setModalImage={setModalImage} setImageToDownload={setImageToDownload} />
        )}
      </div>
    </>
  );
};

export default ChatMessage;
