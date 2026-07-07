import { useState, useCallback, useEffect } from 'react';
import { useAPI } from './useAPI';
import { Message } from './useMessages';

export const useMessage = (messageId: string | null) => {
  const { request } = useAPI();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessage = useCallback(async () => {
    if (!messageId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await request<Message>(`/api/messages/${messageId}`);
      setMessage(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch message';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messageId, request]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return {
    message,
    isLoading,
    error,
    refetch: fetchMessage,
  };
};
