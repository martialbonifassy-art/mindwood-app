"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getLocaleFromHost, useTranslations } from "@/lib/i18n";

type PageProps = {
  params: { id: string };
};

export default function RechargeSuccessPage({ params }: PageProps) {
  const id_bijou = params.id;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  // Detect locale from hostname
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  useEffect(() => {
    setLocale(getLocaleFromHost(window.location.hostname));
  }, []);
  const t = useTranslations(locale);

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) {
        setStatus("done");
        return;
      }

      try {
        const res = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Confirmation impossible");
        }

        setStatus("done");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
        setStatus("error");
      }
    };

    confirm();
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">✨</div>
        <h1 className="text-2xl font-semibold mb-3">{t.success.title}</h1>
        <p className="text-slate-300 mb-6">
          {t.success.message}
          <br />
          {t.success.subtitle}
        </p>
        {status === "loading" && (
          <div className="text-slate-400 text-sm mb-4">{locale === "fr" ? "Vérification du paiement..." : "Verifying payment..."}</div>
        )}
        {status === "error" && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}
        <div className="h-1 bg-linear-to-r from-pink-500 to-rose-500 rounded-full" />
      </div>
    </main>
  );
}