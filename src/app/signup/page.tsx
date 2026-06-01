"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthMessage,
  AuthLink,
} from "@/components/AuthCard";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Almost there">
        <AuthMessage type="success">
          Check your email to verify your account
        </AuthMessage>
        <p className="mt-4 text-sm text-gray-400 text-center">
          Already verified?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your transformation journey with LifeBody AI"
      footer={
        <p className="text-gray-400">
          Already have an account?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
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
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <AuthInput
          label="Confirm password"
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <AuthButton disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
