import React, { useMemo } from 'react';
import { Conversation } from '../types';
import { ArrowLeft, MessageSquareText, LogIn, LogOut, Cpu } from 'lucide-react';

interface UsageStatsViewProps {
    conversations: Conversation[];
    onBack: () => void;
}

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string, colorClass: string }> = ({ icon: Icon, label, value, colorClass }) => (
    <div className="bg-white dark:bg-[#2E2F33] p-4 rounded-lg flex items-center gap-4">
        <div className={`p-2 rounded-full ${colorClass}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

const UsageStatsView: React.FC<UsageStatsViewProps> = ({ conversations, onBack }) => {
    
    const { grandTotal, conversationStats } = useMemo(() => {
        const grandTotal = {
            input: 0,
            output: 0,
            system: 0,
            total: 0,
            messageCount: 0,
        };

        const conversationStats = conversations.map(convo => {
            const stats = {
                id: convo.id,
                title: convo.title,
                input: 0,
                output: 0,
                system: 0,
                total: 0,
                messageCount: convo.messages.filter(m => m.role === 'model').length
            };

            convo.messages.forEach(msg => {
                if (msg.role === 'model') {
                    stats.input += msg.inputTokens || 0;
                    stats.output += msg.outputTokens || 0;
                    stats.system += msg.systemTokens || 0;
                }
            });
            stats.total = stats.input + stats.output + stats.system;
            
            grandTotal.input += stats.input;
            grandTotal.output += stats.output;
            grandTotal.system += stats.system;
            grandTotal.total += stats.total;
            grandTotal.messageCount += stats.messageCount;

            return stats;
        }).filter(s => s.total > 0); // Only show conversations with token usage

        return { grandTotal, conversationStats };
    }, [conversations]);

    const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-[#131314]">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-2 md:mr-4" aria-label="Back to chat">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Usage Statistics</h1>
                </div>

                <div className="bg-white dark:bg-[#1e1f22] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Grand Total</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Across {conversations.length} conversations</p>
                    </div>
                    <div className="p-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
                            <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatNumber(grandTotal.total)}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <StatCard icon={LogIn} label="Input Tokens" value={formatNumber(grandTotal.input)} colorClass="bg-blue-500" />
                           <StatCard icon={LogOut} label="Output Tokens" value={formatNumber(grandTotal.output)} colorClass="bg-green-500" />
                           <StatCard icon={Cpu} label="System Tokens" value={formatNumber(grandTotal.system)} colorClass="bg-yellow-500" />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">By Conversation</h2>
                    <div className="space-y-4">
                        {conversationStats.map(stats => (
                             <details key={stats.id} className="bg-white dark:bg-[#1e1f22] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group">
                                <summary className="p-4 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{stats.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.messageCount} responses</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatNumber(stats.total)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Tokens</p>
                                    </div>
                                </summary>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Input</p>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">{formatNumber(stats.input)}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Output</p>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">{formatNumber(stats.output)}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">System</p>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">{formatNumber(stats.system)}</p>
                                    </div>
                                </div>
                            </details>
                        ))}
                         {conversationStats.length === 0 && (
                             <div className="text-center text-gray-500 dark:text-gray-400 py-12 px-4 bg-white dark:bg-[#1e1f22] rounded-xl border border-gray-200 dark:border-gray-700">
                                <MessageSquareText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">No usage data yet.</h3>
                                <p className="text-sm">Start a conversation to see token usage statistics appear here.</p>
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default UsageStatsView;
