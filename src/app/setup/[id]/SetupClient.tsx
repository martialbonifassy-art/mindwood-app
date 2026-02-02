"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

function clean(v: string) {
  return v.trim();
}

export default function SetupClient() {
  const params = useParams<{ id: string }>();
  const id_bijou = params?.id;

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

  const availableSubthemes = selectedTheme?.subthemes ?? [];

  const selectedSubtheme = useMemo(
    () => availableSubthemes.find((s) => s.value === form.sous_theme) ?? null,
    [availableSubthemes, form.sous_theme]
  );

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
      setError("Merci de remplir au minimum : prénom, thème, sous-thème.");
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from("personnalisations")
        .insert([
          {
            id_bijou,
            prenom,
            lieu: clean(form.lieu),
            souvenir: clean(form.souvenir),
            theme,
            sous_theme,
            voix: form.voix,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
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
          maxWidth: 740,
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
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: -0.4 }}>
            Personnalisation du bijou
          </h1>
          <p style={{ margin: 0, opacity: 0.65, fontSize: 13 }}>
            ID bijou : {id_bijou ?? "(introuvable)"}
          </p>
        </div>

        {!saved ? (
          <>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {/* Champs texte en style premium */}
              <Field
                label="Prénom *"
                value={form.prenom}
                placeholder="Camille"
                onChange={(v) => setForm((p) => ({ ...p, prenom: v }))}
              />
              <Field
                label="Lieu (en commun)"
                value={form.lieu}
                placeholder="Paris"
                onChange={(v) => setForm((p) => ({ ...p, lieu: v }))}
              />
              <Field
                label="Souvenir (en commun)"
                value={form.souvenir}
                placeholder="Notre premier café"
                onChange={(v) => setForm((p) => ({ ...p, souvenir: v }))}
              />

              {/* LuxeDropdown thème */}
              <LuxeDropdown
                label="Thème *"
                hint="Choisis une intention"
                value={form.theme}
                onChange={(v) =>
                  setForm((p) => ({ ...p, theme: v, sous_theme: "" }))
                }
                options={THEMES.map((t) => ({
                  value: t.value,
                  label: t.label,
                  hint: t.description, // IMPORTANT : hint = description => rendu luxe
                }))}
                placeholder="Sélectionner un thème…"
              />

              {/* Sous-thème */}
              <LuxeDropdown
                label="Sous-thème *"
                hint={
                  !selectedTheme
                    ? "Choisis d’abord un thème"
                    : `${availableSubthemes.length} choix`
                }
                value={form.sous_theme}
                onChange={(v) => setForm((p) => ({ ...p, sous_theme: v }))}
                options={availableSubthemes.map((s) => ({
                  value: s.value,
                  label: s.label,
                  hint: s.example, // IMPORTANT : hint = exemple => rendu luxe
                }))}
                disabled={!selectedTheme}
                placeholder={
                  selectedTheme
                    ? "Sélectionner un sous-thème…"
                    : "Sélectionner un thème d’abord…"
                }
              />

              {/* Badge subtil exemple choisi */}
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
                label="Voix"
                hint="Tonalité du message"
                value={form.voix}
                onChange={(v) => setForm((p) => ({ ...p, voix: v as FormState["voix"] }))}
                options={[
                  { value: "feminin", label: "Féminin", hint: "Doux, enveloppant" },
                  { value: "masculin", label: "Masculin", hint: "Posé, rassurant" },
                ]}
                placeholder="Choisir une voix…"
              />
            </div>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  border: "1px solid rgba(255,0,170,0.45)",
                  borderRadius: 16,
                  background: "rgba(255,0,170,0.04)",
                }}
              >
                <b>Erreur :</b> {error}
              </div>
            )}

            <button
              onClick={onSave}
              disabled={saving}
              style={{
                marginTop: 18,
                padding: "14px 14px",
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
                transition: "transform 180ms ease, box-shadow 200ms ease, filter 200ms ease",
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
                event.currentTarget.style.transform = "translateY(2px) scale(0.985)";
              }}
              onMouseUp={(event) => {
                if (saving) return;
                event.currentTarget.style.transform = "translateY(-2px)";
              }}
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer définitivement les paramètres du bijou"}
            </button>

            <p style={{ marginTop: 10, opacity: 0.65, fontSize: 13 }}>
              * Une fois enregistré, tu pourras scanner ton bijou pour découvrir les messages.
            </p>
          </>
        ) : (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 18,
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>✅ Paramètres enregistrés</h2>
            <p>Tu peux maintenant scanner ton bijou pour découvrir tes messages.</p>

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
          </div>
        )}
      </div>
    </main>
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