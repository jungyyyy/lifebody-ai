"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/SignOutButton";
import {
  GOAL_BODY_IDS,
  goalBodyTranslationKey,
} from "@/lib/i18n/goalBodyOptions";
import { cookOptionKey } from "@/lib/i18n/lifestyleOptions";
import {
  COOK_OPTIONS,
  type GoalBodyType,
  type Sex,
} from "@/types/onboarding";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing/constants";
import {
  formatTrialEndDateTime,
  getAccessState,
  type PremiumProfile,
} from "@/lib/premium";

type ProfileData = {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  email: string;
  sex: Sex | "";
};

type ProgramData = {
  current_weight_kg: number | null;
  goal_body_type: string | null;
  cook_frequency: string | null;
  dietary_restrictions: string | null;
  sports_enjoyed: string | null;
};

type SubscriptionInfo = {
  status?: string;
  trial_end?: string | null;
  current_period_end?: string | null;
};

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-accent/30 bg-accent/15 px-4 py-2 text-sm text-accent shadow-lg">
      {message}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-card p-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function SettingsPage({
  initialProfile,
  initialProgram,
  initialPremium,
  email,
}: {
  initialProfile: ProfileData;
  initialProgram: ProgramData;
  initialPremium: PremiumProfile;
  email: string;
}) {
  const router = useRouter();
  const t = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tPremium = useTranslations("premium");
  const tErrors = useTranslations("errors");
  const [toast, setToast] = useState<string | null>(null);
  const [premium, setPremium] = useState(initialPremium);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const [firstName, setFirstName] = useState(initialProfile.first_name ?? "");
  const [lastName, setLastName] = useState(initialProfile.last_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialProfile.date_of_birth?.slice(0, 10) ?? ""
  );
  const [sex, setSex] = useState<Sex | "">(initialProfile.sex || "");

  const [weight, setWeight] = useState(
    initialProgram.current_weight_kg?.toString() ?? ""
  );
  const [goalBody, setGoalBody] = useState(
    (initialProgram.goal_body_type as GoalBodyType) || ""
  );
  const [cookFreq, setCookFreq] = useState(initialProgram.cook_frequency ?? "");
  const [dietary, setDietary] = useState(
    initialProgram.dietary_restrictions ?? ""
  );
  const [sports, setSports] = useState(initialProgram.sports_enjoyed ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [programSaving, setProgramSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [regenConfirm, setRegenConfirm] = useState(false);

  const refreshSubscription = useCallback(async () => {
    const res = await fetch("/api/stripe/subscription", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.profile) setPremium(json.profile);
      setSubscription(json.subscription);
    }
  }, []);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const accessState = getAccessState(premium);

  async function saveProfile() {
    setProfileSaving(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        date_of_birth: dateOfBirth || null,
        sex: sex || undefined,
      }),
    });
    setProfileSaving(false);
    if (res.ok) {
      setToast(t("profileUpdated"));
      setTimeout(() => setToast(null), 4000);
      router.refresh();
    }
  }

  async function uploadAvatar(file: File) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (error) {
      setToast(t("uploadFailed", { message: error.message }));
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  }

  async function saveProgram() {
    const goalChanged = goalBody !== initialProgram.goal_body_type;
    const cookChanged = cookFreq !== initialProgram.cook_frequency;
    if ((goalChanged || cookChanged) && !regenConfirm) {
      setRegenConfirm(true);
      return;
    }

    setProgramSaving(true);
    const res = await fetch("/api/settings/program", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_weight_kg: weight,
        goal_body_type: goalBody,
        cook_frequency: cookFreq,
        dietary_restrictions: dietary,
        sports_enjoyed: sports,
        regenerate: regenConfirm,
      }),
    });
    setProgramSaving(false);
    setRegenConfirm(false);
    if (res.ok) {
      setToast(t("programSaved"));
      setTimeout(() => setToast(null), 4000);
      router.refresh();
    }
  }

  async function updatePassword() {
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("passwordMin8"));
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordError(t("passwordWrong"));
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setToast(t("passwordUpdated"));
    setTimeout(() => setToast(null), 4000);
  }

  async function startCheckout(withTrial: boolean) {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withTrial }),
      });
      const json = await safeJson<{ url?: string; error?: string }>(res);
      if (!res.ok) {
        throw new Error(json?.error ?? tPremium("couldNotCheckout"));
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error(tErrors("noCheckoutUrl"));
    } catch (err) {
      setToast(err instanceof Error ? err.message : tPremium("couldNotCheckout"));
      setTimeout(() => setToast(null), 4000);
      setCheckoutLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const json = await safeJson<{ url?: string; error?: string }>(res);
      if (!res.ok) {
        throw new Error(json?.error ?? tPremium("couldNotPortal"));
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error(tErrors("noPortalUrl"));
    } catch (err) {
      setToast(err instanceof Error ? err.message : tPremium("couldNotPortal"));
      setTimeout(() => setToast(null), 4000);
      setPortalLoading(false);
    }
  }

  async function deleteAccount() {
    setDeleteLoading(true);
    const res = await fetch("/api/settings/delete-account", { method: "POST" });
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/signup");
      return;
    }
    setDeleteLoading(false);
    setToast(t("deleteFailed"));
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/50 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <Toast message={toast} />
      <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>

      <div className="mt-8 space-y-6">
        <Section title={t("profile")}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500">{t("firstName")}</label>
                <input
                  className={`mt-1 ${inputClass}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t("lastName")}</label>
                <input
                  className={`mt-1 ${inputClass}`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("profilePhoto")}</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block text-sm text-gray-400"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
              />
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={t("profilePhoto")}
                  width={64}
                  height={64}
                  unoptimized
                  className="mt-2 h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("dateOfBirth")}</label>
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("gender")}</label>
              <select
                className={`mt-1 ${inputClass}`}
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
              >
                <option value="">—</option>
                <option value="female">{tOnboarding("sexFemale")}</option>
                <option value="male">{tOnboarding("sexMale")}</option>
                <option value="prefer_not_to_say">
                  {tOnboarding("sexPreferNot")}
                </option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("email")}</label>
              <p className="mt-1 text-sm text-white">{email}</p>
              <p className="text-xs text-gray-600 mt-1">{t("emailCannotChange")}</p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={profileSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {profileSaving ? t("saving") : t("saveProfile")}
            </button>
          </div>
        </Section>

        <Section title={t("changePassword")}>
          <div className="space-y-3 max-w-md">
            <input
              type="password"
              placeholder={t("currentPassword")}
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder={t("newPassword")}
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder={t("confirmNewPassword")}
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordError && (
              <p className="text-sm text-red-300">{passwordError}</p>
            )}
            <button
              type="button"
              onClick={updatePassword}
              disabled={passwordSaving}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20 disabled:opacity-50"
            >
              {passwordSaving ? t("updating") : t("updatePassword")}
            </button>
          </div>
        </Section>

        <Section title={t("programSettings")}>
          <div className="space-y-4">
            {regenConfirm && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                {t("regenContinue")}
              </p>
            )}
            <div>
              <label className="text-xs text-gray-500">{t("currentWeight")}</label>
              <input
                type="number"
                step="0.1"
                className={`mt-1 ${inputClass}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("goalBody")}</label>
              <select
                className={`mt-1 ${inputClass}`}
                value={goalBody}
                onChange={(e) => setGoalBody(e.target.value as GoalBodyType)}
              >
                <option value="">—</option>
                {GOAL_BODY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {tOnboarding(goalBodyTranslationKey(id))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">
                {t("cookingFrequency")}
              </label>
              <select
                className={`mt-1 ${inputClass}`}
                value={cookFreq}
                onChange={(e) => setCookFreq(e.target.value)}
              >
                <option value="">—</option>
                {COOK_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {tOnboarding(cookOptionKey(o))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">
                {t("dietaryAllergies")}
              </label>
              <textarea
                className={`mt-1 ${inputClass}`}
                rows={2}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("sportsActivities")}</label>
              <input
                className={`mt-1 ${inputClass}`}
                value={sports}
                onChange={(e) => setSports(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={saveProgram}
              disabled={programSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {programSaving
                ? t("saving")
                : regenConfirm
                  ? t("confirmSave")
                  : t("saveChanges")}
            </button>
          </div>
        </Section>

        <Section title={t("subscription")}>
          {accessState === "trial_active" && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-amber-500/20 text-amber-200 text-xs px-3 py-1">
                {t("freeTrialBadge")}
              </span>
              <p className="text-sm text-white">
                {t("trialEndsOn", {
                  date: formatTrialEndDateTime(
                    premium.trial_ends_at ?? subscription?.trial_end ?? ""
                  ),
                })}
              </p>
              <p className="text-xs text-gray-500">{t("trialNoCharge")}</p>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => startCheckout(false)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {t("subscribeNow", { price: SUBSCRIPTION_PRICE_LABEL })}
              </button>
            </div>
          )}

          {accessState === "subscriber" && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-accent/20 text-accent text-xs px-3 py-1">
                {t("premiumActive")}
              </span>
              <p className="text-sm text-white">{t("subscriptionActive")}</p>
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-400">
                  {t("nextBilling")}{" "}
                  {formatTrialEndDateTime(subscription.current_period_end)}
                </p>
              )}
              <button
                type="button"
                disabled={portalLoading || !premium.stripe_customer_id}
                onClick={openPortal}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20 disabled:opacity-50"
              >
                {portalLoading ? tCommon("loading") : t("manageSubscription")}
              </button>
            </div>
          )}

          {(accessState === "never_trial" || accessState === "trial_expired") && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-red-500/20 text-red-300 text-xs px-3 py-1">
                {accessState === "trial_expired"
                  ? t("trialEnded")
                  : t("notSubscribed")}
              </span>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => startCheckout(accessState === "never_trial")}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {t("resubscribe", { price: SUBSCRIPTION_PRICE_LABEL })}
              </button>
            </div>
          )}
        </Section>

        <Section title={t("dangerZone")}>
          <p className="text-sm text-gray-400 mb-3">{t("deleteDataWarning")}</p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            {t("deleteMyAccount")}
          </button>
        </Section>

        <SignOutButton />
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={tCommon("close")}
            onClick={() => setDeleteOpen(false)}
          />
          <div className="relative max-w-md w-full rounded-2xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-semibold text-white">
              {t("deleteAccountTitle")}
            </h3>
            <p className="mt-2 text-sm text-gray-400">{t("deleteAccountConfirm")}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-300"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={deleteAccount}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white disabled:opacity-50"
              >
                {deleteLoading ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
