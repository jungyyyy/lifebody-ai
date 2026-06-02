"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthMessage,
  AuthLink,
} from "@/components/AuthCard";
import { applyPreferredLanguageFromProfile } from "@/components/i18n/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
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
      setError(tCommon("somethingWrong"));
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, preferred_language")
      .eq("id", user.id)
      .single();

    const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(de|ko|en)/);
    const cookieLocale = cookieMatch?.[1] as "en" | "de" | "ko" | undefined;

    if (
      profile?.preferred_language === "en" &&
      cookieLocale &&
      cookieLocale !== "en"
    ) {
      await fetch("/api/settings/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_language: cookieLocale }),
      });
    } else if (
      profile?.preferred_language === "de" ||
      profile?.preferred_language === "ko"
    ) {
      document.cookie = `NEXT_LOCALE=${profile.preferred_language};path=/;max-age=31536000;SameSite=Lax`;
    } else {
      await applyPreferredLanguageFromProfile();
    }

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
      title={t("welcomeBack")}
      subtitle={t("signInSubtitle")}
      footer={
        <p className="text-gray-400">
          {t("noAccount")}{" "}
          <AuthLink href="/signup">{t("signUp")}</AuthLink>
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
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
        />

        <div className="text-right">
          <AuthLink href="/forgot-password">{t("forgotPassword")}</AuthLink>
        </div>

        <AuthButton disabled={loading}>
          {loading ? t("signingIn") : t("signIn")}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
