"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [bijouId, setBijouId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalizedId = useMemo(() => bijouId.trim(), [bijouId]);

  function goTo(pathBase: "listen" | "setup") {
    if (!normalizedId) {
      setError("Entre un identifiant de bijou pour continuer.");
      return;
    }
    setError(null);
    router.push(`/${pathBase}/${normalizedId}`);
  }

  return (
    <main style={S.page}>
      <style>{`
        @keyframes mw-fadeUp {
          0% { opacity: 0; transform: translateY(8px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes mw-shimmer {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(200%) rotate(12deg); }
        }
      `}</style>

      <div style={S.glow} />
      <div style={S.shell}>
        <div style={S.shimmer} />

        <div style={S.brand}>ATELIER DES LIENS INVISIBLES</div>
        <h1 style={S.h1}>Mindwood</h1>
        <p style={S.subtitle}>
          Une vitrine lumineuse et intime pour révéler le murmure de votre bijou.
        </p>

        <div style={S.card}>
          <label style={S.label} htmlFor="bijou-id">
            Identifiant du bijou
          </label>
          <input
            id="bijou-id"
            value={bijouId}
            onChange={(event) => setBijouId(event.target.value)}
            placeholder="ex: fe3cb1ef-9898-4dab-b99c-47df816431e7"
            style={S.input}
          />
          {error ? <div style={S.error}>{error}</div> : null}

          <div style={S.actions}>
            <button
              style={S.btnCopper}
              onClick={() => goTo("listen")}
              className="mw-btnCopper"
            >
              Écouter
            </button>
            <button
              style={S.btnGhost}
              onClick={() => goTo("setup")}
              className="mw-btnGhost"
            >
              Configurer
            </button>
          </div>
        </div>

        <div style={S.features}>
          <div style={S.featureCard}>
            <div style={S.featureTitle}>Murmure unique</div>
            <div style={S.featureText}>
              Une narration sur-mesure, bois et cuivre, pour l’émotion pure.
            </div>
          </div>
          <div style={S.featureCard}>
            <div style={S.featureTitle}>Design luxueux</div>
            <div style={S.featureText}>
              Un écrin sombre, élégant, avec reflets et profondeur.
            </div>
          </div>
          <div style={S.featureCard}>
            <div style={S.featureTitle}>Accès direct</div>
            <div style={S.featureText}>
              Saisis ton ID et plonge dans l’expérience en un clic.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 24,
    background:
      "radial-gradient(1200px 700px at 12% 0%, rgba(180,120,60,0.20), transparent 55%)," +
      "radial-gradient(900px 600px at 95% 10%, rgba(210,140,70,0.22), transparent 60%)," +
      "radial-gradient(900px 700px at 45% 110%, rgba(0,0,0,0.30), transparent 55%)," +
      "linear-gradient(180deg, rgba(42,28,18,1) 0%, rgba(30,20,12,1) 55%, rgba(20,14,10,1) 100%)",
    color: "rgba(235,215,195,0.98)",
    fontFamily: "system-ui",
    position: "relative",
  },
  glow: {
    position: "absolute",
    inset: "-80px -40px auto -40px",
    height: 220,
    background:
      "radial-gradient(ellipse 60% 50% at 40% 55%, rgba(210,140,70,0.50), transparent 60%)," +
      "radial-gradient(ellipse 50% 40% at 65% 45%, rgba(180,100,50,0.35), transparent 65%)",
    filter: "blur(12px)",
    opacity: 0.8,
    pointerEvents: "none",
  },
  shell: {
    maxWidth: 980,
    margin: "0 auto",
    borderRadius: 30,
    border: "1px solid rgba(210,150,90,0.28)",
    background:
      "linear-gradient(135deg, rgba(52,35,22,0.85) 0%, rgba(42,28,18,0.90) 50%, rgba(35,22,14,0.95) 100%)",
    boxShadow:
      "0 60px 180px rgba(0,0,0,0.65), " +
      "0 30px 80px rgba(210,140,70,0.15), " +
      "inset 0 2px 0 rgba(210,150,90,0.22), " +
      "inset 0 -2px 12px rgba(0,0,0,0.45)",
    padding: 28,
    position: "relative",
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    inset: "-100% -200%",
    background:
      "linear-gradient(110deg, transparent 40%, rgba(210,150,90,0.12) 50%, transparent 60%)",
    animation: "mw-shimmer 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  brand: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: 900,
    opacity: 0.7,
    color: "rgba(210,160,110,0.85)",
  },
  h1: {
    margin: "8px 0 8px",
    fontSize: 40,
    letterSpacing: -1,
    background: "linear-gradient(135deg, rgba(245,215,180,1) 0%, rgba(210,160,110,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.5,
    opacity: 0.85,
  },
  card: {
    marginTop: 20,
    borderRadius: 24,
    border: "1px solid rgba(210,150,90,0.22)",
    background: "linear-gradient(135deg, rgba(48,32,20,0.75), rgba(38,25,16,0.85))",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.35), " +
      "inset 0 1px 0 rgba(210,150,90,0.15)",
    padding: 20,
  },
  label: {
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.4,
    color: "rgba(220,180,130,0.95)",
  },
  input: {
    marginTop: 8,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(210,150,90,0.35)",
    background: "rgba(30,20,14,0.7)",
    color: "rgba(235,215,195,0.98)",
    outline: "none",
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    color: "rgba(240,150,130,0.95)",
  },
  actions: {
    marginTop: 14,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  btnCopper: {
    padding: "14px 22px",
    borderRadius: 18,
    border: "2px solid rgba(140,85,45,0.55)",
    background:
      "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(190,130,75,1) 40%, rgba(140,85,45,1) 100%)",
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "rgba(25,15,8,1)",
    cursor: "pointer",
  },
  btnGhost: {
    padding: "14px 22px",
    borderRadius: 18,
    border: "1px solid rgba(210,150,90,0.28)",
    background: "linear-gradient(135deg, rgba(55,38,25,0.75), rgba(45,30,20,0.85))",
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "rgba(220,180,130,0.98)",
    cursor: "pointer",
  },
  features: {
    marginTop: 18,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  featureCard: {
    borderRadius: 18,
    border: "1px solid rgba(210,150,90,0.18)",
    background: "rgba(20,14,10,0.45)",
    padding: 14,
  },
  featureTitle: {
    fontWeight: 900,
    marginBottom: 6,
  },
  featureText: {
    opacity: 0.8,
    lineHeight: 1.45,
    fontSize: 14,
  },
};
