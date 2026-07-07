import { useState, useCallback, useEffect } from 'react';
import { useAPI } from './useAPI';
import { useLocalStorage } from './useLocalStorage';

export interface Message {
  id: string;
  source: 'gmail' | 'outlook' | 'slack' | 'teams' | 'whatsapp';
  senderName: string;
  senderId: string;
  subject: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  skip: number;
  take: number;
}

interface UseMessagesOptions {
  skip?: number;
  take?: number;
  read?: boolean;
  source?: string;
}

export const useMessages = (options: UseMessagesOptions = {}) => {
  const { skip = 0, take = 20, read, source } = options;
  const { request } = useAPI();
  const { getItem, setItem } = useLocalStorage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try cache first
      const cacheKey = `messages_${skip}_${take}_${read}_${source}`;
      const cached = getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as MessagesResponse;
        setMessages(data.messages);
        setTotal(data.total);
        return;
      }

      // Fetch from API
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('take', take.toString());
      if (read !== undefined) params.append('read', read.toString());
      if (source) params.append('source', source);

      const data = await request<MessagesResponse>(
        `/api/messages?${params.toString()}`
      );

      setMessages(data.messages);
      setTotal(data.total);

      // Cache it
      setItem(cacheKey, JSON.stringify(data), 3600); // 1 hour cache
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      
      // Fall back to cache if available
      const cacheKey = `messages_${skip}_${take}_${read}_${source}`;
      const cached = getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as MessagesResponse;
        setMessages(data.messages);
        setTotal(data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [skip, take, read, source, request, getItem, setItem]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = useCallback(
    async (messageId: string, read: boolean = true) => {
      try {
        await request(`/api/messages/${messageId}/read`, {
          method: 'PATCH',
          body: JSON.stringify({ read }),
        });

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, readAt: read ? new Date().toISOString() : null }
              : msg
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update message';
        setError(errorMessage);
      }
    },
    [request]
  );

  const archive = useCallback(async (messageId: string) => {
    try {
      await request(`/api/messages/${messageId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, archivedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to archive message';
      setError(errorMessage);
    }
  }, [request]);

  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    total,
    markAsRead,
    archive,
    refresh,
  };
};
