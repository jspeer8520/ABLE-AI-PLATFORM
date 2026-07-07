'use client';

import { useMessages, useDebounce } from '@/hooks';
import { useState } from 'react';

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery);

  const { messages, isLoading, markAsRead, archive } = useMessages({
    skip: 0,
    take: 20,
  });

  return (
    <div>
      <input
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {isLoading && <p>Loading...</p>}
      {messages.map((msg) => (
        <div key={msg.id}>
          <h3>{msg.senderName}</h3>
          <p>{msg.subject}</p>
          <button onClick={() => markAsRead(msg.id)}>
            {msg.readAt ? 'Mark unread' : 'Mark read'}
          </button>
          <button onClick={() => archive(msg.id)}>Archive</button>
        </div>
      ))}
    </div>
  );
}
