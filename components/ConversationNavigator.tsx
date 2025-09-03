import React from 'react';

interface ConversationNavigatorProps {
    userMessageIndices: number[];
    activeMessageIndex: number | null;
    onDotClick: (index: number) => void;
}

const ConversationNavigator: React.FC<ConversationNavigatorProps> = ({ userMessageIndices, activeMessageIndex, onDotClick }) => {
    if (userMessageIndices.length < 2) {
        return null; // Don't show for very short conversations
    }

    return (
        <div className="absolute top-0 right-0 h-full flex items-center pr-1 md:pr-2 z-10">
            <div className="flex flex-col items-center justify-center gap-4 h-auto" role="navigation" aria-label="Conversation progress">
                {userMessageIndices.map(index => (
                    <button
                        key={index}
                        onClick={() => onDotClick(index)}
                        className="w-2 h-6 rounded-lg transition-all duration-300 ease-in-out"
                        style={{
                            backgroundColor: activeMessageIndex === index ? 'var(--color-active)' : 'var(--color-inactive)',
                            transform: activeMessageIndex === index ? 'scaleY(1.2) scaleX(1.1)' : 'scale(1)',
                        }}
                        aria-label={`Go to message ${index + 1}`}
                        aria-current={activeMessageIndex === index}
                    />
                ))}
            </div>
            <style>{`
                :root {
                    --color-active: #f59e0b; /* amber-600 */
                    --color-inactive: #e5e5e5; /* neutral-300 */
                }
                .dark {
                    --color-active: #fbbf24; /* amber-400 */
                    --color-inactive: #525252; /* neutral-600 */
                }
            `}</style>
        </div>
    );
};

export default ConversationNavigator;