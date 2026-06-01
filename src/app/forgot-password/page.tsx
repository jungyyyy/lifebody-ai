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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="Check your email">
        <AuthMessage type="success">
          We sent a password reset link to <strong className="text-white">{email}</strong>
        </AuthMessage>
        <p className="mt-4 text-sm text-gray-400 text-center">
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <p className="text-gray-400">
          Remember your password?{" "}
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

        <AuthButton disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
