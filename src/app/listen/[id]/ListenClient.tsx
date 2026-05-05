"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TTSResponse = {
  url: string;
  voiceProfile?: string;
  playbackRate?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
};

type BijouRow = {
  id_bijou: string;
  type_bijou: "murmures_IA" | "voix_enregistrée" | "voix_enregistree" | string;
  langue: "fr" | "en" | string;
  credits_restants: number;
  est_active: boolean;
};

type PersoRow = {
  prenom: string | null;
  lieu: string | null;
  souvenir: string | null;
  theme: string | null;
  sous_theme: string | null;
  voix: "masculin" | "feminin" | string | null;
};

type ListenLoadResponse = {
  success: boolean;
  data?: {
    bijou: BijouRow;
    personnalisation: PersoRow | null;
  };
  error?: string;
};

type ConsumeCreditResponse = {
  success: boolean;
  data?: {
    credits_restants: number;
  };
  error?: string;
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

const COPY = {
  fr: {
    kicker: "Grain atelier",
    h1: "Lecture du bijou",
    experienceActive: "Expérience active",
    choiceEyebrow: "Grain Atelier",
    choiceTitle1: "Choisissez l'expérience",
    choiceTitle2: "que vous souhaitez ouvrir.",
    choiceIntro:
      "Voix enregistrée pour écouter un message réel, Capsule spacio-temporelle pour confier une voix au temps, ou Murmures IA pour recevoir un message généré selon votre thème et votre paramétrage.",
    voixEnregistree: "Voix enregistrée",
    capsuleSpacioTemporelle: "Capsule spacio-temporelle",
    murmuresIA: "Murmures IA",
    dejaScelle: "Bijou déjà scellé",
    messageAttend: "Un message vous attend…",
    messageArrive: "Le message arrive…",
    messageTitle: "✨ Un message pour vous",
    placeholderTitle: "Un message vous attend.",
    placeholderPress: "Appuyez sur",
    placeholderSuffix: "pour le découvrir.",
    messageCredit: "Ce message a été créé spécialement pour vous.",
    btnPreparing: "Préparation du message…",
    btnPause: "⏸ Pause",
    btnListen: "▶ Écouter le message",
    btnEcouter: "Écouter",
    btnCreating: "Création du message…",
    btnReceive: "Recevoir mon message",
    btnBack: "Retour au choix",
    rechargeTitle: "Message momentanément indisponible",
    rechargeText: "Une nouvelle activation est nécessaire pour continuer.",
    rechargeCta: "Continuer →",
    errTitle: "Erreur",
    errLoading: "Erreur lors du chargement.",
    errNoId: "ID bijou manquant dans l'URL.",
    errNotFound: "Bijou non trouvé.",
    errNotActive: "Ce bijou n'est pas actif.",
    errNoCredits: "Ce message n'est pas disponible pour le moment.",
    errConsume: "Erreur lors de la consommation du crédit.",
    errNoPerso: "Personnalisation manquante.",
    errGeneration: "Erreur lors de la génération.",
    errMurmuresSealedVoix:
      "Ce bijou est déjà scellé en Murmures IA. La voix enregistrée n'est plus disponible.",
    errMurmuresSealed: "Ce bijou est déjà scellé en Murmures IA.",
    errVoixSealedMurmures:
      "Ce bijou est déjà scellé en voix enregistrée. Murmures IA n'est plus disponible.",
  },
  en: {
    kicker: "Grain atelier",
    h1: "Jewel experience",
    experienceActive: "Experience active",
    choiceEyebrow: "Grain Atelier",
    choiceTitle1: "Choose your experience",
    choiceTitle2: "to open.",
    choiceIntro:
      "Recorded voice to hear a real message, Space-Time Capsule to entrust a voice to time, or AI Whispers to receive a message generated from your theme and settings.",
    voixEnregistree: "Recorded voice",
    capsuleSpacioTemporelle: "Space-Time Capsule",
    murmuresIA: "AI Whispers",
    dejaScelle: "Jewel already sealed",
    messageAttend: "A message awaits you…",
    messageArrive: "Message arriving…",
    messageTitle: "✨ A message for you",
    placeholderTitle: "A message awaits you.",
    placeholderPress: "Press",
    placeholderSuffix: "to discover it.",
    messageCredit: "This message was created especially for you.",
    btnPreparing: "Preparing message…",
    btnPause: "⏸ Pause",
    btnListen: "▶ Listen to message",
    btnEcouter: "Listen",
    btnCreating: "Creating message…",
    btnReceive: "Receive my message",
    btnBack: "Back to choice",
    rechargeTitle: "Message temporarily unavailable",
    rechargeText: "A new activation is required to continue.",
    rechargeCta: "Continue →",
    errTitle: "Error",
    errLoading: "Loading error.",
    errNoId: "Jewel ID missing from URL.",
    errNotFound: "Jewel not found.",
    errNotActive: "This jewel is not active.",
    errNoCredits: "This message is not available at the moment.",
    errConsume: "Error consuming credit.",
    errNoPerso: "Personalisation missing.",
    errGeneration: "Generation error.",
    errMurmuresSealedVoix:
      "This jewel is already sealed as AI Whispers. Recorded voice is no longer available.",
    errMurmuresSealed: "This jewel is already sealed as AI Whispers.",
    errVoixSealedMurmures:
      "This jewel is already sealed as recorded voice. AI Whispers is no longer available.",
  },
} as const;

export default function ListenClient({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id_bijou = params?.id;

  const c = COPY[locale];
  const errLoading = c.errLoading;

  const [mode, setMode] = useState<"choice" | "ia">("choice");

  const [loading, setLoading] = useState(true);
  const [bijou, setBijou] = useState<BijouRow | null>(null);
  const [perso, setPerso] = useState<PersoRow | null>(null);

  const [message, setMessage] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState(0);

  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const playbackRateRef = useRef(1.0);
  const fadeInRef = useRef(300);
  const fadeOutRef = useRef(600);

  const silentLoad = React.useCallback(async function silentLoad() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/listen/${id_bijou}`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json().catch(() => ({}))) as ListenLoadResponse;

      if (!res.ok || !json.success || !json.data?.bijou) {
        throw new Error(json.error || errLoading);
      }

      setBijou(json.data.bijou);
      setPerso(json.data.personnalisation ?? null);

      return json.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : errLoading;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [errLoading, id_bijou]);

  useEffect(() => {
    if (!id_bijou) return;
    void silentLoad();
  }, [id_bijou, silentLoad]);

  useEffect(() => {
    const sealedType = String(bijou?.type_bijou ?? "");
    if (!id_bijou) return;
    if (sealedType === "voix_enregistree" || sealedType === "voix_enregistrée") {
      router.replace(`/listen/recorded/${id_bijou}`);
    }
  }, [bijou?.type_bijou, id_bijou, router]);

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
      if (i >= message.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [message]);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    };
  }, []);

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function fadeVolume(
    audio: HTMLAudioElement,
    from: number,
    to: number,
    ms: number
  ) {
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

    if (!message.trim()) {
      throw new Error("Message vide : reçois d’abord le message.");
    }

    setAudioLoading(true);

    try {
      const lang = safeLang(bijou?.langue);
      const gender = toTtsGender(perso?.voix);

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

      playbackRateRef.current =
        typeof data.playbackRate === "number" ? data.playbackRate : 1.0;
      fadeInRef.current =
        typeof data.fadeInMs === "number" ? data.fadeInMs : 300;
      fadeOutRef.current =
        typeof data.fadeOutMs === "number" ? data.fadeOutMs : 600;

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
    if (p && typeof p.then === "function") {
      await p;
    }

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
      if (audioUrl) {
        await playAudio();
      } else {
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
        if (p && typeof p.then === "function") {
          await p;
        }

        fadeVolume(audio, 0, 1, fadeInRef.current);
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
      }
    } catch (e) {
      stopAudio(true);
      console.error(e);
    }
  }

  async function discoverMessage() {
    if (!id_bijou) {
      setError("ID bijou manquant dans l'URL.");
      return;
    }

    setError(null);

    const loaded = !bijou || !perso ? await silentLoad() : null;
    const activeBijou = loaded?.bijou ?? bijou;
    const activePerso = loaded?.personnalisation ?? perso;

    if (!activeBijou) {
      setError("Bijou non trouvé.");
      return;
    }

    if (!activeBijou.est_active) {
      setError("Ce bijou n'est pas actif.");
      return;
    }

    if (activeBijou.credits_restants <= 0) {
      setError("Ce message n’est pas disponible pour le moment.");
      return;
    }

    setLoading(true);

    try {
      const consumeRes = await fetch(`/api/listen/${id_bijou}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consume-credit" }),
      });

      const consumeJson =
        (await consumeRes.json().catch(() => ({}))) as ConsumeCreditResponse;

      if (!consumeRes.ok || !consumeJson.success) {
        if (consumeJson.error === "NO_CREDITS_OR_INACTIVE") {
          setError("Ce message n’est pas disponible pour le moment.");
          return;
        }
        throw new Error(
          consumeJson.error || "Erreur lors de la consommation du crédit."
        );
      }

      setBijou((prev) =>
        prev
          ? {
              ...prev,
              credits_restants: Number(
                consumeJson.data?.credits_restants ?? prev.credits_restants
              ),
            }
          : prev
      );

      setAudioUrl(null);
      stopAudio(true);

      if (!activePerso) {
        setError(c.errNoPerso);
        return;
      }

      const p = activePerso;
      const prenom = cleanText(p.prenom) || "toi";
      const theme = cleanText(p.theme) || "un joli thème";
      const sous = cleanText(p.sous_theme);
      const lieu = cleanText(p.lieu);
      const souvenir = cleanText(p.souvenir);

      const res = await fetch("/api/murmure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom,
          theme,
          sous_theme: sous,
          lieu,
          souvenir,
          langue: activeBijou.langue,
          voix: p.voix ?? "feminin",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur génération texte");
      }

      const data = await res.json();
      const newMessage = String(data.text || "").trim();
      setMessage(newMessage);

      setAudioLoading(true);

      try {
        const lang = safeLang(activeBijou.langue);
        const gender = toTtsGender(activePerso?.voix);

        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newMessage,
            lang,
            voice: gender,
            meta: {
              theme: activePerso?.theme,
              subtheme: activePerso?.sous_theme,
            },
          }),
        });

        if (!ttsRes.ok) {
          const err = await ttsRes.json().catch(() => ({}));
          throw new Error(err?.error || "Erreur TTS");
        }

        const ttsData = (await ttsRes.json()) as TTSResponse;
        playbackRateRef.current =
          typeof ttsData.playbackRate === "number"
            ? ttsData.playbackRate
            : 1.0;
        fadeInRef.current =
          typeof ttsData.fadeInMs === "number" ? ttsData.fadeInMs : 300;
        fadeOutRef.current =
          typeof ttsData.fadeOutMs === "number" ? ttsData.fadeOutMs : 600;

        setAudioUrl(ttsData.url);

        setTimeout(async () => {
          try {
            await playAudio();
          } catch (err) {
            console.error("Auto-play error:", err);
          }
        }, 600);
      } catch (ttsError: unknown) {
        console.error("Erreur génération audio:", ttsError);
      } finally {
        setAudioLoading(false);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : c.errGeneration;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = audioLoading
    ? c.btnPreparing
    : audioUrl
      ? isPlaying
        ? c.btnPause
        : c.btnListen
      : c.btnEcouter;

  const isActive = bijou?.est_active ?? null;
  const canUse = bijou
    ? Boolean(bijou.est_active) && Number(bijou.credits_restants) > 0
    : false;
  const sealedType = String(bijou?.type_bijou ?? "");
  const isRecordedSealed = sealedType === "voix_enregistree";
  const isMurmuresSealed = sealedType === "murmures_IA";
  const isAnySealed = isRecordedSealed || isMurmuresSealed;

  function openRecordedVoice() {
    if (!id_bijou) {
      setError(c.errNoId);
      return;
    }

    if (isMurmuresSealed) {
      setError(c.errMurmuresSealedVoix);
      return;
    }

    router.push(`/setup/${id_bijou}/firstname`);
  }

  function openCapsule() {
    if (!id_bijou) {
      setError(c.errNoId);
      return;
    }

    if (isMurmuresSealed) {
      setError(c.errMurmuresSealedVoix);
      return;
    }

    router.push(`/setup/${id_bijou}/firstname?variant=capsule`);
  }

  function openMurmures() {
    if (!id_bijou) {
      setError(c.errNoId);
      return;
    }

    if (isMurmuresSealed) {
      setError(c.errMurmuresSealed);
      return;
    }

    if (isRecordedSealed) {
      setError(c.errVoixSealedMurmures);
      return;
    }

    router.push(`/setup/${id_bijou}/murmures`);
  }

  return (
    <main className="mw-shell min-h-screen p-4">
      {/* Effets décoratifs globaux */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <div className="absolute top-[15%] left-[12%] w-2 h-2 rounded-full" style={{background: "radial-gradient(circle, rgba(210,150,90,0.65), transparent)", filter: "blur(1px)", animation: "mw-float1 8s ease-in-out infinite"}} />
        <div className="absolute top-[25%] right-[18%] w-1.5 h-1.5 rounded-full" style={{background: "radial-gradient(circle, rgba(180,120,70,0.55), transparent)", filter: "blur(1px)", animation: "mw-float2 10s ease-in-out infinite"}} />
        <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 rounded-full" style={{background: "radial-gradient(circle, rgba(200,140,85,0.60), transparent)", filter: "blur(1px)", animation: "mw-float3 9s ease-in-out infinite"}} />
        <div className="absolute top-[60%] right-[25%] w-1.5 h-1.5 rounded-full" style={{background: "radial-gradient(circle, rgba(190,130,80,0.50), transparent)", filter: "blur(1px)", animation: "mw-float1 11s ease-in-out infinite 2s"}} />
      </div>

      <div className="mw-shell mx-auto max-w-3xl relative">
        {/* TopBar */}
        {mode !== "choice" && (
          <div className="mw-topBar flex justify-between items-start gap-3 p-3">
            <div className="grid gap-1">
              <div className="mw-kicker text-xs uppercase tracking-widest font-bold text-[rgba(210,160,110,0.85)] opacity-70">{c.kicker}</div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[rgba(245,215,180,1)] to-[rgba(210,160,110,1)] bg-clip-text text-transparent">{c.h1}</h1>
            </div>
            <div className="mw-miniStats flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(210,150,90,0.25)] bg-gradient-to-r from-[rgba(60,40,25,0.70)] to-[rgba(48,32,20,0.80)]">
              <span className="text-xs font-bold text-[rgba(220,180,130,0.95)] opacity-60">{c.experienceActive}</span>
              {isActive !== null && (
                <span className="w-2.5 h-2.5 rounded-full" style={{background: isActive ? "rgba(60,190,120,1)" : "rgba(255,120,120,1)"}} />
              )}
            </div>
          </div>
        )}

        {/* Section principale */}
        <section className="mw-hero relative mt-2 rounded-2xl border border-[rgba(210,140,70,0.22)] bg-gradient-to-br from-[rgba(48,32,20,0.70)] to-[rgba(38,25,16,0.85)] shadow-xl p-6 overflow-hidden">
          <div className="mw-heroGlow absolute inset-x-0 -top-20 h-48 pointer-events-none opacity-85 z-0" style={{background: "radial-gradient(ellipse 60% 50% at 40% 55%, rgba(210,140,70,0.45), transparent 60%),radial-gradient(ellipse 50% 40% at 65% 45%, rgba(180,100,50,0.35), transparent 65%)", filter: "blur(12px)"}} />
          <div className="absolute inset-0 pointer-events-none z-0 opacity-35 mix-blend-overlay" style={{background: "radial-gradient(circle 3px at 20% 30%, rgba(210,150,90,0.25), transparent),radial-gradient(circle 2px at 65% 45%, rgba(180,120,70,0.22), transparent),radial-gradient(circle 4px at 85% 70%, rgba(210,140,70,0.28), transparent),radial-gradient(circle 2px at 40% 80%, rgba(190,130,80,0.20), transparent),repeating-linear-gradient(90deg, transparent 0, rgba(210,150,90,0.04) 1px, transparent 2px, transparent 8px),repeating-linear-gradient(0deg, transparent 0, rgba(180,120,70,0.03) 1px, transparent 2px, transparent 12px)"}} />

          <audio ref={audioRef} src={audioUrl ?? undefined} />

          {error && (
            <div className="mw-card p-4 mb-4 border border-red-300 text-red-200">
              <div className="font-extrabold mb-1 text-[rgba(240,160,140,1)]">{c.errTitle}</div>
              <div className="opacity-90 text-[rgba(220,190,170,0.95)]">{error}</div>
            </div>
          )}

          {mode === "choice" ? (
            <div className="mw-choiceWrap grid gap-5 justify-items-center text-center p-6 w-full">
              <div className="mw-choiceEyebrow text-xs uppercase tracking-widest text-[rgba(205,175,145,0.62)] font-semibold">{c.choiceEyebrow}</div>
              <div className="mw-choiceTitleMain text-3xl md:text-5xl font-extrabold text-[rgba(243,236,228,0.98)] max-w-full text-shadow-lg overflow-wrap-anywhere">{c.choiceTitle1}<br />{c.choiceTitle2}</div>
              <div className="mw-choiceIntro text-lg text-[rgba(223,203,182,0.88)] leading-relaxed max-w-2xl mx-auto">{c.choiceIntro}</div>
              <div className="mw-choiceButtonsRow flex flex-wrap justify-center gap-3 w-full mt-2">
                <button
                  type="button"
                  className="mw-btn-primary mw-choiceButton w-full max-w-xs py-3 text-sm uppercase font-bold"
                  style={{opacity: isAnySealed ? 0.45 : 1, cursor: isAnySealed ? "not-allowed" : "pointer"}}
                  onClick={openRecordedVoice}
                  disabled={isAnySealed}
                >
                  {c.voixEnregistree}
                </button>
                <button
                  type="button"
                  className="mw-btn-primary mw-choiceButton w-full max-w-xs py-3 text-sm uppercase font-bold"
                  style={{opacity: isAnySealed ? 0.45 : 1, cursor: isAnySealed ? "not-allowed" : "pointer"}}
                  onClick={openCapsule}
                  disabled={isAnySealed}
                >
                  {c.capsuleSpacioTemporelle}
                </button>
                <button
                  type="button"
                  className="mw-btn-ghost mw-choiceButton w-full max-w-xs py-3 text-sm uppercase font-bold"
                  style={{opacity: isRecordedSealed || isMurmuresSealed ? 0.45 : 1, cursor: isRecordedSealed || isMurmuresSealed ? "not-allowed" : "pointer"}}
                  onClick={openMurmures}
                  disabled={isRecordedSealed || isMurmuresSealed}
                >
                  {c.murmuresIA}
                </button>
              </div>
              {isAnySealed && (
                <div className="mw-choiceFootnote text-lg font-extrabold text-[rgba(255,230,196,0.98)] bg-gradient-to-r from-[rgba(95,60,35,0.72)] to-[rgba(78,47,27,0.82)] rounded-full border border-[rgba(230,175,120,0.40)] px-6 py-2 mt-2 animate-pulse">{c.dejaScelle}</div>
              )}
            </div>
          ) : (
            <>
              <div className="mw-messageWrap grid gap-3 min-h-[220px]">
                {!typed && !loading && (
                  <div className="text-center text-[rgba(230,200,170,0.92)] text-base mb-2">{c.messageAttend}</div>
                )}
                {loading && (
                  <div className="text-center text-[rgba(220,190,170,0.9)] text-base mb-2">{c.messageArrive}</div>
                )}
                {typed ? (
                  <div key={messageKey} className={`mw-messageCard relative rounded-2xl border border-[rgba(210,150,90,0.28)] bg-gradient-to-br from-[rgba(55,38,25,0.85)] to-[rgba(45,30,20,0.92)] shadow-lg p-6 overflow-hidden ${isPlaying ? "animate-pulse" : ""}`}>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0" style={{background: "linear-gradient(110deg, transparent 40%, rgba(210,160,110,0.22) 50%, transparent 60%)", animation: "mw-shimmer 6s ease-in-out infinite"}} />
                    <div className="mw-messageTitle font-extrabold mb-3 text-[rgba(220,180,130,1)] text-lg z-10 relative">{c.messageTitle}</div>
                    <div className="mw-messageText text-base font-semibold text-[rgba(235,215,195,0.98)] z-10 relative whitespace-pre-wrap">
                      <span>{typed}</span>
                      <span className="mw-caret ml-1 opacity-65 text-[rgba(210,160,110,0.95)]" aria-hidden>▍</span>
                    </div>
                  </div>
                ) : (
                  <div className="mw-placeholder flex items-center gap-4 p-6 rounded-2xl border border-[rgba(210,150,90,0.22)] bg-gradient-to-br from-[rgba(48,32,20,0.65)] to-[rgba(38,25,16,0.75)] shadow-lg">
                    <div className="mw-placeholderMark w-12 h-12 rounded-lg flex items-center justify-center font-extrabold text-2xl bg-gradient-to-br from-[rgba(220,160,100,1)] via-[rgba(180,110,60,1)] to-[rgba(140,80,40,1)] text-[rgba(30,18,10,1)] shadow-lg">✦</div>
                    <div className="grid gap-1">
                      <div className="mw-placeholderTitle font-extrabold text-base text-[rgba(230,200,170,1)]">{c.placeholderTitle}</div>
                      <div className="mw-placeholderText text-[rgba(210,185,160,0.95)] text-sm">{c.placeholderPress} <b>{c.btnReceive}</b> {c.placeholderSuffix}</div>
                    </div>
                  </div>
                )}
                {typed && !isPlaying && !audioLoading && (
                  <div className="text-center mt-3 text-xs text-[rgba(210,185,160,0.78)]">{c.messageCredit}</div>
                )}
              </div>
              <div className="mw-actions flex gap-3 flex-wrap mt-4">
                <button
                  onClick={discoverMessage}
                  disabled={loading || !canUse}
                  className="mw-btnCopper px-6 py-3 min-w-[190px] text-base font-extrabold"
                  style={{opacity: loading || !canUse ? 0.65 : 1, cursor: loading || !canUse ? "not-allowed" : "pointer"}}
                >
                  <span className="relative">{loading ? c.btnCreating : c.btnReceive}</span>
                </button>
                <button
                  onClick={toggleAudio}
                  disabled={!typed || audioLoading}
                  className="mw-btnGhost px-6 py-3 text-base font-bold"
                  style={{opacity: typed && !audioLoading ? 1 : 0.55, cursor: typed && !audioLoading ? "pointer" : "not-allowed"}}
                  title="Lecture audio"
                >
                  {buttonLabel}
                </button>
                <button
                  onClick={() => {
                    stopAudio(true);
                    setAudioUrl(null);
                    setTyped("");
                    setMessage("");
                    setError(null);
                    setMode("choice");
                  }}
                  className="mw-btnGhost px-6 py-3 text-base font-bold"
                >
                  {c.btnBack}
                </button>
              </div>
              {bijou && !canUse && bijou.credits_restants === 0 && (
                <div className="mt-6">
                  <div className="mw-card flex items-center gap-4 p-5 border border-[rgba(255,150,80,0.35)] bg-gradient-to-br from-[rgba(80,45,25,0.85)] to-[rgba(65,35,15,0.92)] shadow-lg">
                    <div className="text-2xl">⚡</div>
                    <div className="flex-1 grid gap-1">
                      <div className="font-extrabold text-base text-[rgba(255,200,140,1)]">{c.rechargeTitle}</div>
                      <div className="text-sm text-[rgba(220,175,130,0.95)]">{c.rechargeText}</div>
                    </div>
                    <button
                      onClick={() => { window.location.href = `/recharge/${id_bijou}`; }}
                      className="mw-rechargeBtn px-5 py-2 rounded-lg font-extrabold text-sm bg-gradient-to-r from-[rgba(255,160,90,0.95)] to-[rgba(220,130,60,0.95)] text-[rgba(35,20,10,1)] border border-[rgba(255,150,80,0.45)] shadow"
                    >
                      {c.rechargeCta}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <PremiumCss />
    </main>
  );
}

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

      .mw-rechargeBtn {
        position: relative;
        overflow: hidden;
      }
      .mw-rechargeBtn:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 50px rgba(255,150,80,0.25),
          0 10px 25px rgba(0,0,0,0.35),
          inset 0 1px 0 rgba(255,230,200,0.4);
      }
      .mw-rechargeBtn:active {
        transform: translateY(0px) scale(0.98);
      }

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

      @keyframes mw-shimmer {
        0% { transform: translateX(-100%) rotate(15deg); }
        100% { transform: translateX(200%) rotate(15deg); }
      }

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

        .mw-choiceWrap {
          padding: 18px 2px 10px !important;
          gap: 14px !important;
        }
        .mw-choiceEyebrow {
          letter-spacing: 2.4px !important;
          font-size: 11px !important;
        }
        .mw-choiceTitleMain {
          font-size: 34px !important;
          line-height: 1.2 !important;
          max-width: 100% !important;
        }
        .mw-choiceIntro {
          font-size: 17px !important;
          line-height: 1.45 !important;
          max-width: 100% !important;
        }
        .mw-choiceButtonsRow {
          width: 100% !important;
          gap: 10px !important;
        }
        .mw-choiceButton {
          width: 100% !important;
          min-width: 0 !important;
          padding: 14px 14px !important;
          letter-spacing: 1.5px !important;
          font-size: 13px !important;
        }
        .mw-choiceFootnote {
          font-size: 20px !important;
          line-height: 1.2 !important;
          padding: 10px 14px !important;
          max-width: 100% !important;
        }
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
        .mw-rechargeCard {
          flex-direction: column;
          gap: 12px;
        }

        .mw-choiceWrap {
          padding: 14px 0 8px !important;
          gap: 12px !important;
        }
        .mw-choiceEyebrow {
          letter-spacing: 1.8px !important;
          font-size: 10px !important;
        }
        .mw-choiceTitleMain {
          font-size: 28px !important;
          line-height: 1.2 !important;
        }
        .mw-choiceIntro {
          font-size: 15px !important;
          line-height: 1.4 !important;
        }
        .mw-choiceButton {
          font-size: 12px !important;
          letter-spacing: 1px !important;
          padding: 12px 12px !important;
        }
        .mw-choiceFootnote {
          font-size: 17px !important;
          padding: 8px 12px !important;
        }
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
    minHeight: "100dvh",
    padding: "clamp(12px, 4vw, 22px)",
    fontFamily: "system-ui",
    color: "rgba(245,235,225,0.98)",
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    background:
      "radial-gradient(1400px 800px at 8% 0%, rgba(180,120,60,0.18), transparent 50%)," +
      "radial-gradient(1000px 700px at 92% 15%, rgba(210,140,70,0.22), transparent 55%)," +
      "radial-gradient(800px 600px at 50% 100%, rgba(100,50,20,0.25), transparent 60%)," +
      "linear-gradient(180deg, rgba(42,28,18,1) 0%, rgba(35,22,14,1) 40%, rgba(28,18,12,1) 100%)",
  },
  shell: {
    width: "100%",
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
    background:
      "linear-gradient(135deg, rgba(245,215,180,1) 0%, rgba(210,160,110,1) 100%)",
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
    background:
      "linear-gradient(135deg, rgba(60,40,25,0.70), rgba(48,32,20,0.80))",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(210,150,90,0.18)",
  },
  miniPill: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "rgba(220,180,130,0.95)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    boxShadow: "0 0 0 4px rgba(0,0,0,0.04)",
  },
  hero: {
    position: "relative",
    marginTop: 8,
    borderRadius: 28,
    border: "1px solid rgba(210,140,70,0.22)",
    background:
      "linear-gradient(135deg, rgba(48,32,20,0.70) 0%, rgba(38,25,16,0.85) 100%)",
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
    background:
      "linear-gradient(135deg, rgba(80,35,25,0.65), rgba(65,28,20,0.75))",
    boxShadow:
      "0 24px 70px rgba(0,0,0,0.35), inset 0 1px 0 rgba(220,120,100,0.15)",
    marginBottom: 16,
  },
  alertTitle: {
    fontWeight: 950,
    marginBottom: 7,
    color: "rgba(240,160,140,1)",
  },
  alertText: {
    opacity: 0.88,
    color: "rgba(220,190,170,0.95)",
  },
  choiceWrap: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: "clamp(10px, 2.8vw, 20px)",
    justifyItems: "center",
    textAlign: "center",
    padding: "clamp(12px, 3vw, 36px) 4px clamp(8px, 2.5vw, 20px)",
    width: "100%",
  },
  choiceEyebrow: {
    fontSize: "clamp(10px, 2.4vw, 12px)",
    letterSpacing: "clamp(1.4px, 1vw, 6px)",
    textTransform: "uppercase",
    color: "rgba(205,175,145,0.62)",
    fontWeight: 600,
  },
  choiceTitleMain: {
    fontSize: "clamp(30px, 11vw, 52px)",
    lineHeight: 1.16,
    letterSpacing: "clamp(-0.3px, -0.08vw, -0.8px)",
    color: "rgba(243,236,228,0.98)",
    maxWidth: "100%",
    textShadow: "0 8px 30px rgba(0,0,0,0.35)",
    overflowWrap: "anywhere",
  },
  choiceIntro: {
    textAlign: "center",
    color: "rgba(223,203,182,0.88)",
    fontSize: "clamp(15px, 4.6vw, 22px)",
    lineHeight: 1.45,
    maxWidth: "min(820px, 100%)",
    margin: "0 auto",
    overflowWrap: "anywhere",
  },
  choiceButtonsRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "clamp(8px, 2vw, 14px)",
    marginTop: 8,
    width: "100%",
  },
  choiceButtonPrimary: {
    appearance: "none",
    borderRadius: 999,
    border: "1px solid rgba(220,190,160,0.26)",
    background:
      "linear-gradient(135deg, rgba(245,224,196,0.96) 0%, rgba(228,196,158,0.96) 100%)",
    color: "rgba(45,28,16,0.95)",
    fontSize: "clamp(12px, 3.2vw, 14px)",
    fontWeight: 800,
    letterSpacing: "clamp(0.8px, 0.35vw, 3px)",
    textTransform: "uppercase",
    padding: "clamp(12px, 2.8vw, 16px) clamp(12px, 3.2vw, 28px)",
    width: "min(100%, 360px)",
    minWidth: 0,
    cursor: "pointer",
    whiteSpace: "normal",
    lineHeight: 1.25,
    boxShadow:
      "0 18px 46px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,245,225,0.82)",
  },
  choiceButtonSecondary: {
    appearance: "none",
    borderRadius: 999,
    border: "1px solid rgba(220,190,160,0.22)",
    background:
      "linear-gradient(135deg, rgba(75,55,42,0.64) 0%, rgba(58,41,30,0.74) 100%)",
    color: "rgba(233,218,202,0.95)",
    fontSize: "clamp(12px, 3.2vw, 14px)",
    fontWeight: 700,
    letterSpacing: "clamp(0.8px, 0.35vw, 3px)",
    textTransform: "uppercase",
    padding: "clamp(12px, 2.8vw, 16px) clamp(12px, 3.2vw, 28px)",
    width: "min(100%, 360px)",
    minWidth: 0,
    cursor: "pointer",
    whiteSpace: "normal",
    lineHeight: 1.25,
    boxShadow:
      "0 18px 46px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  choiceFootnote: {
    textAlign: "center",
    color: "rgba(255,230,196,0.98)",
    fontSize: "clamp(16px, 5vw, 28px)",
    lineHeight: 1.2,
    fontWeight: 900,
    letterSpacing: 0.6,
    marginTop: 14,
    padding: "clamp(8px, 2vw, 10px) clamp(12px, 3.2vw, 22px)",
    maxWidth: "100%",
    overflowWrap: "anywhere",
    borderRadius: 999,
    border: "1px solid rgba(230,175,120,0.40)",
    background:
      "linear-gradient(135deg, rgba(95,60,35,0.72) 0%, rgba(78,47,27,0.82) 100%)",
    textShadow: "0 2px 14px rgba(255,170,90,0.35)",
    animation: "mw-sealedPulse 2.2s ease-in-out infinite",
  },
  messageWrap: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: 12,
    minHeight: 220,
  },
  messageCard: {
    position: "relative",
    borderRadius: 28,
    border: "1px solid rgba(210,150,90,0.28)",
    background:
      "linear-gradient(135deg, rgba(55,38,25,0.85) 0%, rgba(45,30,20,0.92) 100%)",
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
  caret: {
    display: "inline-block",
    marginLeft: 2,
    opacity: 0.65,
    color: "rgba(210,160,110,0.95)",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 22,
    borderRadius: 28,
    border: "1px solid rgba(210,150,90,0.22)",
    background:
      "linear-gradient(135deg, rgba(48,32,20,0.65), rgba(38,25,16,0.75))",
    boxShadow:
      "0 32px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(210,150,90,0.12)",
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
  placeholderTitle: {
    fontWeight: 950,
    fontSize: 17,
    color: "rgba(230,200,170,1)",
  },
  placeholderText: {
    opacity: 0.82,
    lineHeight: 1.48,
    color: "rgba(210,185,160,0.95)",
  },
  actions: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 16,
  },
  btnCopper: {
    padding: "16px 24px",
    borderRadius: 20,
    border: "2px solid rgba(140,85,45,0.55)",
    background:
      "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(190,130,75,1) 25%, rgba(160,100,55,1) 50%, rgba(140,85,45,1) 75%, rgba(120,70,35,1) 100%)",
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
    background:
      "linear-gradient(135deg, rgba(55,38,25,0.75), rgba(45,30,20,0.85))",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.28), inset 0 1px 0 rgba(210,150,90,0.18)",
    fontWeight: 900,
    letterSpacing: 0.3,
    fontSize: 14,
    color: "rgba(220,180,130,0.98)",
    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
  },
  rechargeContainer: {
    position: "relative" as const,
    zIndex: 1,
  },
  rechargeCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 22,
    border: "1.5px solid rgba(255,150,80,0.35)",
    background:
      "linear-gradient(135deg, rgba(80,45,25,0.85), rgba(65,35,15,0.92))",
    boxShadow:
      "0 28px 70px rgba(255,150,80,0.12), " +
      "0 14px 40px rgba(0,0,0,0.35), " +
      "inset 0 1px 0 rgba(255,180,120,0.15)",
  },
  rechargeIcon: {
    fontSize: 28,
    lineHeight: 1,
    flex: "0 0 auto",
  },
  rechargeMeta: {
    flex: 1,
    display: "grid",
    gap: 4,
  },
  rechargeTitle: {
    fontWeight: 950,
    fontSize: 15,
    color: "rgba(255,200,140,1)",
    letterSpacing: 0.2,
  },
  rechargeText: {
    fontSize: 13,
    opacity: 0.85,
    color: "rgba(220,175,130,0.95)",
    lineHeight: 1.4,
  },
  rechargeBtn: {
    padding: "12px 20px",
    borderRadius: 16,
    border: "1.5px solid rgba(255,150,80,0.45)",
    background:
      "linear-gradient(135deg, rgba(255,160,90,0.95), rgba(220,130,60,0.95))",
    fontWeight: 950,
    letterSpacing: 0.3,
    fontSize: 13,
    color: "rgba(35,20,10,1)",
    textShadow: "0 1px 2px rgba(255,220,180,0.35)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    transition: "all 200ms cubic-bezier(.2,.7,.2,1)",
  },
};

void S;