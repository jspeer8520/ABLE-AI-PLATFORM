import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../providers';
import { Message } from './useMessages';

export const useMessage = (messageId: string | null) => {
  const { authFetch } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessage = useCallback(async () => {
    if (!messageId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await authFetch<Message>(`/api/messages/${messageId}`);
      setMessage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch message');
    } finally {
      setIsLoading(false);
    }
  }, [messageId, authFetch]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return { message, isLoading, error, refetch: fetchMessage };
};
