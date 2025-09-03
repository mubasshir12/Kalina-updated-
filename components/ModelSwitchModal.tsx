import React from 'react';
import { Zap } from 'lucide-react';

interface ModelSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onDecline: () => void;
}

const ModelSwitchModal: React.FC<ModelSwitchModalProps> = ({ isOpen, onClose, onConfirm, onDecline }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" onClick={onClose}>
            <div className="bg-white dark:bg-dark-sheet rounded-2xl shadow-xl w-full max-w-md transform transition-all" role="dialog" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 sm:mx-0">
                            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="mt-0 text-left">
                            <h3 className="text-lg leading-6 font-semibold text-neutral-900 dark:text-white" id="modal-title">
                                Model Recommendation
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-neutral-500 dark:text-gray-400">
                                    For coding-related tasks, our Pro model provides significantly better performance and accuracy. Would you like to switch for this request?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-neutral-50 dark:bg-gray-900/50 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                        type="button"
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-neutral-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-neutral-700 dark:text-gray-200 hover:bg-neutral-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-dark-sheet focus:ring-amber-500"
                        onClick={onDecline}
                    >
                        Continue with Flash
                    </button>
                    <button
                        type="button"
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-dark-sheet focus:ring-amber-500"
                        onClick={onConfirm}
                    >
                        Switch to Pro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelSwitchModal;