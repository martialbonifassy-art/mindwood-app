"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";

type ListenPayload = {
  id: string;
  firstName?: string | null;
  theme?: string | null;
  language?: string | null;
  audioUrl: string;
  remainingListens: number;
};

type Stage =
  | "arrival"
  | "prelude"
  | "breath"
  | "player"
  | "outro"
  | "recharge"
  | "error";

type ApiResponse = {
  success: boolean;
  data?: ListenPayload;
  error?: string;
};

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
};

const softButton =
  "inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-center text-sm uppercase tracking-[0.14em] text-stone-100 backdrop-blur-sm transition hover:bg-white/14 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40 whitespace-normal leading-relaxed sm:w-auto sm:px-6 sm:tracking-[0.24em]";
const COPY = {
  fr: {
    arrivalText: "Ce bijou contient quelque chose pour vous.",
    listeningLabel: "Écoute…",
    preludeText: "Prenez un instant.",
    errUnavailable: "Ce murmure est indisponible.",
    errOpenFailed: "Une erreur est survenue lors de l’ouverture du murmure.",
    errPlaybackStart: "Impossible de lancer l’écoute.",
    errPlaybackFailed: "La lecture n’a pas pu démarrer.",
    errAudio: "L’audio n’a pas pu être chargé.",
    checkingPayment: "Vérification du paiement en cours…",
    errRechargeNotConfirmed: "Le rechargement n’est pas encore confirmé. Réessayez dans quelques secondes.",
    rechargeRestored: "Les écoutes ont été restaurées. Vous pouvez reprendre le murmure.",
    rechargePending: "Le paiement n’est pas encore visible. Revenez dans un instant puis vérifiez à nouveau.",
    errCheckPayment: "Impossible de vérifier le paiement pour le moment.",
    openingPayment: "Ouverture du paiement…",
    errCheckoutFailed: "Impossible de créer la session de paiement.",
    errCheckoutUnavailable: "Le paiement n’a pas pu être ouvert pour le moment.",
    forPrefix: "Pour ",
    forYou: "Pour vous",
    intentionPrefix: "Intention : ",
    intimateMessage: "Un message façonné, intime et scellé.",
    readyBtn: "Je suis prêt",
    preludeEyebrow: "Prenez ce moment",
    preludeLines: [
      "Avant d’écouter…",
      "Prenez un instant.",
      "Laissez le silence vous rejoindre.",
      "Ce murmure vous est destiné.",
    ],
    listenWhisperBtn: "Écouter le murmure",
    preparingBtn: "Préparation…",
    listensLeft1: "écoute restante",
    listensLeftN: " écoutes restantes",
    playerEyebrow: "Lecture",
    whisperPrefix: "Un murmure pour ",
    whisperForYou: "Un murmure pour vous",
    settleWords: "Laissez les mots se déposer en vous.",
    pauseBtn: "Suspendre",
    resumeBtn: "Reprendre",
    listenBtn: "Écouter",
    outroEyebrowRecharge: "Dernière écoute",
    outroEyebrowAfter: "Après",
    outroTextRecharge: "Ce murmure a été entendu une dernière fois.",
    outroTextNormal: "Ce murmure fait maintenant partie de vous.",
    outroSubtextRecharge: "Pour le raviver, vous pouvez ouvrir 10 nouvelles écoutes.",
    outroSubtextNormal: "Il restera ici, scellé dans le bijou.",
    reactivateBtn: "Réactiver 10 écoutes – 5€",
    openingBtn: "Ouverture…",
    paidBtn: "J’ai payé, reprendre l’écoute",
    checkingBtn: "Vérification…",
    closeBtn: "Fermer",
    replayBtn: "Réécouter",
    paymentNote: "Le paiement s’ouvrira puis vous reviendrez automatiquement sur Grain Atelier une fois terminé.",
    rechargeEyebrow: "Écoutes épuisées",
    rechargeTitle: "Ce murmure peut encore revivre.",
    rechargeText: "Toutes les écoutes ont été utilisées. Ouvrez 10 nouvelles écoutes pour 5€ puis revenez ici pour reprendre le murmure.",
    errorEyebrow: "Ouverture impossible",
    errorTitle: "Ce murmure n’a pas pu s’ouvrir correctement.",
    errorDefault: "Le murmure est peut-être indisponible, déjà expiré ou en cours de préparation.",
    retryBtn: "Réessayer",
  },
  en: {
    arrivalText: "This jewel contains something for you.",
    listeningLabel: "Listening…",
    preludeText: "Take a moment.",
    errUnavailable: "This whisper is unavailable.",
    errOpenFailed: "An error occurred while opening the whisper.",
    errPlaybackStart: "Unable to start playback.",
    errPlaybackFailed: "Playback could not start.",
    errAudio: "The audio could not be loaded.",
    checkingPayment: "Checking payment…",
    errRechargeNotConfirmed: "Recharge not yet confirmed. Try again in a few seconds.",
    rechargeRestored: "Listens restored. You can resume the whisper.",
    rechargePending: "Payment not yet visible. Come back in a moment and check again.",
    errCheckPayment: "Unable to verify payment at the moment.",
    openingPayment: "Opening payment…",
    errCheckoutFailed: "Unable to create payment session.",
    errCheckoutUnavailable: "Payment could not be opened at the moment.",
    forPrefix: "For ",
    forYou: "For you",
    intentionPrefix: "Intention: ",
    intimateMessage: "A crafted, intimate, sealed message.",
    readyBtn: "I’m ready",
    preludeEyebrow: "Take this moment",
    preludeLines: [
      "Before you listen…",
      "Take a moment.",
      "Let the silence find you.",
      "This whisper is meant for you.",
    ],
    listenWhisperBtn: "Listen to the whisper",
    preparingBtn: "Preparing…",
    listensLeft1: "listen left",
    listensLeftN: " listens left",
    playerEyebrow: "Playing",
    whisperPrefix: "A whisper for ",
    whisperForYou: "A whisper for you",
    settleWords: "Let the words settle within you.",
    pauseBtn: "Pause",
    resumeBtn: "Resume",
    listenBtn: "Listen",
    outroEyebrowRecharge: "Last listen",
    outroEyebrowAfter: "After",
    outroTextRecharge: "This whisper has been heard one last time.",
    outroTextNormal: "This whisper is now part of you.",
    outroSubtextRecharge: "To revive it, you can open 10 new listens.",
    outroSubtextNormal: "It will remain here, sealed in the jewel.",
    reactivateBtn: "Reactivate 10 listens – $5",
    openingBtn: "Opening…",
    paidBtn: "I’ve paid, resume listening",
    checkingBtn: "Checking…",
    closeBtn: "Close",
    replayBtn: "Listen again",
    paymentNote: "Payment will open and you’ll return to Grain Atelier automatically once done.",
    rechargeEyebrow: "Listens exhausted",
    rechargeTitle: "This whisper can live again.",
    rechargeText: "All listens have been used. Open 10 new listens for $5, then come back here to resume the whisper.",
    errorEyebrow: "Cannot open",
    errorTitle: "This whisper could not be opened correctly.",
    errorDefault: "The whisper may be unavailable, already expired, or still being prepared.",
    retryBtn: "Try again",
  },
};


export default function MurmureListenClient({ locale = "fr" }: { locale?: "fr" | "en" }) {
  const params = useParams();
  const id = useMemo(() => String(params?.id ?? ""), [params]);
  const c = COPY[locale];
  const { errAudio, errOpenFailed, errUnavailable, forPrefix, forYou, listeningLabel } = c;

  const [stage, setStage] = useState<Stage>("arrival");
  const [payload, setPayload] = useState<ListenPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [displayLine, setDisplayLine] = useState<string>(listeningLabel);
  const [isCheckingRecharge, setIsCheckingRecharge] = useState(false);
  const [rechargeMessage, setRechargeMessage] = useState("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasEndedRef = useRef(false);
  const playbackConsumedRef = useRef(false);
  const preludeTimeoutRef = useRef<number | null>(null);
  const breathTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        setRechargeMessage("");
        setIsReadyToPlay(false);
        setHasStarted(false);
        setHasEnded(false);
        hasEndedRef.current = false;
        playbackConsumedRef.current = false;
        setCurrentTime(0);
        setDuration(0);

        const res = await fetch(`/api/murmures/${id}/listen`, {
          method: "GET",
          cache: "no-store",
        });

        const json = (await res.json()) as ApiResponse;
        if (!res.ok || !json.success || !json.data?.audioUrl) {
          throw new Error(json.error || errUnavailable);
        }

        if (!isMounted) return;
        setPayload(json.data);

        if (json.data.remainingListens <= 0) {
          setStage("recharge");
          return;
        }

        setStage("arrival");
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : errOpenFailed
        );
        setStage("error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (id) {
      void load();
    }

    return () => {
      isMounted = false;
    };
  }, [errOpenFailed, errUnavailable, id]);

  useEffect(() => {
    if (!payload?.audioUrl) return;

    const audio = new Audio(payload.audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const markReady = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsReadyToPlay(true);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.12 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        setIsPlaying(false);
        setHasEnded(true);
        setCurrentTime(audio.duration);
        setStage("outro");
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      setDisplayLine(payload.firstName ? `${forPrefix}${payload.firstName}` : forYou);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      hasEndedRef.current = true;
      setIsPlaying(false);
      setHasEnded(true);
      setCurrentTime(audio.duration || 0);
      setStage("outro");
    };

    const onError = () => {
      setErrorMessage(errAudio);
      setStage("error");
    };

    audio.addEventListener("loadedmetadata", markReady);
    audio.addEventListener("loadeddata", markReady);
    audio.addEventListener("canplay", markReady);
    audio.addEventListener("canplaythrough", markReady);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.load();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("loadedmetadata", markReady);
      audio.removeEventListener("loadeddata", markReady);
      audio.removeEventListener("canplay", markReady);
      audio.removeEventListener("canplaythrough", markReady);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [errAudio, forPrefix, forYou, payload?.audioUrl, payload?.firstName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stage === "arrival" || stage === "prelude" || stage === "recharge" || stage === "error") {
      audio.pause();
      if (stage !== "recharge") {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      setIsPlaying(false);
    }
  }, [stage]);

  useEffect(() => {
    return () => {
      if (preludeTimeoutRef.current) window.clearTimeout(preludeTimeoutRef.current);
      if (breathTimeoutRef.current) window.clearTimeout(breathTimeoutRef.current);
    };
  }, []);

  async function consumeListen() {
    const res = await fetch(`/api/murmures/${id}/listen`, { method: "POST" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      if (json?.error === "PLUS_D_ECOUTES") {
        setPayload((prev) => (prev ? { ...prev, remainingListens: 0 } : prev));
        setStage("recharge");
        return false;
      }
      throw new Error(json?.error || c.errPlaybackStart);
    }

    if (typeof json?.data?.remainingListens === "number") {
      setPayload((prev) =>
        prev ? { ...prev, remainingListens: Number(json.data.remainingListens) } : prev
      );
    }

    return true;
  }

  async function startPlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setDisplayLine(c.listeningLabel);
      setStage("breath");

      breathTimeoutRef.current = window.setTimeout(() => {
        void (async () => {
          try {
            if (!playbackConsumedRef.current) {
              const consumed = await consumeListen();
              if (!consumed) return;
              playbackConsumedRef.current = true;
            }

            audio.volume = 0.05;
            await audio.play();
            fadeInVolume(audio, 1, 1600);
            setStage("player");
          } catch (error) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : c.errPlaybackFailed
            );
            setStage("error");
          }
        })();
      }, 1400);
    } catch {
      setErrorMessage(c.errPlaybackFailed);
      setStage("error");
    }
  }

  function replay() {
    if (!payload || payload.remainingListens <= 0) {
      setStage("recharge");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setHasEnded(false);
    hasEndedRef.current = false;
    playbackConsumedRef.current = false;
    void startPlayback();
  }

  async function refreshCreditsAfterPayment() {
    try {
      setIsCheckingRecharge(true);
      setRechargeMessage(c.checkingPayment);

      const res = await fetch(`/api/murmures/${id}/listen`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json.success || !json.data) {
        setRechargeMessage(
          c.errRechargeNotConfirmed
        );
        return;
      }

      setPayload(json.data);

      if (json.data.remainingListens > 0) {
        setRechargeMessage(c.rechargeRestored);
        setIsReadyToPlay(false);
        setHasStarted(false);
        setHasEnded(false);
        setCurrentTime(0);
        setDuration(0);
        playbackConsumedRef.current = false;
        setStage("arrival");
        return;
      }

      setRechargeMessage(c.rechargePending);
    } catch {
      setRechargeMessage(c.errCheckPayment);
    } finally {
      setIsCheckingRecharge(false);
    }
  }

  async function startRechargeCheckout() {
    try {
      setIsCreatingCheckout(true);
      setRechargeMessage(c.openingPayment);

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_bijou: id,
          credits: 10,
          kind: "credits",
          locale,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || c.errCheckoutFailed);
      }

      window.location.href = json.url;
    } catch (error) {
      setRechargeMessage(
        error instanceof Error
          ? error.message
          : c.errCheckoutUnavailable
      );
    } finally {
      setIsCreatingCheckout(false);
    }
  }

  function goPrelude() {
    setStage("prelude");
    preludeTimeoutRef.current = window.setTimeout(() => {
      setDisplayLine(c.preludeText);
    }, 1200);
  }

  function closeWindow() {
    window.close();
    window.setTimeout(() => {
      window.location.replace("about:blank");
    }, 180);
  }

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const safeRemaining = payload?.remainingListens;
  const showCounter = typeof safeRemaining === "number";
  const showRechargeOnOutro = showCounter && safeRemaining === 0;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#120d0a] text-stone-100">
      <WoodBackground />
      <SoftNoise />
      <FloatingGlow />

      <div className="relative z-10 flex min-h-[100dvh] items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          {isLoading ? (
            <BootScreen />
          ) : (
            <AnimatePresence mode="wait">
              {stage === "arrival" && payload && (
                <section key="arrival" className="mx-auto max-w-2xl text-center">
                  <BrandSeal fadeOnly />
                  <Eyebrow text="Grain Atelier" />
                  <p className="mx-auto max-w-xl text-3xl leading-[1.45] text-stone-100 md:text-5xl md:leading-[1.35]">
                    {c.arrivalText}
                  </p>
                  <p className="mx-auto mt-8 max-w-lg text-base leading-8 text-stone-300 md:text-lg">
                    {payload.theme ? `${c.intentionPrefix}${payload.theme}.` : c.intimateMessage}
                  </p>

                  <div className="mt-14">
                    <button className={softButton} onClick={goPrelude}>
                      {c.readyBtn}
                    </button>
                  </div>
                </section>
              )}

              {stage === "prelude" && (
                <motion.section key="prelude" {...fade} className="mx-auto max-w-2xl text-center">
                  <BrandSeal small />
                  <Eyebrow text={c.preludeEyebrow} />
                  <SequentialText
                    lines={c.preludeLines}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.2, duration: 1.1 }}
                    className="mt-14"
                  >
                    <button className={softButton} onClick={startPlayback} disabled={!isReadyToPlay}>
                      {isReadyToPlay ? c.listenWhisperBtn : c.preparingBtn}
                    </button>
                  </motion.div>

                  {showCounter && (
                    <p className="mt-8 text-xs uppercase tracking-[0.28em] text-stone-500">
                      {safeRemaining === 1 ? `1 ${c.listensLeft1}` : `${safeRemaining}${c.listensLeftN}`}
                    </p>
                  )}
                </motion.section>
              )}

              {stage === "breath" && (
                <motion.section key="breath" {...fade} className="mx-auto max-w-2xl text-center">
                  <BrandSeal small dimmed />
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.06, 1] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto mb-10 h-28 w-28 rounded-full border border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,220,180,0.08)]"
                  />
                  <p className="text-sm uppercase tracking-[0.34em] text-stone-400">Silence</p>
                </motion.section>
              )}

              {stage === "player" && payload && (
                <motion.section key="player" {...fade} className="mx-auto max-w-2xl text-center">
                  <Eyebrow text={c.playerEyebrow} />
                  <WaveHalo isPlaying={isPlaying} />

                  <p className="mt-10 text-sm uppercase tracking-[0.28em] text-stone-400">{displayLine}</p>

                  <h1 className="mx-auto mt-5 max-w-xl text-3xl leading-[1.45] text-stone-100 md:text-5xl md:leading-[1.3]">
                    {payload.firstName ? `${c.whisperPrefix}${payload.firstName}` : c.whisperForYou}
                  </h1>

                  <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-stone-300 md:text-lg">
                    {c.settleWords}
                  </p>

                  <div className="mx-auto mt-10 w-full max-w-md">
                    <div className="h-px overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-white/50"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.2 }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-stone-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                    <button
                      className={softButton}
                      onClick={() => {
                        const audio = audioRef.current;
                        if (!audio) return;
                        if (hasEnded || (duration > 0 && currentTime >= duration - 0.12)) {
                          setStage("outro");
                          return;
                        }
                        if (isPlaying) {
                          audio.pause();
                        } else {
                          void audio.play();
                        }
                      }}
                    >
                      {isPlaying ? c.pauseBtn : hasStarted ? c.resumeBtn : c.listenBtn}
                    </button>
                  </div>

                  {showCounter && (
                    <p className="mt-10 text-xs uppercase tracking-[0.28em] text-stone-500">
                      {safeRemaining === 1 ? `1 ${c.listensLeft1}` : `${safeRemaining}${c.listensLeftN}`}
                    </p>
                  )}
                </motion.section>
              )}

              {stage === "outro" && payload && (
                <motion.section key="outro" {...fade} className="mx-auto max-w-2xl text-center">
                  <BrandSeal small dimmed />
                  <Eyebrow text={showRechargeOnOutro ? c.outroEyebrowRecharge : c.outroEyebrowAfter} />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4 }}
                    className="mx-auto max-w-xl text-3xl leading-[1.45] text-stone-100 md:text-5xl md:leading-[1.35]"
                  >
                    {showRechargeOnOutro
                      ? c.outroTextRecharge
                      : c.outroTextNormal}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 1.4 }}
                    className="mx-auto mt-8 max-w-lg text-base leading-8 text-stone-300 md:text-lg"
                  >
                    {showRechargeOnOutro
                      ? c.outroSubtextRecharge
                      : c.outroSubtextNormal}
                  </motion.p>

                  {showCounter && (
                    <p className="mt-8 text-xs uppercase tracking-[0.28em] text-stone-500">
                      {safeRemaining === 1 ? `1 ${c.listensLeft1}` : `${safeRemaining}${c.listensLeftN}`}
                    </p>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3, duration: 1.1 }}
                    className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
                  >
                    {showRechargeOnOutro ? (
                      <>
                        <button
                          className={softButton}
                          onClick={startRechargeCheckout}
                          disabled={isCreatingCheckout || isCheckingRecharge}
                        >
                          {isCreatingCheckout ? c.openingBtn : c.reactivateBtn}
                        </button>
                        <button
                          className={`${softButton} border-white/10 bg-transparent text-stone-300 hover:bg-white/5`}
                          onClick={refreshCreditsAfterPayment}
                          disabled={isCheckingRecharge || isCreatingCheckout}
                        >
                          {isCheckingRecharge ? c.checkingBtn : c.paidBtn}
                        </button>
                        <button
                          className={`${softButton} border-white/10 bg-transparent text-stone-300 hover:bg-white/5`}
                          onClick={closeWindow}
                        >
                          {c.closeBtn}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className={softButton} onClick={replay}>
                          {c.replayBtn}
                        </button>
                        <button
                          className={`${softButton} border-white/10 bg-transparent text-stone-300 hover:bg-white/5`}
                          onClick={closeWindow}
                        >
                          {c.closeBtn}
                        </button>
                      </>
                    )}
                  </motion.div>

                  {showRechargeOnOutro ? (
                    <>
                      <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-stone-400">
                        {c.paymentNote}
                      </p>
                      {rechargeMessage ? (
                        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-amber-200/90">
                          {rechargeMessage}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </motion.section>
              )}

              {stage === "recharge" && (
                <motion.section key="recharge" {...fade} className="mx-auto max-w-2xl text-center">
                  <BrandSeal />
                  <Eyebrow text={c.rechargeEyebrow} />
                  <p className="mx-auto max-w-xl text-3xl leading-[1.45] text-stone-100 md:text-5xl md:leading-[1.35]">
                    {c.rechargeTitle}
                  </p>
                  <p className="mx-auto mt-8 max-w-lg text-base leading-8 text-stone-300 md:text-lg">
                    {c.rechargeText}
                  </p>

                  <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button
                      className={softButton}
                      onClick={startRechargeCheckout}
                      disabled={isCreatingCheckout || isCheckingRecharge}
                    >
                      {isCreatingCheckout ? c.openingBtn : c.reactivateBtn}
                    </button>
                    <button
                      className={`${softButton} border-white/10 bg-transparent text-stone-300 hover:bg-white/5`}
                      onClick={refreshCreditsAfterPayment}
                      disabled={isCheckingRecharge || isCreatingCheckout}
                    >
                      {isCheckingRecharge ? c.checkingBtn : c.paidBtn}
                    </button>
                  </div>

                  <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-stone-400">
                    {c.paymentNote}
                  </p>

                  {rechargeMessage ? (
                    <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-amber-200/90">
                      {rechargeMessage}
                    </p>
                  ) : null}
                </motion.section>
              )}

              {stage === "error" && (
                <motion.section key="error" {...fade} className="mx-auto max-w-xl text-center">
                  <BrandSeal small dimmed />
                  <Eyebrow text={c.errorEyebrow} />
                  <h1 className="text-3xl leading-[1.4] text-stone-100 md:text-4xl">
                    {c.errorTitle}
                  </h1>
                  <p className="mt-6 text-base leading-8 text-stone-300">
                    {errorMessage ||
                      c.errorDefault}
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <button className={softButton} onClick={() => window.location.reload()}>
                      {c.retryBtn}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </main>
  );
}

function BrandSeal({ small = false, dimmed = false, fadeOnly = false }: { small?: boolean; dimmed?: boolean; fadeOnly?: boolean }) {
  const size = small ? 88 : 132;

  if (fadeOnly) {
    return (
      <div className="mb-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,215,150,0.18),transparent_68%)] blur-2xl" />
          <Image
            src="/logo.png"
            alt="Grain Atelier"
            width={size}
            height={size}
            className={`relative ${dimmed ? "opacity-70" : "opacity-95"} mix-blend-soft-light`}
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: dimmed ? 0.7 : 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
      className="mb-8 flex items-center justify-center"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,215,150,0.18),transparent_68%)] blur-2xl" />
        <Image
          src="/logo.png"
          alt="Grain Atelier"
          width={size}
          height={size}
          className={`relative ${dimmed ? "opacity-70" : "opacity-95"} mix-blend-soft-light`}
          priority
        />
      </div>
    </motion.div>
  );
}

function BootScreen() {
  return (
    <motion.section {...fade} className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <BrandSeal />
      <motion.div
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.03, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="h-24 w-24 rounded-full border border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,220,180,0.06)]"
      />
      <p className="mt-10 text-xs uppercase tracking-[0.38em] text-stone-500">Grain Atelier</p>
    </motion.section>
  );
}

function Eyebrow({ text }: { text: string }) {
  return <p className="mb-8 text-xs uppercase tracking-[0.38em] text-stone-500">{text}</p>;
}

function SequentialText({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-6 md:space-y-8">
      {lines.map((line, index) => (
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 1.35, duration: 1.1 }}
          className="text-2xl leading-normal text-stone-100 md:text-4xl md:leading-snug"
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

function WaveHalo({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative mx-auto h-44 w-44 md:h-56 md:w-56">
      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0 rounded-full border border-white/10"
          animate={
            isPlaying
              ? { scale: [1, 1.15 + ring * 0.08, 1], opacity: [0.18, 0.55, 0.18] }
              : { scale: [1, 1.03, 1], opacity: [0.18, 0.28, 0.18] }
          }
          transition={{ duration: 2.8 + ring * 0.55, repeat: Infinity, ease: "easeInOut", delay: ring * 0.2 }}
        />
      ))}

      <motion.div
        animate={isPlaying ? { scale: [1, 1.06, 1] } : { scale: [1, 1.02, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[18%] rounded-full bg-white/8 shadow-[0_0_120px_rgba(255,220,180,0.09)] backdrop-blur-sm"
      />
    </div>
  );
}

function WoodBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,145,92,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(120,77,45,0.18),transparent_38%),linear-gradient(180deg,#120d0a_0%,#1a120e_48%,#0d0907_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_0%,transparent_22%,rgba(255,255,255,0.02)_38%,transparent_54%,rgba(255,255,255,0.02)_70%,transparent_100%)]" />
      <div className="absolute inset-0 bg-size-[180px_180px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0.6px,transparent_0.7px)] opacity-[0.05]" />
    </div>
  );
}

function SoftNoise() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light">
      <div className="absolute inset-0 bg-size-[6px_6px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0.5px,transparent_0.6px)]" />
    </div>
  );
}

function FloatingGlow() {
  return (
    <motion.div
      animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.04, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="pointer-events-none absolute left-1/2 top-1/2 h-160 w-160 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(188,130,70,0.14),transparent_62%)] blur-3xl"
    />
  );
}

function fadeInVolume(audio: HTMLAudioElement, targetVolume: number, durationMs: number) {
  const startVolume = audio.volume;
  const startTime = performance.now();

  function tick(now: number) {
    const progress = Math.min((now - startTime) / durationMs, 1);
    audio.volume = startVolume + (targetVolume - startVolume) * easeOutCubic(progress);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
