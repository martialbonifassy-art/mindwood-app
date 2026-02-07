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

  async function handleRecharge(credits: number) {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_bijou, credits }),
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
    <div style={S.container}>
      <div style={S.header}>
        <h2 style={S.title}>{t.recharge.title}</h2>
        <p style={S.subtitle}>
          {locale === "fr" 
            ? `Tu as actuellement ${currentCredits} message${currentCredits > 1 ? "s" : ""} restant${currentCredits > 1 ? "s" : ""}`
            : `You currently have ${currentCredits} message${currentCredits > 1 ? "s" : ""} remaining`
          }
        </p>
      </div>

      {error && (
        <div style={S.error}>
          <span style={S.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <div style={S.packages}>
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.credits}
            style={{
              ...S.package,
              ...(pkg.popular ? S.packagePopular : {}),
            }}
            className="recharge-package"
          >
            {pkg.popular && <div style={S.badge}>{locale === "fr" ? "Le plus populaire" : "Most popular"}</div>}
            
            <div style={S.packageHeader}>
              <div style={S.creditsAmount}>{pkg.credits}</div>
              <div style={S.creditsLabel}>{locale === "fr" ? "messages" : "messages"}</div>
            </div>

            <div style={S.priceSection}>
              <div style={S.price}>{pkg.price}€</div>
              <div style={S.pricePerMessage}>{(pkg.price / pkg.credits).toFixed(2)}€ / {locale === "fr" ? "message" : "message"}</div>
            </div>

            <button
              onClick={() => handleRecharge(pkg.credits)}
              disabled={loading}
              style={{
                ...S.button,
                ...(pkg.popular ? S.buttonPopular : {}),
                ...(loading ? { opacity: 0.6, cursor: "not-allowed" } : {}),
              }}
              className="recharge-button"
            >
              {loading ? (locale === "fr" ? "Chargement..." : "Loading...") : t.recharge.buy}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .recharge-package {
          transition: all 250ms cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .recharge-package:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 32px 80px rgba(210, 140, 70, 0.15),
            0 16px 40px rgba(0, 0, 0, 0.25);
        }
        .recharge-button {
          transition: all 200ms ease;
        }
        .recharge-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 20px 50px rgba(180, 100, 50, 0.3),
            0 10px 25px rgba(0, 0, 0, 0.3);
        }
        .recharge-button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
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
