"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PaymentSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;

    setMessage("You're in! Your 3-day free trial has started. 🎉");

    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }, [searchParams, router]);

  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
      {message}
    </div>
  );
}
