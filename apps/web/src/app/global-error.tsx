'use client';

import { useEffect } from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This fires for crashes in the root layout itself — the most severe
    // failure class in the app, since nothing else rendered either.
    // TODO: wire to Sentry/error tracking once set up; this is the highest
    // priority error type to actually alert on, not just log.
    console.error('Root layout crashed:', error);
  }, [error]);

  return (
    // global-error.tsx must define its own <html> and <body> — it fully
    // replaces the root layout, so nothing from app/layout.tsx (fonts,
    // providers, globals.css) is guaranteed to be present here.
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'Inter, Arial, Helvetica, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111111',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              margin: '0 auto',
              height: '3rem',
              width: '3rem',
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertOctagon size={24} color="#dc2626" />
          </div>

          <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
            Application error
          </h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
            ABLE failed to load. This has been logged — try refreshing the page.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div
              style={{
                marginTop: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                textAlign: 'left',
              }}
            >
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#374151', wordBreak: 'break-all' }}>
                {error.message}
              </p>
              {error.digest && (
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              borderRadius: '0.375rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} /> Try again
          </button>
        </div>
      </body>
    </html>
  );
}