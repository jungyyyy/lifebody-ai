"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/SignOutButton";
import {
  COOK_OPTIONS,
  GOAL_BODY_OPTIONS,
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
      setToast("Profile updated ✅");
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
      setToast(`Upload failed: ${error.message}`);
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
      setToast("Program settings saved ✅");
      setTimeout(() => setToast(null), 4000);
      router.refresh();
    }
  }

  async function updatePassword() {
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordError("Current password is incorrect");
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
    setToast("Password updated ✅");
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
        throw new Error(json?.error ?? "Could not start checkout");
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not start checkout");
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
        throw new Error(json?.error ?? "Could not open portal");
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error("No portal URL returned");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not open portal");
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
    setToast("Could not delete account");
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-accent/50 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <Toast message={toast} />
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your account and program</p>

      <div className="mt-8 space-y-6">
        <Section title="Profile">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500">First name</label>
                <input
                  className={`mt-1 ${inputClass}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Last name</label>
                <input
                  className={`mt-1 ${inputClass}`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Profile photo</label>
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
                  alt="Profile photo"
                  width={64}
                  height={64}
                  unoptimized
                  className="mt-2 h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">Date of birth</label>
              <input
                type="date"
                className={`mt-1 ${inputClass}`}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Gender</label>
              <select
                className={`mt-1 ${inputClass}`}
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
              >
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <p className="mt-1 text-sm text-white">{email}</p>
              <p className="text-xs text-gray-600 mt-1">
                Email address cannot be changed.
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={profileSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </Section>

        <Section title="Change password">
          <div className="space-y-3 max-w-md">
            <input
              type="password"
              placeholder="Current password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
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
              {passwordSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </Section>

        <Section title="Program settings">
          <div className="space-y-4">
            {regenConfirm && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Updating goal or cooking frequency will regenerate your meal plan
                and program. Continue?
              </p>
            )}
            <div>
              <label className="text-xs text-gray-500">Current weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={`mt-1 ${inputClass}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Goal body type</label>
              <select
                className={`mt-1 ${inputClass}`}
                value={goalBody}
                onChange={(e) => setGoalBody(e.target.value as GoalBodyType)}
              >
                <option value="">—</option>
                {GOAL_BODY_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Cooking frequency</label>
              <select
                className={`mt-1 ${inputClass}`}
                value={cookFreq}
                onChange={(e) => setCookFreq(e.target.value)}
              >
                <option value="">—</option>
                {COOK_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Dietary restrictions / allergies
              </label>
              <textarea
                className={`mt-1 ${inputClass}`}
                rows={2}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sports & activities</label>
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
              {programSaving ? "Saving…" : regenConfirm ? "Confirm & save" : "Save changes"}
            </button>
          </div>
        </Section>

        <Section title="Subscription & billing">
          {accessState === "trial_active" && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-amber-500/20 text-amber-200 text-xs px-3 py-1">
                Free Trial 🟡
              </span>
              <p className="text-sm text-white">
                Your trial ends on{" "}
                {formatTrialEndDateTime(
                  premium.trial_ends_at ?? subscription?.trial_end ?? ""
                )}
              </p>
              <p className="text-xs text-gray-500">
                You won&apos;t be charged until your trial ends.
              </p>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => startCheckout(false)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                Subscribe now for {SUBSCRIPTION_PRICE_LABEL}
              </button>
            </div>
          )}

          {accessState === "subscriber" && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-accent/20 text-accent text-xs px-3 py-1">
                Premium ✅
              </span>
              <p className="text-sm text-white">Your subscription is active.</p>
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-400">
                  Next billing date:{" "}
                  {formatTrialEndDateTime(subscription.current_period_end)}
                </p>
              )}
              <button
                type="button"
                disabled={portalLoading || !premium.stripe_customer_id}
                onClick={openPortal}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20 disabled:opacity-50"
              >
                {portalLoading ? "Loading…" : "Manage subscription"}
              </button>
            </div>
          )}

          {(accessState === "never_trial" || accessState === "trial_expired") && (
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-red-500/20 text-red-300 text-xs px-3 py-1">
                {accessState === "trial_expired" ? "Trial Ended 🔴" : "Not subscribed"}
              </span>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => startCheckout(accessState === "never_trial")}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                Resubscribe for {SUBSCRIPTION_PRICE_LABEL}
              </button>
            </div>
          )}
        </Section>

        <Section title="Danger zone">
          <p className="text-sm text-gray-400 mb-3">
            Permanently delete your account and all data.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            Delete my account
          </button>
        </Section>

        <SignOutButton />
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close"
            onClick={() => setDeleteOpen(false)}
          />
          <div className="relative max-w-md w-full rounded-2xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-semibold text-white">Delete account?</h3>
            <p className="mt-2 text-sm text-gray-400">
              Are you sure? This will permanently delete your account, program,
              and all logged data. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={deleteAccount}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
