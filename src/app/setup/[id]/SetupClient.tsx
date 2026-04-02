"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { THEMES } from "@/data/themes";
import { LuxeDropdown } from "@/components/LuxeDropdown";

type FormState = {
  prenom: string;
  lieu: string;
  souvenir: string;
  theme: string;
  sous_theme: string;
  voix: "masculin" | "feminin";
};

type ActionMode = "create" | "edit" | null;
type MessageMode = "ia" | "voice" | null;

function clean(v: string) {
  return v.trim();
}

export default function SetupClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id_bijou = params?.id;

  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [messageMode, setMessageMode] = useState<MessageMode>(null);

  const [form, setForm] = useState<FormState>({
    prenom: "",
    lieu: "",
    souvenir: "",
    theme: "",
    sous_theme: "",
    voix: "feminin",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTheme = useMemo(
    () => THEMES.find((t) => t.value === form.theme) ?? null,
    [form.theme]
  );

  const availableSubthemes = useMemo(
    () => selectedTheme?.subthemes ?? [],
    [selectedTheme]
  );

  const selectedSubtheme = useMemo(
    () => availableSubthemes.find((s) => s.value === form.sous_theme) ?? null,
    [availableSubthemes, form.sous_theme]
  );

  const pageTitle =
    actionMode === "edit" ? "Modifier le message IA" : "Créer un message IA";

  const submitLabel =
    actionMode === "edit"
      ? "✨ Mettre à jour ce lien invisible"
      : "✨ Créer ce lien invisible";

  const successTitle =
    actionMode === "edit"
      ? "✅ Le message a été mis à jour"
      : "✅ Le message a été créé";

  const successText =
    actionMode === "edit"
      ? "Ce bijou porte désormais une nouvelle version de votre message."
      : "Le message est maintenant lié à ce bijou.";

  async function onSave() {
    if (saving) return;
    setError(null);

    if (!id_bijou) {
      setError("ID bijou manquant dans l’URL.");
      return;
    }

    const prenom = clean(form.prenom);
    const theme = clean(form.theme);
    const sous_theme = clean(form.sous_theme);

    if (!prenom || !theme || !sous_theme) {
      setError(
        "Merci de renseigner au minimum le prénom, l’intention et le sous-thème."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id_bijou,
        prenom,
        lieu: clean(form.lieu),
        souvenir: clean(form.souvenir),
        theme,
        sous_theme,
        voix: form.voix,
      };

      const { data: existingRows, error: existingError } = await supabase
        .from("personnalisations")
        .select("id_bijou")
        .eq("id_bijou", id_bijou)
        .limit(1);

      if (existingError) {
        setError(existingError.message);
        return;
      }

      const hasExistingPersonalisation = (existingRows?.length ?? 0) > 0;

      const { error: saveError } = hasExistingPersonalisation
        ? await supabase
            .from("personnalisations")
            .update(payload)
            .eq("id_bijou", id_bijou)
        : await supabase.from("personnalisations").insert([payload]);

      if (saveError) {
        setError(saveError.message);
        return;
      }

      setSaved(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erreur inconnue lors de l'enregistrement.");
      }
    } finally {
      setSaving(false);
    }
  }

  function resetToActionChoice() {
    setSaved(false);
    setError(null);
    setActionMode(null);
    setMessageMode(null);
  }

  function backToMessageChoice() {
    setSaved(false);
    setError(null);
    setMessageMode(null);
  }

  function handleSelectVoice() {
    if (!id_bijou) {
      setError("ID bijou manquant dans l’URL.");
      return;
    }
    router.push(`/record/${id_bijou}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 22,
        fontFamily: "system-ui",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,248,240,0.72), rgba(210,174,132,0.72)), radial-gradient(900px 500px at 10% 0%, rgba(170, 120, 75, 0.18), transparent 55%), radial-gradient(1200px 600px at 90% 10%, rgba(90, 60, 35, 0.16), transparent 60%), url('/atelier_bois.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: 18,
          borderRadius: 24,
          border: "1px solid rgba(110, 70, 40, 0.25)",
          background:
            "linear-gradient(160deg, rgba(255,250,245,0.95) 0%, rgba(244,230,212,0.92) 55%, rgba(225,204,178,0.9) 100%)",
          boxShadow: "0 30px 90px rgba(70, 45, 25, 0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.4 }}>
            Personnalisation du bijou
          </h1>
          <p style={{ margin: 0, opacity: 0.65, fontSize: 13 }}>
            ID bijou : {id_bijou ?? "(introuvable)"}
          </p>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 20,
            border: "1px solid rgba(110, 70, 40, 0.12)",
            background: "rgba(255,255,255,0.38)",
            lineHeight: 1.55,
            color: "rgba(45,28,16,0.92)",
            boxShadow: "0 10px 30px rgba(70, 45, 25, 0.08)",
          }}
        >
          <div style={{ fontWeight: 850, fontSize: 15, marginBottom: 6 }}>
            Ce bijou peut porter quelque chose d’invisible, mais profondément
            réel.
          </div>
          <div style={{ fontSize: 14, opacity: 0.86 }}>
            Prenez un instant pour créer un message qui restera lié à cet objet
            et à la personne à qui il est destiné.
          </div>
        </div>

        {!actionMode ? (
          <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
            <div
              style={{
                padding: 16,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              <b>Que souhaitez-vous faire avec ce bijou ?</b>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Choisissez l’action que vous souhaitez réaliser pour lui donner
                une voix.
              </div>
            </div>

            <ActionCard
              title="Créer un message"
              description="Créer un nouveau message à associer à ce bijou."
              onClick={() => {
                setActionMode("create");
                setMessageMode(null);
                setSaved(false);
                setError(null);
              }}
            />

            <ActionCard
              title="Modifier le message"
              description="Modifier ou remplacer le message déjà associé à ce bijou."
              onClick={() => {
                setActionMode("edit");
                setMessageMode(null);
                setSaved(false);
                setError(null);
              }}
            />
          </div>
        ) : !messageMode ? (
          <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
            <div
              style={{
                padding: 16,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              <b>Comment souhaitez-vous créer ce message ?</b>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Choisissez la forme que prendra ce lien : un message généré ou
                votre propre voix.
              </div>
            </div>

            <ActionCard
              title="Message IA"
              description="Un message créé à partir de votre intention, de vos souvenirs et de vos mots."
              onClick={() => {
                setMessageMode("ia");
                setSaved(false);
                setError(null);
              }}
            />

            <ActionCard
              title="Voix enregistrée"
              description="Un message avec votre vraie voix, pour une présence encore plus intime."
              onClick={handleSelectVoice}
            />

            <button
              onClick={resetToActionChoice}
              style={secondaryButtonStyle}
            >
              ← Retour
            </button>
          </div>
        ) : messageMode === "ia" && !saved ? (
          <>
            <div style={{ marginTop: 20, display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>{pageTitle}</h2>
              <p style={{ margin: 0, opacity: 0.78, fontSize: 14, lineHeight: 1.5 }}>
                Vous êtes sur le point de créer un message qui sera lié à ce bijou.
              </p>
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              <Field
                label="À qui s’adresse ce message ? *"
                value={form.prenom}
                placeholder="Camille"
                onChange={(v) => setForm((p) => ({ ...p, prenom: v }))}
              />

              <Field
                label="Quel lieu vous relie ?"
                value={form.lieu}
                placeholder="Paris"
                onChange={(v) => setForm((p) => ({ ...p, lieu: v }))}
              />

              <Field
                label="Quel souvenir souhaitez-vous évoquer ?"
                value={form.souvenir}
                placeholder="Notre premier café"
                onChange={(v) => setForm((p) => ({ ...p, souvenir: v }))}
              />

              <LuxeDropdown
                label="Quelle est votre intention ? *"
                hint="Choisissez ce que vous souhaitez transmettre"
                value={form.theme}
                onChange={(v) =>
                  setForm((p) => ({ ...p, theme: v, sous_theme: "" }))
                }
                options={THEMES.map((t) => ({
                  value: t.value,
                  label: t.label,
                  hint: t.description,
                }))}
                placeholder="Sélectionner une intention…"
              />

              <LuxeDropdown
                label="Quelle nuance voulez-vous lui donner ? *"
                hint={
                  !selectedTheme
                    ? "Choisissez d’abord une intention"
                    : `${availableSubthemes.length} choix`
                }
                value={form.sous_theme}
                onChange={(v) => setForm((p) => ({ ...p, sous_theme: v }))}
                options={availableSubthemes.map((s) => ({
                  value: s.value,
                  label: s.label,
                  hint: s.example,
                }))}
                disabled={!selectedTheme}
                placeholder={
                  selectedTheme
                    ? "Sélectionner une nuance…"
                    : "Sélectionner d’abord une intention…"
                }
              />

              {selectedSubtheme?.example ? (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.02)",
                    lineHeight: 1.45,
                    fontSize: 13,
                  }}
                >
                  <b>Exemple :</b> {selectedSubtheme.example}
                </div>
              ) : null}

              <LuxeDropdown
                label="Quelle voix voulez-vous donner à ce message ?"
                hint="Tonalité du message"
                value={form.voix}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    voix: v as FormState["voix"],
                  }))
                }
                options={[
                  {
                    value: "feminin",
                    label: "Féminin",
                    hint: "Doux, enveloppant",
                  },
                  {
                    value: "masculin",
                    label: "Masculin",
                    hint: "Posé, rassurant",
                  },
                ]}
                placeholder="Choisir une voix…"
              />
            </div>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  border: "1px solid rgba(255,0,170,0.45)",
                  borderRadius: 16,
                  background: "rgba(255,0,170,0.04)",
                  lineHeight: 1.5,
                }}
              >
                <b>Erreur :</b> {error}
              </div>
            )}

            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
              <button
                onClick={onSave}
                disabled={saving}
                style={{
                  padding: "15px 14px",
                  borderRadius: 18,
                  border: "1px solid rgba(110, 70, 40, 0.35)",
                  background: saving
                    ? "rgba(90, 60, 35, 0.15)"
                    : "linear-gradient(120deg, rgba(140, 90, 55, 0.95), rgba(190, 135, 85, 0.95))",
                  color: saving ? "rgba(50, 30, 15, 0.6)" : "#fffaf3",
                  width: "100%",
                  fontWeight: 850,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: saving
                    ? "none"
                    : "0 18px 45px rgba(70, 45, 25, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)",
                  letterSpacing: 0.2,
                  transition:
                    "transform 180ms ease, box-shadow 200ms ease, filter 200ms ease",
                }}
                onMouseEnter={(event) => {
                  if (saving) return;
                  event.currentTarget.style.transform = "translateY(-2px)";
                  event.currentTarget.style.boxShadow =
                    "0 26px 65px rgba(70, 45, 25, 0.38), inset 0 1px 0 rgba(255,255,255,0.5)";
                  event.currentTarget.style.filter = "brightness(1.06)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.boxShadow = saving
                    ? "none"
                    : "0 18px 45px rgba(70, 45, 25, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)";
                  event.currentTarget.style.filter = "none";
                }}
                onMouseDown={(event) => {
                  if (saving) return;
                  event.currentTarget.style.transform =
                    "translateY(2px) scale(0.985)";
                }}
                onMouseUp={(event) => {
                  if (saving) return;
                  event.currentTarget.style.transform = "translateY(-2px)";
                }}
              >
                {saving ? "Création du lien…" : submitLabel}
              </button>

              <button onClick={backToMessageChoice} style={secondaryButtonStyle}>
                ← Retour
              </button>
            </div>

            <p style={{ marginTop: 12, opacity: 0.68, fontSize: 13, lineHeight: 1.5 }}>
              Quand ce message sera enregistré, il fera désormais partie de ce bijou.
            </p>
          </>
        ) : (
          <div
            style={{
              marginTop: 20,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 18,
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{successTitle}</h2>
            <p style={{ lineHeight: 1.55 }}>{successText}</p>

            {id_bijou && (
              <a
                href={`/listen/${id_bijou}`}
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  textDecoration: "underline",
                }}
              >
                Ouvrir la page d’écoute
              </a>
            )}

            <div style={{ marginTop: 14 }}>
              <button onClick={resetToActionChoice} style={secondaryButtonStyle}>
                Revenir au menu du bijou
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 18,
        borderRadius: 20,
        border: "1px solid rgba(110, 70, 40, 0.22)",
        background:
          "linear-gradient(140deg, rgba(255,252,248,0.98) 0%, rgba(246,233,216,0.95) 100%)",
        boxShadow: "0 14px 40px rgba(70, 45, 25, 0.12)",
        cursor: "pointer",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow =
          "0 22px 55px rgba(70, 45, 25, 0.18)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow =
          "0 14px 40px rgba(70, 45, 25, 0.12)";
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          color: "rgba(36,22,12,0.96)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          lineHeight: 1.5,
          color: "rgba(36,22,12,0.75)",
        }}
      >
        {description}
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 18,
          border: "1px solid rgba(110, 70, 40, 0.25)",
          background:
            "linear-gradient(140deg, rgba(255,252,248,0.98) 0%, rgba(246,233,216,0.95) 100%)",
          boxShadow: "0 14px 40px rgba(70, 45, 25, 0.18)",
          outline: "none",
          fontSize: 16,
          fontWeight: 650,
          color: "rgba(36, 22, 12, 0.96)",
        }}
      />
    </label>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(110, 70, 40, 0.22)",
  background: "rgba(255,255,255,0.55)",
  color: "rgba(50, 30, 15, 0.9)",
  width: "100%",
  fontWeight: 700,
  cursor: "pointer",
};