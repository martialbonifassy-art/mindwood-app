"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";

type FlowState =
  | "intro"
  | "record"
  | "review"
  | "saving"
  | "done"
  | "buyerComplete";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = String(reader.result || "");
        const base64 = result.split(",")[1];
        if (!base64) {
          reject(new Error("Conversion audio impossible."));
          return;
        }
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Erreur lecture audio."));
    reader.readAsDataURL(blob);
  });
}

export default function RecordClient() {
  const params = useParams<{ id: string }>();
  const id_bijou = params?.id;

  const [state, setState] = useState<FlowState>("intro");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [introLine, setIntroLine] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseHint, setShowCloseHint] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setIntroLine(1), 400);
    const t2 = window.setTimeout(() => setIntroLine(2), 1800);
    const t3 = window.setTimeout(() => setIntroLine(3), 3200);
    const t4 = window.setTimeout(() => {
      setState("record");
      setShowRecorder(true);
    }, 4600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (state === "review") {
      setShowActions(false);
      const t = window.setTimeout(() => setShowActions(true), 1400);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    if (isClosing) {
      const closeTimer = window.setTimeout(() => {
        window.close();
      }, 3000);
      const hintTimer = window.setTimeout(() => {
        setShowCloseHint(true);
      }, 3200);
      return () => {
        window.clearTimeout(closeTimer);
        window.clearTimeout(hintTimer);
      };
    }
  }, [isClosing]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const canValidate = useMemo(() => {
    return Boolean(id_bijou && audioBlob && audioUrl);
  }, [id_bijou, audioBlob, audioUrl]);

  async function handleRecordingComplete(
    blob: Blob,
    _durationSeconds: number
  ) {
    setError(null);

    if (!blob || blob.size === 0) {
      setError("Aucun audio valide n’a été capturé.");
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));
    setState("review");
  }

  async function handleValidate() {
    if (!id_bijou) {
      setError("ID bijou introuvable.");
      return;
    }

    if (!audioBlob) {
      setError("Aucun enregistrement à valider.");
      return;
    }

    try {
      setError(null);
      setState("saving");

      const base64 = await blobToBase64(audioBlob);

      const res = await fetch("/api/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_bijou,
          audioBase64: base64,
          durationSeconds: 120,
          isDraft: false,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Erreur lors de la validation."
        );
      }

      setState("done");

      window.setTimeout(() => {
        setState("buyerComplete");
      }, 5200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la validation.";
      setError(msg);
      setState("review");
    }
  }

  function restartRecording() {
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setShowActions(false);
    setState("record");
  }

  return (
    <div className="container">
      <div className="bg" />
      <div className="grain" />
      <div className="glow glowA" />
      <div className="glow glowB" />

      {error && <div className="error">{error}</div>}

      {state === "intro" && (
        <section className="introScene">
          <div className={`introLine ${introLine >= 1 ? "visible" : ""}`}>
            Fermez les yeux un instant…
          </div>
          <div className={`introLine ${introLine >= 2 ? "visible" : ""}`}>
            Imaginez cette personne.
          </div>
          <div className={`introLine ${introLine >= 3 ? "visible" : ""}`}>
            Elle vous écoutera un jour.
          </div>
        </section>
      )}

      {state === "record" && (
        <section className="panel fadeUp">
          <div className="headingBlock">
            <div className="eyebrow">MESSAGE VOCAL</div>
            <h1>Parlez comme si cette personne était là.</h1>
            <p className="sub">
              Votre voix fera peut-être partie du souvenir qu’elle gardera le
              plus longtemps.
            </p>
          </div>

          <div className="card">
            <p className="prompt">
              Vous pouvez commencer simplement :
              <br />
              <span>“Je voulais te dire que…”</span>
            </p>

            {showRecorder && (
              <AudioRecorder
                maxDurationSeconds={120}
                onRecordingComplete={handleRecordingComplete}
              />
            )}
          </div>

          <p className="liveHint">
            Prenez votre temps. Chaque mot compte.
          </p>
        </section>
      )}

      {state === "review" && (
        <section className="panel fadeUp">
          <div className="headingBlock">
            <div className="eyebrow">RÉÉCOUTE</div>
            <h1>Prenez un instant…</h1>
            <p className="sub">
              Réécoutez ce que vous venez de dire. Ce message pourrait rester
              gravé bien plus longtemps que vous ne l’imaginez.
            </p>
          </div>

          {audioUrl ? (
            <div className="reviewCard">
              <audio controls src={audioUrl} className="audio" />
            </div>
          ) : null}

          {showActions ? (
            <div className="actionsWrap fadeSoft">
              <div className="buttons">
                <button
                  onClick={handleValidate}
                  className="primary"
                  disabled={!canValidate}
                >
                  ✨ Valider définitivement
                </button>

                <button onClick={restartRecording} className="secondary">
                  🔁 Recommencer
                </button>
              </div>

              <p className="warning">
                ⚠️ Une fois validé, ce message ne pourra plus être modifié.
              </p>
            </div>
          ) : (
            <div className="pauseText fadeSoft">
              Laissez résonner encore quelques secondes…
            </div>
          )}
        </section>
      )}

      {state === "saving" && (
        <section className="finalScene fadeUp">
          <div className="eyebrow">TRANSFORMATION</div>
          <h1>Votre message est en train de devenir un souvenir.</h1>
          <p className="sub wide">
            Il quitte l’instant présent pour s’attacher au bijou.
          </p>
          <div className="pulseOrb" />
        </section>
      )}

      {state === "done" && (
        <section className="finalScene fadeUp">
          <div className="eyebrow">LIEN INVISIBLE</div>
          <h1>Ce message existe maintenant.</h1>
          <p className="sub wide">
            Un jour,
            <br />
            quelqu’un le découvrira.
            <br />
            <br />
            Et ce moment
            <br />
            n’appartiendra qu’à vous deux.
          </p>
        </section>
      )}

      {state === "buyerComplete" && !isClosing && (
        <section className="finalScene fadeUp">
          <div className="eyebrow">CONFIRMATION</div>
          <h1>Votre message est désormais lié à ce bijou.</h1>
          <p className="sub wide">
            Le destinataire pourra le découvrir
            <br />
            en scannant le bijou au moment voulu.
          </p>

          <div style={{ marginTop: "28px" }}>
            <button 
              className="primary" 
              onClick={() => setIsClosing(true)}
            >
              Terminer
            </button>
          </div>
        </section>
      )}

      {isClosing && (
        <div className="closingOverlay">
          <div className="closingLogo">
            <img src="/logo.png" alt="Mindwood" />
          </div>
          {showCloseHint && (
            <p className="closeHint">Vous pouvez fermer cet onglet</p>
          )}
        </div>
      )}

      <style jsx>{`
        .closingOverlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0c1727;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 48px;
          z-index: 9999;
        }

        .closeHint {
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          animation: fadeSoft 1s ease forwards;
        }

        .closingLogo {
          animation: logoAppearAndFade 3s ease-in-out;
        }

        .closingLogo img {
          width: 200px;
          height: 200px;
          object-fit: contain;
          filter: drop-shadow(0 0 32px rgba(255, 220, 130, 0.25)) drop-shadow(0 0 64px rgba(139, 115, 85, 0.15));
        }

        @keyframes logoAppearAndFade {
          0% {
            opacity: 0;
            transform: scale(0.7);
            filter: blur(8px);
          }
          15% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          85% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
            filter: blur(4px);
          }
        }

        .container {
          position: relative;
          min-height: 100vh;
          padding: 32px 20px;
          color: white;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }



        .bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 25%, rgba(255, 196, 140, 0.12), transparent 25%),
            radial-gradient(circle at 75% 30%, rgba(245, 145, 110, 0.08), transparent 28%),
            radial-gradient(circle at 55% 80%, rgba(255, 210, 165, 0.06), transparent 30%),
            linear-gradient(180deg, #0c1727 0%, #13233a 45%, #1a2741 100%);
          z-index: -3;
          animation: slowMove 18s ease-in-out infinite alternate;
        }

        .grain {
          position: absolute;
          inset: 0;
          z-index: -2;
          opacity: 0.08;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0.5px, transparent 0.6px),
            radial-gradient(circle at 80% 60%, rgba(255,255,255,0.6) 0.5px, transparent 0.6px),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.5) 0.5px, transparent 0.6px);
          background-size: 140px 140px;
          mix-blend-mode: soft-light;
          pointer-events: none;
        }

        .glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(80px);
          opacity: 0.16;
          z-index: -1;
          pointer-events: none;
        }

        .glowA {
          width: 260px;
          height: 260px;
          background: rgba(255, 173, 122, 0.65);
          top: 12%;
          left: 8%;
          animation: floatGlow 12s ease-in-out infinite alternate;
        }

        .glowB {
          width: 320px;
          height: 320px;
          background: rgba(248, 117, 96, 0.38);
          bottom: 10%;
          right: 10%;
          animation: floatGlow 14s ease-in-out infinite alternate-reverse;
        }

        .panel,
        .finalScene,
        .introScene {
          width: 100%;
          max-width: 980px;
          text-align: center;
        }

        .headingBlock {
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255, 215, 180, 0.78);
          margin-bottom: 16px;
        }

        h1 {
          font-size: 44px;
          line-height: 1.12;
          margin: 0 0 18px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.96);
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
        }

        .sub {
          font-size: 18px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.76);
          max-width: 760px;
          margin: 0 auto;
        }

        .wide {
          max-width: 880px;
        }

        .introScene {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 22px;
        }

        .introLine {
          font-size: 40px;
          line-height: 1.2;
          color: rgba(255, 255, 255, 0.2);
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 1.2s ease,
            transform 1.2s ease,
            color 1.2s ease;
          text-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        }

        .introLine.visible {
          opacity: 1;
          transform: translateY(0);
          color: rgba(255, 255, 255, 0.94);
        }

        .card,
        .reviewCard {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.03)
          );
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 28px;
          backdrop-filter: blur(10px);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .prompt {
          font-size: 19px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.78);
          margin: 0 0 22px;
        }

        .prompt span {
          display: inline-block;
          margin-top: 8px;
          color: rgba(255, 191, 210, 0.95);
          font-size: 24px;
        }

        .liveHint {
          margin-top: 22px;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.62);
        }

        .reviewCard {
          max-width: 720px;
          margin: 0 auto 28px;
        }

        .audio {
          width: 100%;
        }

        .actionsWrap {
          margin-top: 12px;
        }

        .buttons {
          display: flex;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .primary {
          min-width: 320px;
          padding: 18px 30px;
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, #f5a66c 0%, #ef7b5c 100%);
          color: white;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 18px 40px rgba(239, 123, 92, 0.28),
            0 0 0 rgba(239, 123, 92, 0.12);
          animation: pulseGlow 2.6s infinite;
        }

        .primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          animation: none;
        }

        .secondary {
          min-width: 240px;
          padding: 18px 28px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(255, 255, 255, 0.02);
          color: rgba(255, 255, 255, 0.95);
          font-size: 18px;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }

        .warning {
          margin-top: 18px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.56);
        }

        .pauseText {
          margin-top: 18px;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.56);
        }

        .finalScene {
          min-height: 64vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .pulseOrb {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          margin-top: 28px;
          background: linear-gradient(135deg, #f6b072, #f07d60);
          box-shadow: 0 0 28px rgba(240, 125, 96, 0.5);
          animation: orbPulse 1.8s ease-in-out infinite;
        }

        .error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 5;
          background: rgba(160, 40, 40, 0.18);
          border-bottom: 1px solid rgba(255, 120, 120, 0.35);
          color: rgba(255, 255, 255, 0.92);
          padding: 18px;
          text-align: center;
          font-size: 16px;
        }

        .fadeUp {
          animation: fadeUp 0.9s ease forwards;
        }

        .fadeSoft {
          animation: fadeSoft 0.8s ease forwards;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSoft {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slowMove {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.04);
          }
        }

        @keyframes floatGlow {
          from {
            transform: translateY(0) translateX(0);
          }
          to {
            transform: translateY(-12px) translateX(8px);
          }
        }

        @keyframes pulseGlow {
          0% {
            box-shadow:
              0 18px 40px rgba(239, 123, 92, 0.22),
              0 0 0 rgba(239, 123, 92, 0.08);
          }
          50% {
            box-shadow:
              0 18px 44px rgba(239, 123, 92, 0.34),
              0 0 28px rgba(239, 123, 92, 0.2);
          }
          100% {
            box-shadow:
              0 18px 40px rgba(239, 123, 92, 0.22),
              0 0 0 rgba(239, 123, 92, 0.08);
          }
        }

        @keyframes orbPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.85;
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 32px;
          }

          .introLine {
            font-size: 30px;
          }

          .sub,
          .prompt {
            font-size: 17px;
          }

          .prompt span {
            font-size: 22px;
          }

          .primary,
          .secondary {
            width: 100%;
            min-width: 0;
          }

          .card,
          .reviewCard {
            padding: 22px;
          }
        }
      `}</style>
    </div>
  );
}