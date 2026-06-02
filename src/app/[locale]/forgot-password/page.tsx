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

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
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
      <AuthCard title={t("checkEmail")}>
        <AuthMessage type="success">
          {t("resetLinkSent", { email })}
        </AuthMessage>
        <p className="mt-4 text-sm text-gray-400 text-center">
          <AuthLink href="/login">{t("backToSignIn")}</AuthLink>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("resetPassword")}
      subtitle={t("resetSubtitle")}
      footer={
        <p className="text-gray-400">
          {t("rememberPassword")}{" "}
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

        <AuthButton disabled={loading}>
          {loading ? t("sending") : t("sendResetLink")}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
