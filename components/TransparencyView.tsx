import React from 'react';
import { ArrowLeft, Brain, KeyRound, Database, Info, Sparkles } from 'lucide-react';

interface TransparencyViewProps {
    onBack: () => void;
}

const InfoCard: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-[#2E2F33] p-6 rounded-xl border border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-4 mb-3">
            <Icon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        </div>
        <div className="space-y-2 text-gray-600 dark:text-gray-400 leading-relaxed">
            {children}
        </div>
    </div>
);


const TransparencyView: React.FC<TransparencyViewProps> = ({ onBack }) => {
    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-[#131314]">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-2 md:mr-4" aria-label="Back to chat">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">Transparency & About</h1>
                </div>

                <div className="space-y-6">
                    <InfoCard icon={Sparkles} title="How Kalina AI Works">
                        <p>
                            Kalina AI is an intelligent chat interface designed to provide a seamless and powerful user experience. At its core, it connects to Google's advanced AI models to understand your requests and generate responses.
                        </p>
                        <p>
                            When you send a message, the app determines the best tool for the job—whether it's searching the web, generating code, creating an image, or just having a conversation—and then communicates with the appropriate Google AI service.
                        </p>
                    </InfoCard>

                    <InfoCard icon={Brain} title="Powered by Google Gemini">
                        <p>
                            This application is powered by the Google Gemini family of models. We use these state-of-the-art models for text generation, analysis, image creation, and more. All the "thinking" and content generation is performed by Google's AI, and this app provides the user-friendly interface to interact with it.
                        </p>
                    </InfoCard>

                    <InfoCard icon={KeyRound} title="Your API Key & Privacy">
                        <p>
                            To use the app, you need to provide your own Google Gemini API key. This key is your personal access pass to Google's AI services.
                        </p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                            Your privacy is paramount. Your API key is stored securely and exclusively in your browser's local storage. It is never sent to our servers or seen by anyone else. It is only used to make direct calls from your browser to the Google AI API.
                        </p>
                    </InfoCard>
                    
                    <InfoCard icon={Database} title="What are Tokens?">
                        <p>
                           "Tokens" are the units that Google uses to measure the amount of text processed by the AI model. Think of them as pieces of words. Everything you type (your prompt) and everything the AI generates (the response) consumes tokens.
                        </p>
                        <p>
                            Managing your API key means you are in full control of your usage. You can monitor your token consumption in the <span className="font-semibold text-indigo-500 dark:text-indigo-400">Usage Dashboard</span>.
                        </p>
                    </InfoCard>

                    <InfoCard icon={Info} title="About This App">
                        <p>
                            This application was brought to life by <span className="font-bold text-gray-800 dark:text-gray-200">Mubasshir</span> through a process of prompt engineering and iterative instructions.
                        </p>
                        <p>
                            While not a traditional developer, Mubasshir directed the creation of this app using <span className="font-semibold text-gray-700 dark:text-gray-300">AI Vibe Coding</span>, demonstrating the power of collaborating with AI to build functional and beautiful software.
                        </p>
                    </InfoCard>
                </div>
            </div>
        </main>
    );
};

export default TransparencyView;