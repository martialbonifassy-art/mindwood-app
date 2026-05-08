"use client";

import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "contact@grainatelier.fr";

type FormState = {
  companyType: string;
  quantity: string;
  personalization: string;
  nfcContent: string;
  timeline: string;
  contactDetails: string;
};

const initialState: FormState = {
  companyType: "",
  quantity: "",
  personalization: "",
  nfcContent: "",
  timeline: "",
  contactDetails: "",
};

export default function EntreprisesContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.companyType.trim() || !form.contactDetails.trim()) {
      setError("Merci de préciser au minimum votre projet et vos coordonnées.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "L’envoi du message a échoué.");
      }

      setSuccessMessage(
        payload.message || "Merci. Votre demande a bien été envoyée, nous reviendrons vers vous rapidement."
      );
      setForm(initialState);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue lors de l’envoi de votre demande."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mw-card p-6 md:p-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.28em] mw-link">Parlez-nous de votre projet</p>
        <h2 className="mt-3 text-3xl font-semibold text-stone-50">Formulaire de contact</h2>
        <p className="mt-4 text-base leading-relaxed mw-muted">
          Vous pouvez nous indiquer le type d&apos;entreprise ou d&apos;événement, le nombre d&apos;objets souhaités,
          la personnalisation envisagée, le contenu lié à la puce NFC, votre délai et vos coordonnées.
        </p>
      </div>

      <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-stone-100">Type d&apos;entreprise ou d&apos;événement</span>
          <input
            className="mw-input"
            value={form.companyType}
            onChange={(event) => updateField("companyType", event.target.value)}
            placeholder="Ex. hôtel, séminaire, mariage, domaine viticole"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-100">Nombre d&apos;objets souhaités</span>
          <input
            className="mw-input"
            value={form.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
            placeholder="Ex. 50 unités"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-100">Délai souhaité</span>
          <input
            className="mw-input"
            value={form.timeline}
            onChange={(event) => updateField("timeline", event.target.value)}
            placeholder="Ex. pour octobre 2026"
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-stone-100">Type de personnalisation envisagé</span>
          <textarea
            className="mw-input min-h-28"
            value={form.personalization}
            onChange={(event) => updateField("personalization", event.target.value)}
            placeholder="Logo, gravure, coffret, série numérotée, QR code..."
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-stone-100">Contenu à associer à la puce NFC</span>
          <textarea
            className="mw-input min-h-28"
            value={form.nfcContent}
            onChange={(event) => updateField("nfcContent", event.target.value)}
            placeholder="Vidéo, message de bienvenue, galerie photo, page dédiée..."
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium text-stone-100">Vos coordonnées</span>
          <textarea
            className="mw-input min-h-28"
            value={form.contactDetails}
            onChange={(event) => updateField("contactDetails", event.target.value)}
            placeholder="Nom, entreprise, email, téléphone"
          />
        </label>

        <div className="md:col-span-2 flex flex-col gap-4 pt-2">
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm text-[var(--gold)]">
              {successMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="mw-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mw-btn-ghost inline-flex items-center justify-center px-6 py-3 text-sm uppercase tracking-[0.16em]"
            >
              Échanger sur votre projet
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}