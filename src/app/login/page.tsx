"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthMessage,
  AuthLink,
} from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    setLoading(false);
    router.refresh();

    if (profile?.onboarding_completed) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your journey"
      footer={
        <p className="text-gray-400">
          Don&apos;t have an account?{" "}
          <AuthLink href="/signup">Sign up</AuthLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthMessage type="error">{error}</AuthMessage>}

        <AuthInput
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />

        <AuthInput
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <div className="text-right">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </div>

        <AuthButton disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
