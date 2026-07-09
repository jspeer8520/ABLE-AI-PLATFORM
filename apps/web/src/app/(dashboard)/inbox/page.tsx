'use client';

import { useState } from 'react';
import { useMessages, useDebounce } from '@/hooks';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const sourceLabels: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  slack: 'Slack',
  teams: 'Teams',
  whatsapp: 'WhatsApp',
};

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);

  const { messages, isLoading, error, markAsRead, archive } = useMessages({
    skip: 0,
    take: 20,
    search: debouncedQuery || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Messages</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Inbox</h1>
        <p className="mt-1 text-sm text-gray-600">All your conversations in one place.</p>
      </div>

      <Input
        placeholder="Search messages…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-sm text-gray-500">
              Connect an integration to start receiving messages here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={msg.readAt ? '' : 'border-brand-200 bg-brand-50/40'}
            >
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!msg.readAt && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                    )}
                    <span className="truncate text-sm font-semibold text-ink">{msg.senderName}</span>
                    <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      {sourceLabels[msg.source] ?? msg.source}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-gray-800">{msg.subject}</p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{msg.content}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(msg.id, !msg.readAt)}>
                    {msg.readAt ? 'Mark unread' : 'Mark read'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => archive(msg.id)}>
                    Archive
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
