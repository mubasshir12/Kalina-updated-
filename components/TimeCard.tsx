import React from 'react';
import { TimeData } from '../types';
import { Clock } from 'lucide-react';

const TimeCard: React.FC<{ data: TimeData }> = ({ data }) => {
    // Ensure time is a string before processing to prevent crashes.
    const timeString = typeof data.time === 'string' ? data.time : '';
    
    // Extracting AM/PM for styling, if present
    const amPmMatch = timeString.match(/\s(AM|PM)/i);
    const timeWithoutAmPm = amPmMatch ? timeString.replace(amPmMatch[0], '') : timeString;
    const amPm = amPmMatch ? amPmMatch[1] : '';

    return (
        <div className="relative my-4 p-5 sm:p-6 rounded-2xl text-white overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-7-00 shadow-lg w-full max-w-sm border border-white/10 animate-fade-in-timecard">
            <style>{`
                @keyframes fade-in-timecard {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in-timecard { animation: fade-in-timecard 0.5s ease-out forwards; }
                .time-text-shadow { text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
                .flicker { animation: flicker-animation 1s infinite; }
                @keyframes flicker-animation {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
            `}</style>
            
            <div className="absolute top-4 right-4 text-white/50">
                <Clock className="w-8 h-8" />
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline time-text-shadow">
                    <p className="text-5xl sm:text-6xl font-bold tracking-tighter">
                        {timeWithoutAmPm}
                    </p>
                    {amPm && <span className="text-2xl sm:text-3xl font-semibold ml-2">{amPm}</span>}
                </div>

                <p className="mt-2 text-sm sm:text-base opacity-90">{data.date || ''}</p>
                
                <p className="mt-4 pt-3 border-t border-white/20 text-xs sm:text-sm opacity-70">{data.timezone || ''}</p>
            </div>
        </div>
    );
};

export default TimeCard;