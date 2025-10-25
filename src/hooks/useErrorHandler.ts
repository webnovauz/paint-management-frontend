import { useCallback } from 'react';

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((error: unknown): ApiError => {
    // Обработка различных типов ошибок
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      
      // Ошибка HTTP
      if (err.response && typeof err.response === 'object') {
        const response = err.response as Record<string, unknown>;
        const status = response.status as number;
        let message = 'Произошла ошибка сервера';
        
        switch (status) {
          case 400:
            message = 'Неверные данные запроса';
            break;
          case 401:
            message = 'Необходима авторизация';
            break;
          case 403:
            message = 'Доступ запрещен';
            break;
          case 404:
            message = 'Ресурс не найден';
            break;
          case 422:
            message = 'Ошибка валидации данных';
            break;
          case 500:
            message = 'Внутренняя ошибка сервера';
            break;
          case 503:
            message = 'Сервис временно недоступен';
            break;
          default:
            message = `Ошибка сервера (${status})`;
        }

        const data = response.data as Record<string, unknown> | undefined;
        return {
          message,
          status,
          details: (data?.message as string) || (response.statusText as string)
        };
      }

      // Ошибка сети
      if (err.request) {
        return {
          message: 'Ошибка сети. Проверьте подключение к интернету',
          details: 'Нет ответа от сервера'
        };
      }

      // Другие ошибки с сообщением
      if (err.message) {
        return {
          message: err.message as string,
          details: JSON.stringify(err)
        };
      }
    }

    // Неизвестная ошибка
    return {
      message: 'Произошла неизвестная ошибка',
      details: String(error)
    };
  }, []);

  const isNetworkError = useCallback((error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return !!err.request && !err.response;
    }
    return false;
  }, []);

  const isServerError = useCallback((error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      const response = err.response as Record<string, unknown> | undefined;
      return (response?.status as number) >= 500;
    }
    return false;
  }, []);

  const isClientError = useCallback((error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      const response = err.response as Record<string, unknown> | undefined;
      const status = response?.status as number | undefined;
      return status !== undefined && status >= 400 && status < 500;
    }
    return false;
  }, []);

  return {
    handleError,
    isNetworkError,
    isServerError,
    isClientError
  };
}