"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthMessage,
  AuthLink,
} from "@/components/AuthCard";

export default function SignupPage() {
  const t = useTranslations("auth");
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
      setError(t("passwordsNoMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordMin6"));
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
      <AuthCard title={t("almostThere")}>
        <AuthMessage type="success">{t("checkEmailVerify")}</AuthMessage>
        <p className="mt-4 text-sm text-gray-400 text-center">
          {t("alreadyVerified")}{" "}
          <AuthLink href="/login">{t("signIn")}</AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("createAccount")}
      subtitle={t("createSubtitle")}
      footer={
        <p className="text-gray-400">
          {t("hasAccount")}{" "}
          <AuthLink href="/login">{t("signIn")}</AuthLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthMessage type="error">{error}</AuthMessage>}

        <AuthInput
          label={t("email")}
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
        />

        <AuthInput
          label={t("password")}
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
        />

        <AuthInput
          label={t("confirmPassword")}
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
        />

        <AuthButton disabled={loading}>
          {loading ? t("creatingAccount") : t("signUp")}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
