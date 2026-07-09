'use client';

import { useMemo, useState } from 'react';
import { useMessages, useDebounce } from '@/app/hooks';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Archive, ChevronLeft, ChevronRight, Inbox as InboxIcon, MailOpen } from 'lucide-react';

const sourceLabels: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  slack: 'Slack',
  teams: 'Teams',
  whatsapp: 'WhatsApp',
};

const PAGE_SIZE = 20;

export const runtime = "nodejs";

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | 'all'>('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(searchQuery, 400);

  // NOTE: assumes useMessages accepts a `source` filter param — if it doesn't
  // yet, this becomes a client-side filter on `messages` instead (trivial swap,
  // just less efficient for large inboxes). Confirm against the hook's actual signature.
  const { messages, isLoading, error, markAsRead, archive } = useMessages({
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
    search: debouncedQuery || undefined,
    source: sourceFilter === 'all' ? undefined : sourceFilter,
  });

  const availableSources = useMemo(
    () => Array.from(new Set(messages.map((m) => m.source))),
    [messages]
  );

  const unreadCount = messages.filter((m) => !m.readAt).length;

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkArchive = async () => {
    await Promise.all(Array.from(selected).map((id) => archive(id)));
    setSelected(new Set());
  };

  const handleBulkMarkRead = async () => {
    await Promise.all(Array.from(selected).map((id) => markAsRead(id, true)));
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Messages</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-medium text-brand-700">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-600">All your conversations in one place.</p>
        </div>
      </div>

      {/* Search + source filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search messages…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSourceFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              sourceFilter === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {availableSources.map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                sourceFilter === src
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sourceLabels[src] ?? src}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar — only appears when something's selected */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
          <p className="text-sm font-medium text-brand-800">{selected.size} selected</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleBulkMarkRead}>
              <MailOpen className="mr-1.5 h-3.5 w-3.5" /> Mark read
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkArchive}>
              <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <InboxIcon className="h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-sm text-gray-500">
              Connect an integration to start receiving messages here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-1.5">
            {messages.map((msg) => (
              <Card
                key={msg.id}
                className={`transition ${
                  msg.readAt ? '' : 'border-brand-200 bg-brand-50/40'
                } ${selected.has(msg.id) ? 'ring-2 ring-brand-400' : ''}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(msg.id)}
                    onChange={() => toggleSelected(msg.id)}
                    className="h-4 w-4 flex-none rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                  />
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
                    <p className="truncate text-sm font-medium text-gray-800">{msg.subject}</p>
                    <p className="truncate text-xs text-gray-500">{msg.content}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5">
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

          {/* Pagination — assumes messages.length === PAGE_SIZE means there's
              likely a next page; swap for a real total count from the hook if available */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Page {page + 1}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={messages.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}