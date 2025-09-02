
import React from 'react';
import { File, FileText, Presentation } from 'lucide-react';

export const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/^#+\s/gm, '') // Remove heading markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/^\s*[-*]\s+/gm, '') // Remove unordered list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove ordered list markers
    .replace(/\[\d+\]/g, '') // Remove citations
    .trim();
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes < k) {
        return `${bytes} ${sizes[0]}`;
    }
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncateFileName = (fullName: string, maxLength: number = 20): string => {
    if (fullName.length <= maxLength) {
        return fullName;
    }
    const extensionIndex = fullName.lastIndexOf('.');
    const extension = extensionIndex !== -1 ? fullName.substring(extensionIndex) : '';
    const name = extensionIndex !== -1 ? fullName.substring(0, extensionIndex) : fullName;

    const charsToKeep = maxLength - extension.length - 3; // 3 for "..."
    if (charsToKeep <= 0) {
        return `...${extension}`;
    }

    const truncatedName = name.substring(0, charsToKeep);
    return `${truncatedName}...${extension}`;
};

// FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
export const FileIcon: React.FC<{ mimeType: string }> = ({ mimeType }) => {
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return React.createElement(Presentation, { className: "h-5 w-5 flex-shrink-0" });
    }
    if (mimeType.includes('pdf')) {
        return React.createElement(FileText, { className: "h-5 w-5 flex-shrink-0" });
    }
    if (mimeType.includes('plain')) {
        return React.createElement(FileText, { className: "h-5 w-5 flex-shrink-0" });
    }
    return React.createElement(File, { className: "h-5 w-5 flex-shrink-0" });
};
