import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const iconColor = type === 'danger' ? 'text-red-600' : 'text-yellow-600';
  const buttonColor = type === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-start p-6">
          <div className={`flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10`}>
            <AlertTriangle className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 flex flex-col sm:flex-row-reverse sm:space-x-reverse sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Выполняется...
              </div>
            ) : (
              confirmText
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Хук для удобного использования диалога подтверждения
export function useConfirm() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = React.useCallback((options: {
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
  }) => {
    setDialog({
      isOpen: true,
      ...options,
      isLoading: false,
    });
  }, []);

  const close = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setLoading = React.useCallback((isLoading: boolean) => {
    setDialog(prev => ({ ...prev, isLoading }));
  }, []);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      onClose={close}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      isLoading={dialog.isLoading}
    />
  ), [dialog, close]);

  return {
    confirm,
    close,
    setLoading,
    ConfirmDialog: ConfirmDialogComponent,
  };
}