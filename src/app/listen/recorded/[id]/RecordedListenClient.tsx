"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getLocaleFromHost, useTranslations } from "@/lib/i18n";

type VoixEnregistree = {
  id: string;
  audio_url: string;
  is_locked: boolean;
  created_at: string;
  lectures_restantes: number;
  lectures_totales: number;
};

type Bijou = {
  id_bijou: string;
  [key: string]: any;
};

export default function RecordedListenClient() {
  const params = useParams();
  const router = useRouter();
  const id_bijou = params?.id as string;

  // Detect locale from hostname
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  useEffect(() => {
    setLocale(getLocaleFromHost(window.location.hostname));
  }, []);
  const t = useTranslations(locale);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bijou, setBijou] = useState<Bijou | null>(null);
  const [voix, setVoix] = useState<VoixEnregistree | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasCountedForCurrentPlayRef = useRef(false);

  // Charger les données
  useEffect(() => {
    if (!id_bijou) return;

    const loadData = async () => {
      try {
        // Récupérer le bijou
        const { data: bijouData, error: bijouError } = await supabase
          .from("bijoux")
          .select("*")
          .eq("id_bijou", id_bijou)
          .single();

        if (bijouError) throw bijouError;
        setBijou(bijouData);

        // Récupérer la voix enregistrée
        const { data: voixData, error: voixError } = await supabase
          .from("voix_enregistrees")
          .select("*")
          .eq("id_bijou", id_bijou)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (voixError) throw new Error("Voix enregistrée non trouvée");
        
        // Vérifier si lectures_restantes = 0
        if (voixData.lectures_restantes === 0) {
          router.push(`/recharge/${id_bijou}`);
          return;
        }
        
        setVoix(voixData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id_bijou, router]);

  // Gérer la lecture
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !voix) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (voix.lectures_restantes === 0) {
        router.push(`/recharge/${id_bijou}`);
        return;
      }

      const isAtStart = audio.currentTime <= 0.01;
      if (isAtStart && !hasCountedForCurrentPlayRef.current) {
        // Marquer que ce décrément est en cours pour cette session
        hasCountedForCurrentPlayRef.current = true;
      }

      if (!audio.src) {
        audio.src = voix.audio_url;
      }
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Erreur lecture:", err);
        setError("Impossible de lire l'audio");
      }
    }
  };

  // Décrémenter après la fin de la lecture
  const decrementLecture = async () => {
    if (!hasCountedForCurrentPlayRef.current || !voix) return;

    const newCount = voix.lectures_restantes - 1;

    try {
      const { error } = await supabase
        .from("voix_enregistrees")
        .update({
          lectures_restantes: newCount,
          lectures_totales: voix.lectures_totales + 1,
        })
        .eq("id", voix.id);

      if (error) throw error;

      setVoix({
        ...voix,
        lectures_restantes: newCount,
        lectures_totales: voix.lectures_totales + 1,
      });

      // Si dernier message écouté, rediriger après 2s
      if (newCount === 0) {
        setTimeout(() => {
          router.push(`/recharge/${id_bijou}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Erreur décrément lectures:", err);
    }
  };

  // Mettre à jour le temps de lecture
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
    // Décrémenter quand l'audio est fini
    if (hasCountedForCurrentPlayRef.current) {
      decrementLecture();
    }
    hasCountedForCurrentPlayRef.current = false;
    setIsPlaying(false);
  };

  // Formatage du temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 mx-auto mb-4"></div>
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !voix) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-center max-w-md px-4">
          <div className="mb-6 text-5xl">❌</div>
          <h1 className="text-2xl font-bold mb-4">{locale === "fr" ? "Message non trouvé" : "Message not found"}</h1>
          <p className="text-slate-300 mb-6">{error || (locale === "fr" ? "Aucun message enregistré pour ce bijou." : "No recorded message for this jewelry.")}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition font-medium"
          >
            {locale === "fr" ? "Retour à l'accueil" : "Back to home"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Base gradient - warm and hopeful */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-slate-800 to-slate-950" />
      
      {/* Warm glow from top - sunrise/hope */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-linear-to-b from-amber-600/20 via-rose-500/15 to-transparent blur-3xl pointer-events-none" />
      
      {/* Soft side glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-radial from-sky-400/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-gradient-radial from-purple-400/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Animated snowflakes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10 - Math.random() * 20}%`,
              fontSize: `${12 + Math.random() * 16}px`,
              animation: `falling ${8 + Math.random() * 6}s linear infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes falling {
          to {
            transform: translateY(120vh) translateX(${Math.sin(Math.random()) * 100}px);
            opacity: 0;
          }
        }
      `}</style>

      <div className="relative max-w-3xl mx-auto px-6 py-16 flex flex-col items-center min-h-screen">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-xs tracking-[0.3em] uppercase text-white/90 font-light">
            ✨ Mindwood
          </div>
          <h1 className="text-5xl sm:text-6xl font-light mt-8 mb-4 text-white drop-shadow-lg">
            {locale === "fr" ? (
              <>Un message<br />t'attend</>
            ) : (
              <>A message<br />awaits you</>
            )}
          </h1>
          <p className="text-lg text-white/70 font-light">{locale === "fr" ? "Quelque chose de précieux t'a été confié." : "Something precious has been entrusted to you."}</p>
        </div>

        <div className="w-full max-w-2xl">
          <div className="relative rounded-3xl border border-white/20 bg-white/8 backdrop-blur-2xl shadow-2xl p-10 sm:p-12">
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
            
            {/* Top light reflection */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-20 bg-linear-to-b from-white/20 to-transparent blur-2xl rounded-full" />

            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onError={() => setError("Erreur lecture audio")}
            />

            <button
              onClick={togglePlay}
              className="w-full mb-8 px-8 py-5 rounded-full text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 bg-linear-to-r from-amber-400 via-rose-400 to-sky-400 shadow-lg hover:shadow-xl"
            >
              {isPlaying ? t.listen.pause : t.listen.play}
            </button>

            {duration > 0 && (
              <div className="mb-6">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => {
                    const audio = audioRef.current;
                    const nextValue = parseFloat(e.target.value);
                    if (audio) {
                      audio.currentTime = nextValue;
                      if (nextValue <= 0.01) {
                        hasCountedForCurrentPlayRef.current = false;
                      }
                    }
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/20 accent-amber-300"
                />
                <div className="flex justify-between text-sm text-white/60 mt-2 font-light">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm text-white/70 font-light">
              <div className="flex items-center justify-between">
                <span>{locale === "fr" ? "Enregistré le" : "Recorded on"} {new Date(voix.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}</span>
                <span className="text-white/90">{t.listen.listensRemaining(voix.lectures_restantes)}</span>
              </div>
              {voix.is_locked && (
                <div className="text-amber-200/90 text-xs pt-2">🔒 {locale === "fr" ? "Message verrouillé et sécurisé" : "Message locked and secured"}</div>
              )}
            </div>

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
