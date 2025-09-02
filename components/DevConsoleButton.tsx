
import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { subscribeToLogs } from '../services/loggingService';

interface DevConsoleButtonProps {
    onClick: () => void;
    isVisible: boolean;
}

const DevConsoleButton: React.FC<DevConsoleButtonProps> = ({ onClick, isVisible }) => {
    const [errorCount, setErrorCount] = useState(0);
    const [position, setPosition] = useState({ x: window.innerWidth - 70, y: window.innerHeight - 70 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

    useEffect(() => {
        const unsubscribe = subscribeToLogs(logs => {
            setErrorCount(logs.filter(log => log.level === 'error').length);
        });
        return () => unsubscribe();
    }, []);

    const onDragStart = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragInfo.current = {
            isDragging: true,
            startX: clientX,
            startY: clientY,
            initialX: position.x,
            initialY: position.y
        };
        
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove);
        window.addEventListener('touchend', onDragEnd);
    };

    const onDragMove = (e: MouseEvent | TouchEvent) => {
        if (!dragInfo.current.isDragging) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragInfo.current.startX;
        const dy = clientY - dragInfo.current.startY;
        
        const newX = dragInfo.current.initialX + dx;
        const newY = dragInfo.current.initialY + dy;

        const buttonWidth = buttonRef.current?.offsetWidth || 48;
        const buttonHeight = buttonRef.current?.offsetHeight || 48;

        const constrainedX = Math.max(8, Math.min(newX, window.innerWidth - buttonWidth - 8));
        const constrainedY = Math.max(8, Math.min(newY, window.innerHeight - buttonHeight - 8));

        setPosition({ x: constrainedX, y: constrainedY });
    };

    const onDragEnd = (e: MouseEvent | TouchEvent) => {
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

        const dx = Math.abs(clientX - dragInfo.current.startX);
        const dy = Math.abs(clientY - dragInfo.current.startY);

        if (dx < 5 && dy < 5) {
            onClick();
        }

        dragInfo.current.isDragging = false;
        
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);
    };

    if (!isVisible) return null;

    return (
        <button
            ref={buttonRef}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{ 
                position: 'fixed', 
                left: `${position.x}px`, 
                top: `${position.y}px`, 
                cursor: dragInfo.current.isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
            }}
            className={`z-[9999] flex items-center justify-center h-12 w-12 rounded-full shadow-lg transition-colors duration-300 ${
                errorCount > 0 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-gray-800 text-white dark:bg-white dark:text-gray-900'
            }`}
            aria-label="Toggle Developer Console"
        >
            <Terminal className="h-6 w-6" />
            {errorCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-xs font-bold">
                    {errorCount}
                </span>
            )}
        </button>
    );
};

export default DevConsoleButton;
