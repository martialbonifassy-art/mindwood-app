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

const S: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "40px 20px",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 950,
    letterSpacing: -0.5,
    background: "linear-gradient(135deg, rgba(245,215,180,1) 0%, rgba(210,160,110,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.85,
    color: "rgba(220,190,170,0.95)",
  },
  error: {
    padding: 16,
    marginBottom: 24,
    borderRadius: 16,
    border: "1px solid rgba(220,100,80,0.35)",
    background: "linear-gradient(135deg, rgba(80,35,25,0.65), rgba(65,28,20,0.75))",
    color: "rgba(240,160,140,1)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  errorIcon: {
    fontSize: 20,
  },
  packages: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  package: {
    position: "relative",
    padding: 24,
    borderRadius: 24,
    border: "1px solid rgba(210,150,90,0.25)",
    background: "linear-gradient(135deg, rgba(52,35,22,0.85) 0%, rgba(42,28,18,0.90) 100%)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  packagePopular: {
    border: "2px solid rgba(255,180,100,0.5)",
    background: "linear-gradient(135deg, rgba(60,40,25,0.90) 0%, rgba(50,33,20,0.95) 100%)",
  },
  badge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "6px 16px",
    borderRadius: 20,
    background: "linear-gradient(135deg, rgba(255,180,100,1), rgba(220,140,70,1))",
    color: "rgba(30,18,10,1)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    boxShadow: "0 4px 12px rgba(255,180,100,0.4)",
  },
  packageHeader: {
    textAlign: "center",
    paddingBottom: 12,
    borderBottom: "1px solid rgba(210,150,90,0.15)",
  },
  creditsAmount: {
    fontSize: 48,
    fontWeight: 950,
    background: "linear-gradient(135deg, rgba(245,215,180,1), rgba(210,160,110,1))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1,
  },
  creditsLabel: {
    fontSize: 14,
    opacity: 0.75,
    marginTop: 8,
    color: "rgba(210,180,140,1)",
  },
  priceSection: {
    textAlign: "center",
    flex: 1,
  },
  price: {
    fontSize: 28,
    fontWeight: 900,
    color: "rgba(240,210,180,1)",
    marginBottom: 6,
  },
  pricePerMessage: {
    fontSize: 12,
    opacity: 0.65,
    color: "rgba(210,180,140,1)",
    marginTop: 4,
  },
  button: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 16,
    border: "2px solid rgba(140,85,45,0.55)",
    background: "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(180,110,60,1) 50%, rgba(140,85,45,1) 100%)",
    boxShadow: "0 12px 30px rgba(180,100,50,0.3), inset 0 1px 0 rgba(255,220,180,0.35)",
    fontWeight: 950,
    fontSize: 14,
    letterSpacing: 0.3,
    color: "rgba(25,15,8,1)",
    cursor: "pointer",
  },
  buttonPopular: {
    background: "linear-gradient(135deg, rgba(255,180,100,1) 0%, rgba(220,140,70,1) 50%, rgba(180,100,50,1) 100%)",
  },
};
