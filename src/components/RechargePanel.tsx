"use client";

import { useState, useEffect } from "react";
import { getLocaleFromHost, useTranslations } from "@/lib/i18n";

type RechargePanelProps = {
  id_bijou: string;
  currentCredits?: number;
};

const CREDIT_PACKAGES = [
  { credits: 10, price: 5, popular: false },
  { credits: 20, price: 10, popular: true },
];

export default function RechargePanel({ id_bijou, currentCredits = 0 }: RechargePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect locale from hostname
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  useEffect(() => {
    setLocale(getLocaleFromHost(window.location.hostname));
  }, []);
  const t = useTranslations(locale);
  const formatPrice = (amount: number) => (locale === "en" ? `$${amount}` : `${amount}€`);

  async function handleRecharge(credits: number) {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_bijou, credits, locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la création de la session");
      }

      const { url } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("URL de paiement manquante");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="mw-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div className="mw-panel text-center mb-10 p-8">
        <h2 className="text-3xl font-extrabold mb-2" style={{
          background: "linear-gradient(135deg, var(--gold) 0%, #f3dfc8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>{t.recharge.title}</h2>
        <p className="mw-muted text-base">
          {locale === "fr" 
            ? `Tu as actuellement ${currentCredits} message${currentCredits > 1 ? "s" : ""} restant${currentCredits > 1 ? "s" : ""}`
            : `You currently have ${currentCredits} message${currentCredits > 1 ? "s" : ""} remaining`
          }
        </p>
      </div>

      {error && (
        <div className="mw-card flex items-center gap-3 p-4 mb-6 border border-red-300 text-red-200">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.credits}
            className={`mw-card p-6 relative flex flex-col gap-4 items-center ${pkg.popular ? 'ring-2 ring-[rgba(255,180,100,0.5)]' : ''}`}
          >
            {pkg.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[rgba(255,180,100,1)] to-[rgba(220,140,70,1)] text-[11px] font-extrabold uppercase shadow-lg">{locale === "fr" ? "Le plus populaire" : "Most popular"}</div>}

            <div className="text-center pb-3 border-b border-[rgba(210,150,90,0.15)] w-full">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-[rgba(245,215,180,1)] to-[rgba(210,160,110,1)] bg-clip-text text-transparent">{pkg.credits}</div>
              <div className="text-sm text-[rgba(210,180,140,1)] mt-2">{locale === "fr" ? "messages" : "messages"}</div>
            </div>

            <div className="text-center flex-1 w-full">
              <div className="text-2xl font-extrabold text-[rgba(240,210,180,1)] mb-1">{formatPrice(pkg.price)}</div>
              <div className="text-xs text-[rgba(210,180,140,1)]">{formatPrice(Number((pkg.price / pkg.credits).toFixed(2)))} / {locale === "fr" ? "message" : "message"}</div>
            </div>

            <button
              onClick={() => handleRecharge(pkg.credits)}
              disabled={loading}
              className={`mw-btn-primary recharge-button w-full py-3 mt-2 ${pkg.popular ? '' : ''}`}
              style={loading ? { opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              {loading ? (locale === "fr" ? "Chargement..." : "Loading...") : t.recharge.buy}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
