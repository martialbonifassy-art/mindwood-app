"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bijou, setBijou] = useState<Bijou | null>(null);
  const [voix, setVoix] = useState<VoixEnregistree | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasDecrementedThisSession, setHasDecrementedThisSession] = useState(false);

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
      // Décrémenter les lectures restantes au premier clic
      if (!hasDecrementedThisSession && voix.lectures_restantes >= 1) {
        const newCount = voix.lectures_restantes - 1;
        
        try {
          // Mettre à jour en DB
          const { error } = await supabase
            .from("voix_enregistrees")
            .update({ 
              lectures_restantes: newCount,
              lectures_totales: voix.lectures_totales + 1
            })
            .eq("id", voix.id);

          if (error) throw error;

          // Mettre à jour l'état local
          setVoix({
            ...voix,
            lectures_restantes: newCount,
            lectures_totales: voix.lectures_totales + 1
          });
          setHasDecrementedThisSession(true);

          // Si on vient d'atteindre 0, rediriger vers recharge après la lecture
          if (newCount === 0) {
            setTimeout(() => {
              router.push(`/recharge/${id_bijou}`);
            }, 2000);
          }
        } catch (err) {
          console.error("Erreur décrément lectures:", err);
        }
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
          <p>Chargement du message...</p>
        </div>
      </div>
    );
  }

  if (error || !voix) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-center max-w-md px-4">
          <div className="mb-6 text-5xl">❌</div>
          <h1 className="text-2xl font-bold mb-4">Message non trouvé</h1>
          <p className="text-slate-300 mb-6">{error || "Aucun message enregistré pour ce bijou."}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Un message t'attend ✨</h1>
          <p className="text-slate-300">Une voix enregistrée spécialement pour toi</p>
        </div>

        {/* Audio Player Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md mb-8">
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={() => setError("Erreur lecture audio")}
          />

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className="w-full mb-6 px-8 py-4 bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full text-white font-bold text-lg transition transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? "⏸ Pause" : "▶ Écouter le message"}
          </button>

          {/* Progress Bar */}
          {duration > 0 && (
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  const audio = audioRef.current;
                  if (audio) {
                    audio.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Message Info */}
          <div className="text-center text-sm text-slate-400 space-y-1">
            <p>Enregistré le {new Date(voix.created_at).toLocaleDateString("fr-FR")}</p>
            <p className="text-slate-300 font-medium">📖 {voix.lectures_restantes} lecture{voix.lectures_restantes !== 1 ? "s" : ""} restante{voix.lectures_restantes !== 1 ? "s" : ""}</p>
            {voix.is_locked && (
              <p className="text-pink-400 mt-2">🔒 Message verrouillé et sécurisé</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-md bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Info Card */}
        <div className="w-full max-w-md bg-slate-800/30 border border-slate-700 rounded-lg p-6 text-center">
          <p className="text-slate-300">
            💝 Ce message a été spécialement enregistré pour toi.<br />
            <span className="text-sm text-slate-400">Prends le temps de l'écouter.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
