import { useState, useEffect, useRef } from 'react';

const CHARS_PER_CHUNK = 10; // How many characters to add per animation frame

/**
 * A custom hook to smoothly animate the revealing of streaming text.
 * Instead of a character-by-character "typing" effect, it renders text in
 * small chunks within a requestAnimationFrame loop. This provides a much
 * smoother and faster visual effect, similar to modern AI chatbots,
 * preventing the "laggy" feel of slow typing animations.
 *
 * @param {string} targetText - The final text string that should be displayed.
 * @param {boolean} isStreaming - A flag indicating if the text is still streaming.
 * @returns {string} The portion of the text that should be currently displayed.
 */
export const useSmoothStream = (targetText: string, isStreaming: boolean): string => {
    const [displayedText, setDisplayedText] = useState('');
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        // When streaming stops, immediately snap to the final text.
        if (!isStreaming) {
            setDisplayedText(targetText);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            return;
        }

        // If the target text resets or changes drastically (e.g., a retry), reset the display.
        if (targetText.length < displayedText.length) {
            setDisplayedText(targetText);
            return;
        }
        
        // Only start a new animation loop if one isn't already running.
        if (animationFrameId.current === null && displayedText.length < targetText.length) {
            const animate = () => {
                setDisplayedText(current => {
                    // If we've caught up to the target, stop the animation.
                    if (current.length >= targetText.length) {
                        animationFrameId.current = null;
                        return targetText;
                    }
                    
                    // Add the next chunk of characters.
                    const nextLength = Math.min(current.length + CHARS_PER_CHUNK, targetText.length);
                    
                    // Request the next frame if there's still text to display.
                    if (nextLength < targetText.length) {
                        animationFrameId.current = requestAnimationFrame(animate);
                    } else {
                        animationFrameId.current = null;
                    }
                    
                    return targetText.substring(0, nextLength);
                });
            };
            animationFrameId.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [targetText, isStreaming, displayedText.length]);

    return displayedText;
};
