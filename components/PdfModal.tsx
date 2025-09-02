import React from 'react';
import { X } from 'lucide-react';

interface PdfModalProps {
    base64: string;
    mimeType: string;
    onClose: () => void;
}

const PdfModal: React.FC<PdfModalProps> = ({ base64, mimeType, onClose }) => (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 id="pdf-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200">PDF Preview</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close PDF view"
            >
              <X className="h-5 w-5" />
            </button>
        </div>
        <div className="flex-1 overflow-hidden">
             <iframe
                src={`data:${mimeType};base64,${base64}`}
                title="PDF Viewer"
                className="w-full h-full border-none"
            />
        </div>
      </div>
    </div>
);

export default PdfModal;