import React from 'react';

export type ChatModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';
export type Tool = 'smart' | 'webSearch' | 'thinking' | 'translator' | 'urlReader' | 'weather' | 'maps';
export type View = 'chat' | 'memory' | 'translator' | 'usage';

export type MessageRole = 'user' | 'model';

export interface ModelInfo {
  id: ChatModel;
  name: string;
  description: string;
}

export interface Web {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: Web;
}

export interface ThoughtStep {
  phase: string;
  step: string;
  concise_step: string;
}

export interface Location {
  name: string;
  details: string;
  lat: number;
  lon: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  image?: {
      base64: string;
      mimeType: string;
  };
  file?: {
      base64: string;
      mimeType: string;
      name: string;
      size: number;
  };
  modelUsed?: ChatModel;
  sources?: GroundingChunk[];
  thoughts?: ThoughtStep[];
  searchPlan?: ThoughtStep[];
  thinkingDuration?: number;
  isAnalyzingImage?: boolean;
  isAnalyzingFile?: boolean;
  isPlanning?: boolean;
  toolInUse?: 'url' | 'weather' | 'maps';
  isLongToolUse?: boolean;
  memoryUpdated?: boolean;
  inputTokens?: number; // User prompt tokens
  outputTokens?: number; // Model response tokens
  // FIX: Add systemTokens to track tokens from system instructions, history, etc. This resolves an error in UsageStatsView.
  systemTokens?: number;
  generationTime?: number;
}

export interface AppError {
    message: string;
}

export interface Suggestion {
  text: string;
  prompt: string;
  icon?: React.ReactNode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  isPinned?: boolean;
  isGeneratingTitle?: boolean;
  summary?: string;
}

// User Profile for persistent user-specific info.
export interface UserProfile {
  name: string | null;
}

// Long-Term Memory: A global list of important facts.
export type LTM = string[];

export interface CodeSnippet {
  id: string;
  description: string;
  language: string;
  code: string;
}

export interface ConsoleLog {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// Types for the Developer Console
export type ConsoleMode = 'auto' | 'manual';

export interface ConsoleLogEntry {
    id: string;
    timestamp: string;
    message: string;
    stack?: string;
}