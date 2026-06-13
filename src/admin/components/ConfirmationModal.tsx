import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      default: return 'bg-purple-600 hover:bg-purple-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md liquid-glass p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
        <h3 className="text-xl font-bold q-text mb-2">{title}</h3>
        <p className="q-muted text-sm mb-8 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold q-muted hover:bg-black/5 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${getVariantStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
