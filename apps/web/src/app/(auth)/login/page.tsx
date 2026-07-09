"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { ApiError } from "@/app/lib/api";
import { loginSchema, type LoginInput } from "@/app/lib/validation";
import { useAuth } from "../../providers";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";


export const runtime = "nodejs"; // Prevent Supabase Edge runtime crash

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Welcome Back</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email address"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...form.register("password")}
            />

            <button
              type="button"
              className="absolute right-3 top-3 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            {form.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Signing in..." : "Login"}
          </Button>
        </form>

        {message && (
          <p
            className={`text-center text-sm ${
              status === "error" ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600">
          Need an account?{" "}
          <Link href="/signup" className="text-blue-600 underline">
            Create one
          </Link>
        </p>

        <p className="text-center text-sm text-gray-600">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-blue-600 underline">
            Reset it
          </Link>
        </p>
      </div>
    </div>
  );
}
