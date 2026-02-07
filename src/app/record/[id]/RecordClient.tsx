"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { getLocaleFromHost, useTranslations } from "@/lib/i18n";

type RecordConfig = {
  session: {
    id_bijou: string;
    essais_restants: number;
    max_essais: number;
    duree_max_secondes: number;
    locked: boolean;
    locked_at?: string;
  } | null;
  voixEnregistree: {
    id: string;
    audio_url: string;
    is_locked: boolean;
    created_at: string;
  } | null;
  drafts: Array<{
    id: string;
    audio_url: string;
    duree_secondes: number;
    created_at: string;
  }>;
};

type Bijou = {
  id_bijou: string;
  [key: string]: any; // Accepter toutes les colonnes
};

export default function RecordClient() {
  const params = useParams();
  const router = useRouter();
  const id_bijou = params?.id as string;

  // Detect locale from hostname
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  useEffect(() => {
    setLocale(getLocaleFromHost(window.location.hostname));
  }, []);
  const t = useTranslations(locale);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<RecordConfig | null>(null);
  const [bijou, setBijou] = useState<Bijou | null>(null);
  const [error, setError] = useState("");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [draftPlayback, setDraftPlayback] = useState<HTMLAudioElement | null>(
    null
  );

  // Charger la config et les infos du bijou
  useEffect(() => {
    if (!id_bijou) return;

    const loadData = async () => {
      try {
        // Récupérer la config d'enregistrement
        const configRes = await fetch(
          `/api/record/config?id_bijou=${encodeURIComponent(id_bijou)}`
        );
        if (!configRes.ok) throw new Error("Erreur chargement config");
        const configData = (await configRes.json()) as RecordConfig;
        
        // Si pas de session, créer une
        if (!configData.session) {
          const supabaseModule = await import("@/lib/supabaseClient");
          const { error: createError } = await supabaseModule.supabase
            .from("recording_sessions")
            .insert({
              id_bijou,
              essais_restants: 5,
              max_essais: 5,
              duree_max_secondes: 120,
            })
            .select()
            .single();

          if (!createError) {
            // Recharger la config après création
            const newConfigRes = await fetch(
              `/api/record/config?id_bijou=${encodeURIComponent(id_bijou)}`
            );
            if (newConfigRes.ok) {
              const newConfigData = (await newConfigRes.json()) as RecordConfig;
              setConfig(newConfigData);
            }
          } else {
            setConfig(configData);
          }
        } else {
          setConfig(configData);
        }

        // Récupérer les infos du bijou et personnalisation
        const supabaseModule = await import("@/lib/supabaseClient");
        
        const { data: bijouData, error: bijouError } = await supabaseModule.supabase
          .from("bijoux")
          .select("*")
          .eq("id_bijou", id_bijou)
          .single();

        console.log("Bijou query result:", { bijouData, bijouError });

        if (bijouError) {
          console.error("Bijou error:", bijouError);
          throw new Error(`Bijou introuvable: ${bijouError.message}`);
        }
        if (!bijouData) {
          throw new Error("Bijou non trouvé dans la base");
        }

        // Récupérer la personnalisation pour avoir le prénom
        const { data: persoData } = await supabaseModule.supabase
          .from("personnalisations")
          .select("prenom, lieu, souvenir, theme, sous_theme")
          .eq("id_bijou", id_bijou)
          .single();

        // Fusionner les données
        const combinedData = {
          ...bijouData,
          prenom: persoData?.prenom,
          lieu: persoData?.lieu,
          souvenir: persoData?.souvenir,
          theme: persoData?.theme,
          sous_theme: persoData?.sous_theme,
        };

        setBijou(combinedData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("RecordClient error:", err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id_bijou]);

  const handleRecordingComplete = async (blob: Blob, durationSeconds: number) => {
    setRecordingBlob(blob);

    // Décrémenter les essais restants immédiatement
    try {
      setIsUploading(true);
      const essaisActuels = config?.session?.essais_restants ?? 5;
      const nouvelEssai = Math.max(0, essaisActuels - 1);

      // Mettre à jour recording_sessions
      const supabaseModule = await import("@/lib/supabaseClient");
      const { error: updateError } = await supabaseModule.supabase
        .from("recording_sessions")
        .update({ essais_restants: nouvelEssai })
        .eq("id_bijou", id_bijou);

      if (updateError) {
        console.warn("Erreur décrément essais:", updateError);
      } else {
        // Recharger la config pour mettre à jour le compteur
        const configRes = await fetch(
          `/api/record/config?id_bijou=${encodeURIComponent(id_bijou)}`
        );
        if (configRes.ok) {
          const configData = (await configRes.json()) as RecordConfig;
          setConfig(configData);
        }
      }

      // Créer le brouillon
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const res = await fetch("/api/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_bijou,
            audioBase64: base64,
            durationSeconds,
            isDraft: true,
          }),
        });

        if (!res.ok) throw new Error("Erreur upload brouillon");
        const data = (await res.json()) as { success: boolean; url: string };
        setDraftUrl(data.url);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur upload";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    if (!recordingBlob) {
      setError("Aucun enregistrement");
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const durationSeconds = recordingBlob.size > 0 ? 120 : 60; // Approximation

        const res = await fetch("/api/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_bijou,
            audioBase64: base64,
            durationSeconds,
            isDraft: false,
          }),
        });

        if (!res.ok) throw new Error("Erreur validation");
        setUploadSuccess(true);

        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push(`/listen/recorded/${id_bijou}`);
        }, 2000);
      };
      reader.readAsDataURL(recordingBlob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayDraft = () => {
    if (!draftUrl) return;

    if (draftPlayback?.src === draftUrl && !draftPlayback.paused) {
      draftPlayback.pause();
      setDraftPlayback(null);
    } else {
      if (draftPlayback) draftPlayback.pause();
      const audio = new Audio(draftUrl);
      audio.play();
      setDraftPlayback(audio);
    }
  };

  const handleRestart = () => {
    setRecordingBlob(null);
    setDraftUrl("");
    setDraftPlayback(null);
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

  if (!bijou) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-center">
          <p className="text-red-400">{error || t.common.error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition"
          >
            {locale === "fr" ? "Retour" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  // Vérifier si déjà enregistré et verrouillé
  if (config?.session?.locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white max-w-md px-4">
          <div className="mb-6 text-5xl">🔒</div>
          <h1 className="text-2xl font-bold mb-4">{t.record.locked}</h1>
          <p className="text-slate-300 mb-6">
            {t.record.lockedMessage}
          </p>
          <p className="text-sm text-slate-400 mb-6">
            {locale === "fr" ? "Vous ne pouvez plus le modifier. Le destinataire peut l'écouter à tout moment." : "You cannot modify it anymore. The recipient can listen to it anytime."}
          </p>
          <button
            onClick={() => router.push(`/listen/recorded/${id_bijou}`)}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition font-medium"
          >
            {locale === "fr" ? "Écouter le message" : "Listen to message"}
          </button>
        </div>
      </div>
    );
  }

  // Vérifier les essais restants
  const essaisRestants = config?.session?.essais_restants ?? 5;
  if (essaisRestants <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white max-w-md px-4">
          <div className="mb-6 text-5xl">❌</div>
          <h1 className="text-2xl font-bold mb-4">{locale === "fr" ? "Plus d'essais disponibles" : "No attempts left"}</h1>
          <p className="text-slate-300 mb-6">
            {locale === "fr" ? "Vous avez utilisé tous vos essais d'enregistrement." : "You have used all your recording attempts."}
          </p>
          <button
            onClick={() => router.push(`/listen/${id_bijou}`)}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition font-medium"
          >
            {locale === "fr" ? "Retourner" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white max-w-md px-4">
          <div className="mb-6 text-5xl">✨</div>
          <h1 className="text-2xl font-bold mb-4">{t.record.validationSuccess}</h1>
          <p className="text-slate-300 mb-8">
            {locale === "fr" 
              ? `Votre message pour ${bijou.prenom || "le destinataire"} est sauvegardé et verrouillé définitivement.`
              : `Your message for ${bijou.prenom || "the recipient"} is saved and permanently locked.`
            }
          </p>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-300 mb-3">
              {locale === "fr" 
                ? "✓ Le destinataire peut écouter en scannant la puce du bijou"
                : "✓ The recipient can listen by scanning the jewelry chip"
              }
            </p>
            <p className="text-xs text-slate-400">
              {t.record.redirecting}
            </p>
          </div>

          <div className="animate-pulse">
            <div className="h-1 bg-linear-to-r from-pink-500 to-rose-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold mb-2">{t.record.title}</h1>
          <p className="text-slate-300">
            {locale === "fr" ? "Pour" : "For"} <span className="font-semibold text-pink-400">{bijou.prenom || bijou.destinataire_prenom || (locale === "fr" ? "le destinataire" : "the recipient")}</span>
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {t.record.attemptsRemaining(essaisRestants)}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* AudioRecorder */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
          <AudioRecorder
            maxDurationSeconds={120}
            onRecordingComplete={handleRecordingComplete}
            disabled={isUploading}
          />
        </div>

        {/* Draft Playback */}
        {draftUrl && !uploadSuccess && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-4">{locale === "fr" ? "Aperçu de votre enregistrement" : "Preview your recording"}</h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={handlePlayDraft}
                disabled={isUploading}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-600 rounded-lg transition font-medium"
              >
                {draftPlayback?.src === draftUrl && !draftPlayback.paused
                  ? (locale === "fr" ? "⏸ Pause" : "⏸ Pause")
                  : (locale === "fr" ? "▶ Écouter" : "▶ Play")}
              </button>
              <button
                onClick={handleRestart}
                disabled={isUploading}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 rounded-lg transition font-medium"
              >
                {locale === "fr" ? "↻ Recommencer" : "↻ Re-record"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {draftUrl && !uploadSuccess && (
          <div className="flex gap-4">
            <button
              onClick={handleValidate}
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-600 rounded-lg transition font-bold text-center"
            >
              {isUploading ? t.record.validating : t.record.validate}
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
          <p className="mb-3">
            💡 <strong>{locale === "fr" ? "Comment ça marche:" : "How it works:"}</strong>
          </p>
          <ul className="space-y-2 text-xs">
            <li>✓ {locale === "fr" ? `Vous avez ${essaisRestants} essai(s) pour enregistrer` : `You have ${essaisRestants} attempt(s) to record`}</li>
            <li>✓ {locale === "fr" ? "Chaque enregistrement consomme 1 essai" : "Each recording uses 1 attempt"}</li>
            <li>✓ {locale === "fr" ? "Écoutez votre brouillon autant de fois que vous voulez" : "Listen to your draft as many times as you want"}</li>
            <li>✓ <strong>⚠️ {locale === "fr" ? "\"Valider et enregistrer\" = VERROUILLÉ DÉFINITIVEMENT" : "\"Validate\" = PERMANENTLY LOCKED"}</strong></li>
            <li>✓ Après validation, vous avez <strong>10 écoutes</strong> avant recharge</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
