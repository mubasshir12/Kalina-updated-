import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ApiKeyErrorScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg text-neutral-800 dark:text-white items-center justify-center p-4 text-center">
      <div className="max-w-md">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-gray-200">API Key Not Configured</h1>
        <p className="mt-2 text-neutral-600 dark:text-gray-400">
          The Gemini API key is missing. Please add your API key to the <code className="bg-neutral-200 dark:bg-gray-700 p-1 rounded-md text-sm">.env</code> file in the project root.
        </p>
        <div className="mt-6 text-left bg-neutral-100 dark:bg-dark-sheet p-4 rounded-lg">
          <p className="text-sm font-mono text-neutral-700 dark:text-gray-300">
            <span className="select-none"># .env</span><br />
            API_KEY=your_gemini_api_key_here
          </p>
        </div>
        <p className="mt-4 text-xs text-neutral-500 dark:text-gray-400">
          After adding the key, you may need to restart the application.
        </p>
         <div className="mt-4">
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-amber-500 dark:text-amber-400 hover:underline">
                Get your API key from Google AI Studio
            </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyErrorScreen;