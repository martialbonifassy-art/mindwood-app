"use client";

import { useEffect, useRef, useState } from "react";

type AudioRecorderProps = {
  maxDurationSeconds?: number;
  onRecordingComplete: (blob: Blob, durationSeconds: number) => Promise<void>;
  disabled?: boolean;
};

export default function AudioRecorder({
  maxDurationSeconds = 120,
  onRecordingComplete,
  disabled = false,
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  function cleanup() {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function startRecording() {
    try {
      setError(null);
      setIsProcessing(false);
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      recordingStartRef.current = Date.now();

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("ondataavailable chunk:", event.data.size);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Erreur pendant l'enregistrement audio.");
        setIsRecording(false);
        setIsProcessing(false);
        cleanup();
      };

      mediaRecorder.onstop = async () => {
        console.log("MediaRecorder onstop fired");
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const durationSeconds = recordingStartRef.current
          ? Math.max(
              1,
              Math.floor((Date.now() - recordingStartRef.current) / 1000)
            )
          : recordingTime;

        setRecordingTime(durationSeconds);
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const blobType =
            mediaRecorder.mimeType || (mimeType ? mimeType : "audio/webm");
          const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

          console.log("Audio blob final:", audioBlob);
          console.log("Audio blob size:", audioBlob.size);
          console.log("Duration final:", durationSeconds);

          if (!audioBlob.size) {
            throw new Error("Aucun audio n’a été capturé.");
          }

          await onRecordingComplete(audioBlob, durationSeconds);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du traitement de l'audio";
          console.error("onRecordingComplete error:", err);
          setError(message);
        } finally {
          setIsProcessing(false);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          mediaRecorderRef.current = null;
          recordingStartRef.current = null;
          audioChunksRef.current = [];
        }
      };

      timerIntervalRef.current = window.setInterval(() => {
        if (!recordingStartRef.current) return;

        const elapsed = Math.floor(
          (Date.now() - recordingStartRef.current) / 1000
        );
        setRecordingTime(elapsed);

        if (
          elapsed >= maxDurationSeconds &&
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          console.log("Auto-stop reached max duration");
          stopRecording();
        }
      }, 200);

      mediaRecorder.start(250);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'accéder au micro";
      console.error("startRecording error:", err);
      setError(message);
      cleanup();
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;

    try {
      console.log("stopRecording called");
      if (recorder.state === "recording") {
        recorder.requestData();
        recorder.stop();
      }
    } catch (err) {
      console.error("stopRecording error:", err);
      setError("Impossible d’arrêter correctement l’enregistrement.");
      cleanup();
      setIsRecording(false);
      setIsProcessing(false);
    }
  }

  return (
    <div style={S.container}>
      {error && (
        <div style={S.error}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div style={S.display}>
        <div style={S.timer}>
          {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
        </div>
        <div style={S.statusText}>
          {isRecording
            ? "🎙️ En cours..."
            : isProcessing
              ? "📤 Traitement..."
              : "Prêt"}
        </div>
      </div>

      <div style={S.buttons}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || isProcessing}
            style={{
              ...S.btn,
              ...S.btnRecord,
              opacity: disabled || isProcessing ? 0.6 : 1,
              cursor:
                disabled || isProcessing ? "not-allowed" : "pointer",
            }}
          >
            🎙️ Enregistrer
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...S.btn, ...S.btnStop }}>
            ⏹️ Arrêter
          </button>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 480px) {
          div {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: {
    display: "grid",
    gap: 16,
  },
  error: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(220,100,80,0.35)",
    background:
      "linear-gradient(135deg, rgba(80,35,25,0.65), rgba(65,28,20,0.75))",
    color: "rgba(240,160,140,1)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  display: {
    textAlign: "center",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(210,150,90,0.28)",
    background:
      "linear-gradient(135deg, rgba(48,32,20,0.65), rgba(38,25,16,0.75))",
  },
  timer: {
    fontSize: 32,
    fontWeight: 950,
    background:
      "linear-gradient(135deg, rgba(245,215,180,1), rgba(210,160,110,1))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    opacity: 0.75,
    color: "rgba(220,190,170,0.95)",
  },
  buttons: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  btn: {
    padding: "14px 28px",
    borderRadius: 16,
    border: "2px solid rgba(140,85,45,0.55)",
    fontWeight: 950,
    fontSize: 13,
    letterSpacing: 0.3,
    cursor: "pointer",
    transition: "all 200ms ease",
  },
  btnRecord: {
    background:
      "linear-gradient(135deg, rgba(220,160,100,1) 0%, rgba(180,110,60,1) 50%, rgba(140,85,45,1) 100%)",
    boxShadow:
      "0 12px 30px rgba(180,100,50,0.3), inset 0 1px 0 rgba(255,220,180,0.35)",
    color: "rgba(25,15,8,1)",
  },
  btnStop: {
    background:
      "linear-gradient(135deg, rgba(220,100,100,1) 0%, rgba(180,60,60,1) 50%, rgba(140,45,45,1) 100%)",
    boxShadow:
      "0 12px 30px rgba(180,60,60,0.3), inset 0 1px 0 rgba(255,180,180,0.35)",
    color: "rgba(25,15,8,1)",
  },
};