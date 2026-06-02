"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function PaymentSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("premium");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;

    setMessage(t("paymentSuccess"));

    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }, [searchParams, router, t]);

  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
      {message}
    </div>
  );
}
