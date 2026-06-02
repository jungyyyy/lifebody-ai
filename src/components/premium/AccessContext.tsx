"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import type { AccessState } from "@/lib/premium";
import { UnlockModal } from "./UnlockModal";

type UnlockVariant = "never_trial" | "trial_expired";

type AccessContextValue = {
  accessState: AccessState;
  programWeeks?: number;
  openUnlockModal: (variant: UnlockVariant) => void;
  isTabLocked: (href: string) => boolean;
};

const AccessContext = createContext<AccessContextValue | null>(null);

const LOCKED_PREFIXES = ["/journal", "/program", "/progress"];

export function AccessProvider({
  accessState,
  programWeeks,
  children,
}: {
  accessState: AccessState;
  programWeeks?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalVariant, setModalVariant] = useState<UnlockVariant | null>(null);

  const locked = accessState === "never_trial" || accessState === "trial_expired";

  const openUnlockModal = useCallback((variant: UnlockVariant) => {
    setModalVariant(variant);
  }, []);

  const closeModal = useCallback(() => {
    setModalVariant(null);
  }, []);

  useEffect(() => {
    const unlock = searchParams.get("unlock");
    if (unlock === "expired") setModalVariant("trial_expired");
    if (unlock === "new") setModalVariant("never_trial");
  }, [searchParams]);

  const isTabLocked = useCallback(
    (href: string) => {
      if (!locked) return false;
      return LOCKED_PREFIXES.some(
        (p) => href === p || href.startsWith(`${p}/`)
      );
    },
    [locked]
  );

  const value = useMemo(
    () => ({
      accessState,
      programWeeks,
      openUnlockModal,
      isTabLocked,
    }),
    [accessState, programWeeks, openUnlockModal, isTabLocked]
  );

  return (
    <AccessContext.Provider value={value}>
      {children}
      <UnlockModal
        open={modalVariant != null}
        variant={modalVariant ?? "never_trial"}
        onClose={() => {
          closeModal();
          if (searchParams.get("unlock")) {
            router.replace("/dashboard");
          }
        }}
      />
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error("useAccess must be used within AccessProvider");
  }
  return ctx;
}
