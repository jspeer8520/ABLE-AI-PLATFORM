import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Creator Economy Infrastructure
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-ink">
          ABLE AI Platform
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          The AI layer behind the tools creators build their business on.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
