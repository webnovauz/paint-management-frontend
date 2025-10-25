import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// Компонент загрузки
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
}

// Компонент для состояния загрузки страницы
export function PageLoading({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Компонент ошибки
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ 
  title = 'Ошибка', 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент для состояния ошибки страницы
export function PageError({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <ErrorMessage
        title="Не удалось загрузить данные"
        message={message}
        onRetry={onRetry}
        className="max-w-md"
      />
    </div>
  );
}

// Компонент кнопки с состоянием загрузки
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText = 'Загрузка...', 
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center space-x-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}