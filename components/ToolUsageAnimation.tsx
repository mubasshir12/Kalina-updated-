import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

const urlMessages = [
    "Accessing the provided URL...",
    "Fetching page content securely...",
    "Analyzing the page layout...",
    "Extracting key information...",
    "Ignoring ads and navigation...",
    "Preparing the content for AI analysis...",
];

const weatherMessages = [
    "Contacting weather satellites...",
    "Fetching real-time atmospheric data...",
    "Analyzing local weather patterns...",
    "Compiling the forecast...",
    "Checking for weather alerts...",
];

const mapsMessages = [
    "Accessing satellite network...",
    "Triangulating position...",
    "Querying location database...",
    "Plotting nearby points of interest...",
    "Rendering map...",
];

interface ToolUsageAnimationProps {
    toolInUse: 'url' | 'weather' | 'maps';
    isLongToolUse?: boolean;
}

const ToolUsageAnimation: React.FC<ToolUsageAnimationProps> = ({ toolInUse, isLongToolUse }) => {
    const messages = toolInUse === 'url' ? urlMessages : toolInUse === 'weather' ? weatherMessages : mapsMessages;
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
                setIsFading(false);
            }, 500);
        }, 2500);
        return () => clearInterval(interval);
    }, [messages]);

    const urlAnimationMarkup = (
        <>
            <style>{`
            .scanner-container { width: 100px; height: 100px; position: relative; overflow: hidden; }
            .document-icon { width: 60px; height: 70px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #f5f5f5; border-radius: 8px; border: 2px solid #a3a3a3; }
            .dark .document-icon { background-color: #374151; border-color: #6b7280; }
            .document-line { position: absolute; left: 10px; right: 10px; height: 3px; background-color: #a3a3a3; border-radius: 2px; }
            .dark .document-line { background-color: #6b7280; }
            .document-line:nth-child(1) { top: 15px; } .document-line:nth-child(2) { top: 25px; width: 80%; }
            .document-line:nth-child(3) { top: 35px; width: 90%; } .document-line:nth-child(4) { top: 45px; }
            .scanner-beam { position: absolute; top: -10%; left: 0; right: 0; height: 5px; background-color: #fbbf24; box-shadow: 0 0 10px 2px #fbbf24; border-radius: 5px; animation: scan 3s ease-in-out infinite; }
            .dark .scanner-beam { background-color: #fcd34d; box-shadow: 0 0 10px 2px #fcd34d; }
            @keyframes scan { 0%, 100% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100px); } }
            `}</style>
             <div className="scanner-container">
                <div className="document-icon">
                    <div className="document-line"></div> <div className="document-line"></div>
                    <div className="document-line"></div> <div className="document-line"></div>
                </div>
                <div className="scanner-beam"></div>
            </div>
        </>
    );

    const weatherAnimationMarkup = (
        <>
            <style>{`
            .weather-container { width: 100px; height: 100px; position: relative; }
            .cloud { position: absolute; background: #e5e7eb; border-radius: 50%; animation: float 4s ease-in-out infinite alternate; }
            .dark .cloud { background: #4b5563; }
            .cloud.front { width: 60px; height: 60px; top: 30px; left: 20px; z-index: 2; animation-delay: -2s; }
            .cloud.back { width: 50px; height: 50px; top: 40px; left: 45px; z-index: 1; opacity: 0.8; }
            .cloud::before, .cloud::after { content: ''; position: absolute; background: #e5e7eb; border-radius: 50%; }
            .dark .cloud::before, .dark .cloud::after { background: #4b5563; }
            .cloud.front::before { width: 35px; height: 35px; top: -15px; left: 10px; }
            .cloud.front::after { width: 40px; height: 40px; top: 0px; right: -15px; }
            .sun { position: absolute; width: 30px; height: 30px; background: #facc15; border-radius: 50%; top: 20px; left: 55px; z-index: 0; animation: spin-sun 10s linear infinite, pulse-sun 2s ease-in-out infinite alternate; box-shadow: 0 0 15px #facc15; }
            .dark .sun { background: #fde047; box-shadow: 0 0 15px #fde047; }
            @keyframes float { from { transform: translateY(-5px); } to { transform: translateY(5px); } }
            @keyframes spin-sun { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse-sun { from { transform: scale(1); } to { transform: scale(1.1); } }
            `}</style>
            <div className="weather-container">
                <div className="sun"></div>
                <div className="cloud front"></div>
                <div className="cloud back"></div>
            </div>
        </>
    );

    const mapAnimationMarkup = (
        <div className="flex items-center justify-center w-[100px] h-[100px]">
            <MapPin className="h-12 w-12 text-amber-500 animate-pulse" />
        </div>
    );

    const animationForTool = () => {
        switch(toolInUse) {
            case 'url': return urlAnimationMarkup;
            case 'weather': return weatherAnimationMarkup;
            case 'maps': return mapAnimationMarkup;
            default: return null;
        }
    }

    return (
        <div className="flex flex-col items-center justify-center my-4 p-4 gap-6">
            <style>{`.message-container { min-height: 20px; }`}</style>
            {animationForTool()}
            <div className="message-container">
                <p className={`text-center text-sm text-neutral-500 dark:text-gray-400 transition-opacity duration-500 ${isFading && !isLongToolUse ? 'opacity-0' : 'opacity-100'}`}>
                    {isLongToolUse
                        ? "This is taking a bit longer than usual. Thanks for your patience!"
                        : messages[currentMessageIndex]}
                </p>
            </div>
        </div>
    );
};

export default ToolUsageAnimation;