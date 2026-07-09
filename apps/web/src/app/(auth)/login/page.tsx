"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/app/providers/use-auth";
import { ApiError } from "@/app/lib/api";
import { Button } from "@/app/components/ui/button";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [unverified, setUnverified] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: LoginInput) {
    try {
      await login(values.email, values.password);

      // ⭐ Typed route fix
      router.replace("/dashboard" as const);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setUnverified(true);
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-3xl font-semibold mb-6">Login</h1>

      {unverified && (
        <p className="text-red-600 mb-4">
          Your account is not verified. Please check your email.
        </p>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <input
          type="email"
          placeholder="Email"
          {...form.register("email")}
          className="border px-3 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          {...form.register("password")}
          className="border px-3 py-2 rounded"
        />

        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </div>
  );
}
