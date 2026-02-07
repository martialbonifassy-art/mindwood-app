"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BijouRow = {
  id_bijou: string;
  credits_restants: number;
  actif: boolean;
};

export default function RechargeClient({ id_bijou }: { id_bijou: string }) {
  const router = useRouter();
  const [bijou, setBijou] = useState<BijouRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadBijou() {
      try {
        const { data, error: err } = await supabase
          .from("bijoux")
          .select("id_bijou,credits_restants,actif")
          .eq("id_bijou", id_bijou)
          .single();

        if (err) throw err;
        setBijou(data as BijouRow);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (id_bijou) {
      loadBijou();
    }
  }, [id_bijou]);

  async function handleRecharge(credits: 10 | 20) {
    if (processing) return;
    
    setProcessing(true);
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
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.shell}>
          <div style={S.content}>
            <p style={S.loadingText}>Chargement...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.shell}>
        <div style={S.content}>
          <div style={S.header}>
            <h1 style={S.title}>Recharge de crédits</h1>
            <p style={S.subtitle}>
              Tu as actuellement <strong>{bijou?.credits_restants ?? 0}</strong> message
              {(bijou?.credits_restants ?? 0) !== 1 ? "s" : ""} restant
              {(bijou?.credits_restants ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>

          {error && (
            <div style={S.error}>
              <span style={S.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={S.options}>
            {/* Option 1: Recharger sans modifier la personnalisation */}
            <div style={S.optionCard}>
              <div style={S.optionIcon}>⚡</div>
              <div style={S.optionContent}>
                <h3 style={S.optionTitle}>Recharger maintenant</h3>
                <p style={S.optionDescription}>
                  Continue avec tes paramètres actuels et paie pour plus de messages
                </p>
              </div>
              <div style={S.packagesGrid}>
                <button
                  onClick={() => handleRecharge(10)}
                  disabled={processing}
                  style={S.packageBtn}
                >
                  <div style={S.pkgPrice}>5€</div>
                  <div style={S.pkgDesc}>10 messages</div>
                </button>
                <button
                  onClick={() => handleRecharge(20)}
                  disabled={processing}
                  style={{ ...S.packageBtn, ...S.packageBtnPopular }}
                >
                  <div style={S.pkgPrice}>10€</div>
                  <div style={S.pkgDesc}>20 messages</div>
                </button>
              </div>
            </div>

            {/* Option 2: Modifier la personnalisation */}
            <div style={S.optionCard}>
              <div style={S.optionIcon}>✏️</div>
              <div style={S.optionContent}>
                <h3 style={S.optionTitle}>Modifier mes paramètres</h3>
                <p style={S.optionDescription}>
                  Personnalise à nouveau ton thème, ton prénom et tes préférences
                </p>
              </div>
              <button
                onClick={() => router.push(`/setup/${id_bijou}`)}
                disabled={processing}
                style={S.modifyBtn}
              >
                Aller à la personnalisation →
              </button>
            </div>

            {/* Option 3: Retourner à l'écoute */}
            <button
              onClick={() => router.push(`/listen/${id_bijou}`)}
              style={S.backBtn}
            >
              ← Retour à l'écoute
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 22,
    fontFamily: "system-ui",
    color: "rgba(245,235,225,0.98)",
    position: "relative",
    background:
      "radial-gradient(1400px 800px at 8% 0%, rgba(180,120,60,0.18), transparent 50%)," +
      "radial-gradient(1000px 700px at 92% 15%, rgba(210,140,70,0.22), transparent 55%)," +
      "radial-gradient(800px 600px at 50% 100%, rgba(100,50,20,0.25), transparent 60%)," +
      "linear-gradient(180deg, rgba(42,28,18,1) 0%, rgba(35,22,14,1) 40%, rgba(28,18,12,1) 100%)",
  },
  shell: {
    maxWidth: 900,
    margin: "0 auto",
    borderRadius: 32,
    border: "2px solid rgba(210,150,90,0.28)",
    background:
      "linear-gradient(135deg, rgba(52,35,22,0.85) 0%, rgba(42,28,18,0.90) 50%, rgba(35,22,14,0.95) 100%)",
    boxShadow:
      "0 60px 180px rgba(0,0,0,0.65), " +
      "0 30px 80px rgba(210,140,70,0.15), " +
      "inset 0 2px 0 rgba(210,150,90,0.22), " +
      "inset 0 -2px 12px rgba(0,0,0,0.45)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
    padding: 40,
    position: "relative",
  },
  content: {
    display: "grid",
    gap: 32,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
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
  options: {
    display: "grid",
    gap: 20,
  },
  optionCard: {
    padding: 28,
    borderRadius: 24,
    border: "1.5px solid rgba(210,150,90,0.28)",
    background: "linear-gradient(135deg, rgba(55,38,25,0.85) 0%, rgba(45,30,20,0.92) 100%)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(210,150,90,0.12)",
    display: "grid",
    gap: 16,
  },
  optionIcon: {
    fontSize: 28,
    lineHeight: 1,
  },
  optionContent: {
    display: "grid",
    gap: 8,
  },
  optionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 950,
    color: "rgba(245,215,180,1)",
  },
  optionDescription: {
    margin: 0,
    fontSize: 14,
    opacity: 0.8,
    color: "rgba(220,190,170,0.95)",
  },
  packagesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 8,
  },
  packageBtn: {
    padding: "16px 12px",
    borderRadius: 16,
    border: "2px solid rgba(140,85,45,0.55)",
    background: "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(180,110,60,1) 50%, rgba(140,85,45,1) 100%)",
    boxShadow: "0 12px 30px rgba(180,100,50,0.3), inset 0 1px 0 rgba(255,220,180,0.35)",
    fontWeight: 950,
    fontSize: 13,
    color: "rgba(25,15,8,1)",
    cursor: "pointer",
    transition: "all 200ms ease",
    display: "grid",
    gap: 6,
    alignContent: "center",
    textAlign: "center",
  },
  packageBtnPopular: {
    background: "linear-gradient(135deg, rgba(255,180,100,1) 0%, rgba(220,140,70,1) 50%, rgba(180,100,50,1) 100%)",
    border: "2px solid rgba(255,180,100,0.5)",
  },
  pkgPrice: {
    fontSize: 18,
    fontWeight: 950,
    color: "rgba(30,18,10,1)",
  },
  pkgDesc: {
    fontSize: 12,
    opacity: 0.9,
    color: "rgba(35,20,10,1)",
  },
  modifyBtn: {
    padding: "14px 20px",
    borderRadius: 16,
    border: "1px solid rgba(210,150,90,0.28)",
    background: "linear-gradient(135deg, rgba(55,38,25,0.75), rgba(45,30,20,0.85))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28), inset 0 1px 0 rgba(210,150,90,0.18)",
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 0.3,
    color: "rgba(220,180,130,0.98)",
    cursor: "pointer",
    transition: "all 200ms ease",
  },
  backBtn: {
    padding: "12px 20px",
    borderRadius: 12,
    border: "1px solid rgba(210,150,90,0.18)",
    background: "transparent",
    color: "rgba(210,180,140,0.85)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  loadingText: {
    textAlign: "center",
    opacity: 0.7,
    fontSize: 14,
  },
};
