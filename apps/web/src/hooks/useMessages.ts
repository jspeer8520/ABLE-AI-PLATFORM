import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/app/providers/auth-provider';

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
  search?: string;
}

export const useMessages = (options: UseMessagesOptions = {}) => {
  const { skip = 0, take = 20, read, source, search } = options;
  const { authFetch } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('take', take.toString());
      if (read !== undefined) params.append('read', read.toString());
      if (source) params.append('source', source);
      if (search) params.append('search', search);

      const data = await authFetch<MessagesResponse>(`/api/messages?${params.toString()}`);
      setMessages(data.messages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [skip, take, read, source, search, authFetch]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAsRead = useCallback(
    async (messageId: string, readValue: boolean = true) => {
      const prev = messages;
      // Optimistic update
      setMessages((curr) =>
        curr.map((msg) =>
          msg.id === messageId
            ? { ...msg, readAt: readValue ? new Date().toISOString() : null }
            : msg,
        ),
      );
      try {
        await authFetch(`/api/messages/${messageId}/read`, {
          method: 'PATCH',
          body: { read: readValue },
        });
      } catch (err) {
        setMessages(prev); // revert on failure
        setError(err instanceof Error ? err.message : 'Failed to update message');
      }
    },
    [authFetch, messages],
  );

  const archive = useCallback(
    async (messageId: string) => {
      const prev = messages;
      setMessages((curr) => curr.filter((msg) => msg.id !== messageId));
      try {
        await authFetch(`/api/messages/${messageId}/archive`, {
          method: 'PATCH',
          body: { archived: true },
        });
      } catch (err) {
        setMessages(prev);
        setError(err instanceof Error ? err.message : 'Failed to archive message');
      }
    },
    [authFetch, messages],
  );

  return {
    messages,
    isLoading,
    error,
    total,
    markAsRead,
    archive,
    refresh: fetchMessages,
  };
};
