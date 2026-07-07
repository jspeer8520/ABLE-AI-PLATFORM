'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ApiError } from '@/lib/api';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { useAuth } from '@/app/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setUnverified(false);
    try {
      await login(values.email, values.password);
      router.replace('/dashboard' as const);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) setUnverified(true);
        setServerError(error.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-gray-200">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Sign in to ABLE</h1>

        {serverError ? (
          <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
            {unverified ? (
              <span className="mt-1 block text-red-600">
                Please verify your email using the link we sent before signing in.
              </span>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Input
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-900">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
