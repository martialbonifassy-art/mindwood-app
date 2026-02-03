"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TTSResponse = {
  url: string;
  voiceProfile?: string; // interne (on ne l'affiche pas)
  playbackRate?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
};

type BijouRow = {
  id_bijou: string;
  type_bijou: "murmures_IA" | "voix_enregistrée" | "voix_enregistree" | string;
  langue: "fr" | "en" | string;
  credits_restants: number;
  actif: boolean;
};

type PersoRow = {
  prenom: string | null;
  lieu: string | null;
  souvenir: string | null;
  theme: string | null;
  sous_theme: string | null;
  voix: "masculin" | "feminin" | string | null;
};

function cleanText(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : "";
}

function safeLang(v: unknown): "fr" | "en" {
  const s = String(v ?? "").toLowerCase();
  return s.startsWith("en") ? "en" : "fr";
}

function toTtsGender(voix: unknown): "male" | "female" | "neutral" {
  const s = String(voix ?? "").toLowerCase();
  if (s.includes("masc")) return "male";
  if (s.includes("fem")) return "female";
  return "neutral";
}

export default function ListenClient() {
  const params = useParams<{ id: string }>();
  const id_bijou = params?.id;

  const [loading, setLoading] = useState(false);
  const [bijou, setBijou] = useState<BijouRow | null>(null);
  const [perso, setPerso] = useState<PersoRow | null>(null);

  const [message, setMessage] = useState<string>("");
  const [typed, setTyped] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState(0);

  // Audio states
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  // preset from API
  const playbackRateRef = useRef<number>(1.0);
  const fadeInRef = useRef<number>(300);
  const fadeOutRef = useRef<number>(600);

  // ===== silentLoad: charger bijou/perso au montage =====
  const silentLoad = React.useCallback(async function silentLoad() {
    setError(null);
    try {
      const { data: b, error: bErr } = await supabase
        .from("bijoux")
        .select("id_bijou,type_bijou,langue,credits_restants,actif")
        .eq("id_bijou", id_bijou)
        .maybeSingle();

      if (bErr) throw bErr;
      if (b) setBijou(b as BijouRow);

      const { data: p, error: pErr } = await supabase
        .from("personnalisations")
        .select("prenom,lieu,souvenir,theme,sous_theme,voix")
        .eq("id_bijou", id_bijou)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pErr) throw pErr;
      setPerso((p as PersoRow) ?? null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors du chargement.";
      setError(message);
    }
  }, [id_bijou]);

  useEffect(() => {
    if (!id_bijou) return;
    void silentLoad();
  }, [id_bijou, silentLoad]);

  // ===== Typewriter effect =====
  useEffect(() => {
    if (!message) {
      setTyped("");
      return;
    }

    setMessageKey((k) => k + 1);

    let i = 0;
    setTyped("");

    const speed = 14;
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(message.slice(0, i));
      if (i >= message.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    };
  }, []);

  // ===== Audio helpers =====
  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function fadeVolume(audio: HTMLAudioElement, from: number, to: number, ms: number) {
    clearFadeTimer();
    if (ms <= 0) {
      audio.volume = to;
      return;
    }
    const steps = 20;
    const stepMs = Math.max(10, Math.floor(ms / steps));
    let i = 0;
    audio.volume = from;

    fadeTimerRef.current = window.setInterval(() => {
      i += 1;
      const p = i / steps;
      audio.volume = from + (to - from) * p;
      if (i >= steps) {
        clearFadeTimer();
        audio.volume = to;
      }
    }, stepMs);
  }

  async function ensureAudioUrl(): Promise<string> {
    if (audioUrl) return audioUrl;

    const lang = safeLang(bijou?.langue);
    const gender = toTtsGender(perso?.voix);

    if (!message.trim()) {
      throw new Error("Message vide : clique sur « Découvrir » avant l'audio.");
    }

    setAudioLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          lang,
          voice: gender,
          meta: {
            theme: perso?.theme,
            subtheme: perso?.sous_theme,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur TTS");
      }

      const data = (await res.json()) as TTSResponse;

      playbackRateRef.current = typeof data.playbackRate === "number" ? data.playbackRate : 1.0;
      fadeInRef.current = typeof data.fadeInMs === "number" ? data.fadeInMs : 300;
      fadeOutRef.current = typeof data.fadeOutMs === "number" ? data.fadeOutMs : 600;

      setAudioUrl(data.url);
      return data.url;
    } finally {
      setAudioLoading(false);
    }
  }

  async function playAudio() {
    const url = await ensureAudioUrl();

    const audio = audioRef.current;
    if (!audio) throw new Error("Audio element manquant.");

    if (audio.src !== url) {
      audio.src = url;
    }

    audio.playbackRate = playbackRateRef.current;

    try {
      audio.load();
    } catch {}

    audio.volume = 0;
    const p = audio.play();
    if (p && typeof p.then === "function") await p;

    fadeVolume(audio, 0, 1, fadeInRef.current);

    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  }

  function stopAudio(immediate = false) {
    const audio = audioRef.current;
    if (!audio) return;

    const finalize = () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      setIsPlaying(false);
    };

    if (immediate) {
      clearFadeTimer();
      finalize();
      return;
    }

    const currentVol = typeof audio.volume === "number" ? audio.volume : 1;
    fadeVolume(audio, currentVol, 0, fadeOutRef.current);

    window.setTimeout(() => {
      clearFadeTimer();
      finalize();
    }, fadeOutRef.current + 30);
  }

  async function toggleAudio() {
    if (audioLoading) return;

    if (isPlaying) {
      stopAudio(false);
      return;
    }

    try {
      await playAudio();
    } catch (e) {
      stopAudio(true);
      console.error(e);
    }
  }

  // ===== discoverMessage: generar mensaje =====
  async function discoverMessage() {
    if (!id_bijou) {
      setError("ID bijou manquant dans l'URL.");
      return;
    }

    setError(null);

    if (!bijou || !perso) {
      await silentLoad();
    }

    if (!bijou) {
      setError("Bijou non trouvé.");
      return;
    }

    if (!bijou.actif) {
      setError("Ce bijou n'est pas actif.");
      return;
    }
    if (bijou.credits_restants <= 0) {
      setError("Crédits épuisés. Recharge nécessaire.");
      return;
    }

    setLoading(true);
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("consume_credit", {
        p_id_bijou: id_bijou,
      });

      if (rpcErr) {
        if (rpcErr.message?.includes("NO_CREDITS_OR_INACTIVE")) {
          setError("Crédits épuisés ou bijou inactif.");
          return;
        }
        throw rpcErr;
      }

      type ConsumeCreditResult = { credits_restants?: number | null };
      const newCredits = Array.isArray(rpcData)
        ? (rpcData as ConsumeCreditResult[])[0]?.credits_restants
        : (rpcData as ConsumeCreditResult | null)?.credits_restants;

      setBijou((prev) =>
        prev ? { ...prev, credits_restants: Number(newCredits ?? prev.credits_restants) } : prev
      );

      setAudioUrl(null);
      stopAudio(true);

      if (!perso) {
        setError("Personnalisation manquante.");
        return;
      }

      const p = perso;
      const prenom = cleanText(p?.prenom) || "toi";
      const theme = cleanText(p?.theme) || "un joli thème";
      const sous = cleanText(p?.sous_theme);
      const lieu = cleanText(p?.lieu);
      const souvenir = cleanText(p?.souvenir);

      const res = await fetch("/api/murmure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom,
          theme,
          sous_theme: sous,
          lieu,
          souvenir,
          langue: bijou.langue,
          voix: p?.voix ?? "feminin",
        }),
      });

if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err?.error || "Erreur génération texte");
}

const data = await res.json();
setMessage(String(data.text || "").trim());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la génération.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ===== UI minimale =====
  const buttonLabel = audioLoading ? "Génération…" : isPlaying ? "Stop audio" : "Audio";
  const credits = bijou?.credits_restants ?? null;
  const isActive = bijou?.actif ?? null;
  const canUse = bijou ? Boolean(bijou.actif) && Number(bijou.credits_restants) > 0 : false;

  return (
    <main style={S.page}>
      <style>{`
        @media (max-width: 768px) {
          :root { --page-pad: 14px; }
        }
        @media (max-width: 480px) {
          :root { --page-pad: 12px; }
        }
      `}</style>

      {/* Floating particles overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "12%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(210,150,90,0.65), transparent)",
            filter: "blur(1px)",
            animation: "mw-float1 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "25%",
            right: "18%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,120,70,0.55), transparent)",
            filter: "blur(1px)",
            animation: "mw-float2 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "30%",
            left: "20%",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,140,85,0.60), transparent)",
            filter: "blur(1px)",
            animation: "mw-float3 9s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "25%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(190,130,80,0.50), transparent)",
            filter: "blur(1px)",
            animation: "mw-float1 11s ease-in-out infinite 2s",
          }}
        />
      </div>

      <div style={S.shell} className="mw-shell">
        {/* Shimmer overlay on shell */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            borderRadius: "inherit",
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-100% -200%",
              background:
                "linear-gradient(110deg, transparent 40%, rgba(210,150,90,0.15) 50%, transparent 60%)",
              animation: "mw-shimmer 8s ease-in-out infinite",
            }}
          />
        </div>

        <div style={S.topBar} className="mw-topBar">
          <div style={{ display: "grid", gap: 6 }}>
            <div style={S.kicker} className="mw-kicker">
              ATELIER DES LIENS INVISIBLES
            </div>
            <h1 style={S.h1}>Lecture du bijou</h1>
          </div>

          <div style={S.miniStats} className="mw-miniStats">
            {credits !== null ? (
              <span style={S.miniPill}>{credits} messages restants</span>
            ) : (
              <span style={{ ...S.miniPill, opacity: 0.55 }}>…</span>
            )}
            {isActive !== null ? (
              <span
                style={{
                  ...S.dot,
                  background: isActive ? "rgba(60,190,120,1)" : "rgba(255,120,120,1)",
                }}
              />
            ) : null}
          </div>
        </div>

        <section style={S.hero} className="mw-hero">
          <div style={S.heroGlow} className="mw-heroGlow" />
          <div style={S.paperNoise} />

          {/* audio caché */}
          <audio ref={audioRef} src={audioUrl ?? undefined} />

          {error ? (
            <div style={S.alert}>
              <div style={S.alertTitle}>Erreur</div>
              <div style={S.alertText}>{error}</div>
            </div>
          ) : null}

          <div style={S.messageWrap} className="mw-messageWrap">
            {typed ? (
              <div key={messageKey} className="mw-messageCard" style={S.messageCard}>
                {/* Shimmer effect on message card */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                    borderRadius: "inherit",
                    zIndex: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "-100% -200%",
                      background:
                        "linear-gradient(110deg, transparent 40%, rgba(210,160,110,0.22) 50%, transparent 60%)",
                      animation: "mw-shimmer 6s ease-in-out infinite",
                    }}
                  />
                </div>
                <div style={{ ...S.messageTitle, position: "relative", zIndex: 1 }} className="mw-messageTitle">
                  ✨ Ton message
                </div>
                <div style={{ ...S.messageText, position: "relative", zIndex: 1 }} className="mw-messageText">
                  <span>{typed}</span>
                  <span className="mw-caret" style={S.caret} aria-hidden>
                    ▍
                  </span>
                </div>
              </div>
            ) : (
              <div style={S.placeholder} className="mw-placeholder">
                <div style={S.placeholderMark} className="mw-placeholderMark">
                  ✦
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={S.placeholderTitle} className="mw-placeholderTitle">
                    Un murmure t&apos;attend.
                  </div>
                  <div style={S.placeholderText} className="mw-placeholderText">
                    Appuie sur <b>Découvrir</b> pour recevoir ton message.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={S.actions} className="mw-actions">
            <button
              onClick={discoverMessage}
              disabled={loading || !canUse}
              className="mw-btnCopper"
              style={{
                ...S.btnCopper,
                opacity: loading || !canUse ? 0.65 : 1,
                cursor: loading || !canUse ? "not-allowed" : "pointer",
              }}
            >
              <span style={{ position: "relative" }}>{loading ? "Création…" : "Découvrir"}</span>
            </button>

            <button
              onClick={toggleAudio}
              disabled={!typed || audioLoading}
              className="mw-btnGhost"
              style={{
                ...S.btnGhost,
                opacity: typed && !audioLoading ? 1 : 0.55,
                cursor: typed && !audioLoading ? "pointer" : "not-allowed",
              }}
              title="Lecture audio (mp3 via /api/tts)"
            >
              {buttonLabel}
            </button>
          </div>

          {bijou && !canUse ? (
            <div style={S.rechargeHint}>Crédits à 0 — recharge nécessaire (Stripe ensuite).</div>
          ) : null}
        </section>
      </div>

      {/* CSS premium injecté */}
      <PremiumCss />
    </main>
  );
}

/** CSS premium ULTRA LUXE */
function PremiumCss() {
  useEffect(() => {
    if (document.getElementById("mw-premium-css")) return;

    const style = document.createElement("style");
    style.id = "mw-premium-css";
    style.innerHTML = `
      @keyframes mw-blink { 50% { opacity: 0.0; } }
      .mw-caret { animation: mw-blink 1s steps(1) infinite; }

      @keyframes mw-fadeUp {
        0% { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(3px); }
        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }
      .mw-messageCard { animation: mw-fadeUp 680ms cubic-bezier(.2,.8,.2,1) both; }

      /* Copper button ULTRA: multi-layer shine sweep + 3D press + glow */
      .mw-btnCopper {
        position: relative;
        overflow: hidden;
        transform: translateZ(0);
        transition: transform 200ms cubic-bezier(.2,.7,.2,1), 
                    filter 200ms ease, 
                    box-shadow 200ms ease;
      }
      .mw-btnCopper::before{
        content:"";
        position:absolute;
        inset:-100% -80% auto -80%;
        height:220%;
        transform: rotate(-15deg) translateX(-50%);
        background: 
          radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.9), transparent 65%),
          radial-gradient(ellipse 40% 40% at 45% 45%, rgba(255,220,180,0.85), transparent 70%);
        opacity: 0;
        filter: blur(3px);
        pointer-events:none;
      }
      .mw-btnCopper::after{
        content:"";
        position:absolute;
        inset:0;
        border-radius:inherit;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 55%);
        opacity:0;
        transition: opacity 200ms ease;
        pointer-events:none;
      }
      .mw-btnCopper:hover{
        transform: translateY(-3px) scale(1.02);
        filter: brightness(1.12) saturate(1.15);
        box-shadow: 
          0 32px 80px rgba(180,100,50,0.42), 
          0 16px 40px rgba(0,0,0,0.38),
          inset 0 2px 0 rgba(255,255,255,0.65);
      }
      .mw-btnCopper:hover::before{
        opacity: 1;
        animation: mw-ultraShine 1100ms cubic-bezier(.2,.8,.2,1) both;
      }
      .mw-btnCopper:hover::after{
        opacity:1;
      }
      @keyframes mw-ultraShine{
        0%{ transform: rotate(-15deg) translateX(-65%); opacity:.0; }
        12%{ opacity:1; }
        100%{ transform: rotate(-15deg) translateX(65%); opacity:.0; }
      }
      .mw-btnCopper:active{
        transform: translateY(1px) scale(0.98);
        filter: brightness(1.05) saturate(1.08) contrast(1.03);
        box-shadow: 
          0 12px 40px rgba(180,100,50,0.32), 
          0 6px 20px rgba(0,0,0,0.28),
          inset 0 -2px 8px rgba(0,0,0,0.18);
      }

      /* Ghost button ULTRA: lift + glow ring */
      .mw-btnGhost{
        position:relative;
        overflow:hidden;
        transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
      }
      .mw-btnGhost::before{
        content:"";
        position:absolute;
        inset:-2px;
        border-radius:inherit;
        padding:2px;
        background: linear-gradient(135deg, rgba(210,180,150,0.65), rgba(180,140,100,0.65));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity:0;
        transition: opacity 180ms ease;
        pointer-events:none;
      }
      .mw-btnGhost:hover{
        transform: translateY(-2px);
        background: rgba(255,255,255,0.95);
        box-shadow: 
          0 20px 50px rgba(180,140,100,0.28), 
          0 10px 30px rgba(0,0,0,0.12);
      }
      .mw-btnGhost:hover::before{
        opacity:1;
      }
      .mw-btnGhost:active{
        transform: translateY(0px) scale(0.98);
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }

      /* Floating particles effect */
      @keyframes mw-float1 {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        33% { transform: translate(15px, -20px) scale(1.1); opacity: 0.7; }
        66% { transform: translate(-10px, -35px) scale(0.9); opacity: 0.5; }
      }
      @keyframes mw-float2 {
        0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
        50% { transform: translate(-20px, -25px) rotate(180deg); opacity: 0.65; }
      }
      @keyframes mw-float3 {
        0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.35; }
        40% { transform: translate(18px, -30px) scale(1.15); opacity: 0.75; }
        80% { transform: translate(-12px, -15px) scale(0.85); opacity: 0.45; }
      }

      /* Shimmer overlay for cards */
      @keyframes mw-shimmer {
        0% { transform: translateX(-100%) rotate(15deg); }
        100% { transform: translateX(200%) rotate(15deg); }
      }

      /* RESPONSIVE MEDIA QUERIES */
      @media (max-width: 768px) {
        body { --page-pad: 14px; }
        .mw-topBar { flex-direction: column; gap: 14px; }
        h1 { font-size: 26px !important; }
        .mw-actions { flex-direction: column; }
        .mw-btnCopper, .mw-btnGhost { 
          width: 100%; 
          min-width: auto;
          padding: 14px 16px;
        }
        .mw-messageText { font-size: 17px !important; }
        .mw-placeholderMark { width: 44px; height: 44px; }
        .mw-placeholderTitle { font-size: 15px; }
        .mw-shell, .mw-hero, .mw-messageCard, .mw-placeholder {
          box-shadow: 0 30px 100px rgba(0,0,0,0.35) !important;
        }
        .mw-shell { padding: 14px; }
        .mw-hero { padding: 14px; }
        .mw-messageCard { padding: 14px; }
        .mw-heroGlow { height: 150px; }
      }

      @media (max-width: 480px) {
        h1 { font-size: 22px !important; }
        .mw-kicker { font-size: 10px; letter-spacing: 1.8px; }
        .mw-miniStats { flex-direction: column; gap: 6px; }
        .mw-messageText { font-size: 16px !important; }
        .mw-messageTitle { font-size: 14px; }
        .mw-btnCopper, .mw-btnGhost { 
          font-size: 13px;
          padding: 12px 14px;
          letter-spacing: 0.1px;
        }
        .mw-placeholder { gap: 10px; padding: 12px; }
        .mw-placeholderMark { width: 38px; height: 38px; font-size: 18px; }
        .mw-placeholderTitle { font-size: 13px; }
        .mw-placeholderText { font-size: 12px; }
        .mw-shell, .mw-hero, .mw-messageCard, .mw-placeholder {
          box-shadow: 0 18px 60px rgba(0,0,0,0.30) !important;
        }
        .mw-shell { padding: 12px; }
        .mw-hero { padding: 12px; }
        .mw-messageCard { padding: 12px; }
        .mw-topBar { padding: 6px; }
      }

      @media (min-width: 769px) and (max-height: 600px) {
        .mw-messageWrap { min-height: 140px; }
        .mw-messageCard { padding: 14px; }
        .mw-messageText { font-size: 16px; }
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
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
    maxWidth: 980,
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
    padding: 22,
    position: "relative",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 10,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: 900,
    opacity: 0.68,
    color: "rgba(210,160,110,0.85)",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
  },
  h1: {
    margin: 0,
    fontSize: 36,
    letterSpacing: -0.9,
    lineHeight: 1.05,
    background: "linear-gradient(135deg, rgba(245,215,180,1) 0%, rgba(210,160,110,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "none",
  },
  miniStats: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(210,150,90,0.25)",
    background: "linear-gradient(135deg, rgba(60,40,25,0.70), rgba(48,32,20,0.80))",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35), " + "inset 0 1px 0 rgba(210,150,90,0.18)",
  },
  miniPill: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "rgba(220,180,130,0.95)",
  },
  dot: { width: 10, height: 10, borderRadius: 999, boxShadow: "0 0 0 4px rgba(0,0,0,0.04)" },
  hero: {
    position: "relative",
    marginTop: 8,
    borderRadius: 28,
    border: "1px solid rgba(210,140,70,0.22)",
    background: "linear-gradient(135deg, rgba(48,32,20,0.70) 0%, rgba(38,25,16,0.85) 100%)",
    boxShadow:
      "0 50px 150px rgba(0,0,0,0.50), " +
      "0 25px 70px rgba(210,140,70,0.12), " +
      "inset 0 1px 0 rgba(210,150,90,0.15)",
    padding: 22,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    inset: "-80px -40px auto -40px",
    height: 200,
    background:
      "radial-gradient(ellipse 60% 50% at 40% 55%, rgba(210,140,70,0.45), transparent 60%)," +
      "radial-gradient(ellipse 50% 40% at 65% 45%, rgba(180,100,50,0.35), transparent 65%)",
    filter: "blur(12px)",
    pointerEvents: "none",
    opacity: 0.85,
    zIndex: 0,
  },
  paperNoise: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.35,
    mixBlendMode: "overlay",
    background:
      "radial-gradient(circle 3px at 20% 30%, rgba(210,150,90,0.25), transparent)," +
      "radial-gradient(circle 2px at 65% 45%, rgba(180,120,70,0.22), transparent)," +
      "radial-gradient(circle 4px at 85% 70%, rgba(210,140,70,0.28), transparent)," +
      "radial-gradient(circle 2px at 40% 80%, rgba(190,130,80,0.20), transparent)," +
      "repeating-linear-gradient(90deg, transparent 0, rgba(210,150,90,0.04) 1px, transparent 2px, transparent 8px)," +
      "repeating-linear-gradient(0deg, transparent 0, rgba(180,120,70,0.03) 1px, transparent 2px, transparent 12px)",
    filter: "blur(0.3px)",
  },
  alert: {
    position: "relative",
    zIndex: 1,
    padding: 16,
    borderRadius: 22,
    border: "1px solid rgba(220,100,80,0.35)",
    background: "linear-gradient(135deg, rgba(80,35,25,0.65), rgba(65,28,20,0.75))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.35), " + "inset 0 1px 0 rgba(220,120,100,0.15)",
    marginBottom: 16,
  },
  alertTitle: { fontWeight: 950, marginBottom: 7, color: "rgba(240,160,140,1)" },
  alertText: { opacity: 0.88, color: "rgba(220,190,170,0.95)" },
  messageWrap: { position: "relative", zIndex: 1, display: "grid", gap: 12, minHeight: 220 },
  messageCard: {
    position: "relative",
    borderRadius: 28,
    border: "1px solid rgba(210,150,90,0.28)",
    background: "linear-gradient(135deg, rgba(55,38,25,0.85) 0%, rgba(45,30,20,0.92) 100%)",
    boxShadow:
      "0 60px 160px rgba(0,0,0,0.45), " +
      "0 30px 80px rgba(210,140,70,0.10), " +
      "inset 0 1px 0 rgba(210,150,90,0.18), " +
      "inset 0 -1px 8px rgba(0,0,0,0.35)",
    padding: 22,
    overflow: "hidden",
  },
  messageTitle: {
    fontWeight: 950,
    letterSpacing: 0.3,
    marginBottom: 14,
    opacity: 0.92,
    color: "rgba(220,180,130,1)",
    textShadow: "0 2px 6px rgba(0,0,0,0.4)",
  },
  messageText: {
    fontSize: 20,
    lineHeight: 1.58,
    fontWeight: 650,
    letterSpacing: -0.2,
    whiteSpace: "pre-wrap",
    color: "rgba(235,215,195,0.98)",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  caret: { display: "inline-block", marginLeft: 2, opacity: 0.65, color: "rgba(210,160,110,0.95)" },
  placeholder: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 22,
    borderRadius: 28,
    border: "1px solid rgba(210,150,90,0.22)",
    background: "linear-gradient(135deg, rgba(48,32,20,0.65), rgba(38,25,16,0.75))",
    boxShadow: "0 32px 80px rgba(0,0,0,0.32), " + "inset 0 1px 0 rgba(210,150,90,0.12)",
  },
  placeholderMark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 24,
    background:
      "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(180,110,60,1) 50%, rgba(140,80,40,1) 100%)",
    color: "rgba(30,18,10,1)",
    boxShadow:
      "0 24px 70px rgba(210,140,70,0.35), " +
      "0 12px 40px rgba(0,0,0,0.40), " +
      "inset 0 2px 0 rgba(255,220,180,0.45)",
    flex: "0 0 auto",
  },
  placeholderTitle: { fontWeight: 950, fontSize: 17, color: "rgba(230,200,170,1)" },
  placeholderText: { opacity: 0.82, lineHeight: 1.48, color: "rgba(210,185,160,0.95)" },
  actions: { position: "relative", zIndex: 1, display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 },
  btnCopper: {
    padding: "16px 24px",
    borderRadius: 20,
    border: "2px solid rgba(140,85,45,0.55)",
    background:
      "linear-gradient(135deg, " +
      "rgba(220,160,100,1) 0%, " +
      "rgba(190,130,75,1) 25%, " +
      "rgba(160,100,55,1) 50%, " +
      "rgba(140,85,45,1) 75%, " +
      "rgba(120,70,35,1) 100%)",
    boxShadow:
      "0 28px 75px rgba(180,100,50,0.35), " +
      "0 14px 40px rgba(0,0,0,0.35), " +
      "inset 0 2px 0 rgba(255,220,180,0.45), " +
      "inset 0 -2px 6px rgba(0,0,0,0.25)",
    fontWeight: 950,
    letterSpacing: 0.4,
    fontSize: 15,
    color: "rgba(25,15,8,1)",
    textShadow: "0 1px 2px rgba(255,220,180,0.35)",
    minWidth: 190,
  },
  btnGhost: {
    padding: "16px 22px",
    borderRadius: 20,
    border: "1px solid rgba(210,150,90,0.28)",
    background: "linear-gradient(135deg, rgba(55,38,25,0.75), rgba(45,30,20,0.85))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28), " + "inset 0 1px 0 rgba(210,150,90,0.18)",
    fontWeight: 900,
    letterSpacing: 0.3,
    fontSize: 14,
    color: "rgba(220,180,130,0.98)",
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  },
  rechargeHint: {
    position: "relative",
    zIndex: 1,
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    border: "1px solid rgba(210,140,70,0.18)",
    background: "rgba(60,40,25,0.45)",
    opacity: 0.88,
    fontWeight: 650,
    color: "rgba(210,175,140,0.95)",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
};
