// i18n system - domain-based language detection

export type Locale = "fr" | "en";

export function getLocaleFromHost(host: string | null): Locale {
  if (!host) return "fr";
  
  // .com = English, .fr = French
  if (host.includes(".com")) return "en";
  return "fr";
}

export const translations = {
  fr: {
    // Recording page
    record: {
      title: "Enregistrer votre message",
      locked: "Session verrouillée",
      lockedMessage: "Ce bijou a déjà un message enregistré définitivement.",
      attemptsRemaining: (n: number) => `${n} essai${n > 1 ? "s" : ""} restant${n > 1 ? "s" : ""}`,
      startRecording: "Démarrer l'enregistrement",
      stopRecording: "Arrêter l'enregistrement",
      listen: "Écouter",
      rerecord: "Réenregistrer",
      validate: "Valider définitivement",
      validating: "Validation...",
      validationSuccess: "Message validé avec succès !",
      redirecting: "Redirection vers la page d'écoute...",
      errorRecording: "Erreur lors de l'enregistrement",
      errorValidation: "Erreur lors de la validation",
      errorMicAccess: "Accès au microphone refusé",
      draftExpiry: "Votre brouillon expire dans",
      hours: "heures",
    },
    // Listen page
    listen: {
      title: "Votre message personnel",
      subtitle: "Ce message a été spécialement enregistré pour vous",
      listensRemaining: (n: number) => `${n} écoute${n > 1 ? "s" : ""} restante${n > 1 ? "s" : ""}`,
      play: "Écouter",
      pause: "Pause",
      recordedBy: "Enregistré par",
      duration: "Durée",
      noListensLeft: "Plus d'écoutes disponibles",
      recharge: "Recharger",
    },
    // Recharge page
    recharge: {
      title: "Recharger",
      subtitle: "Choisissez une offre pour continuer",
      credits: "crédits",
      listens: "écoutes",
      buy: "Acheter",
      processing: "Traitement en cours...",
      error: "Erreur lors du paiement",
    },
    // Success page
    success: {
      title: "Merci !",
      message: "Votre paiement a été enregistré avec succès.",
      subtitle: "Le bijou peut à nouveau être scanné.",
    },
    // Common
    common: {
      loading: "Chargement...",
      error: "Erreur",
      retry: "Réessayer",
      cancel: "Annuler",
      confirm: "Confirmer",
      close: "Fermer",
    },
  },
  en: {
    // Recording page
    record: {
      title: "Record your message",
      locked: "Session locked",
      lockedMessage: "This jewelry already has a permanently recorded message.",
      attemptsRemaining: (n: number) => `${n} attempt${n > 1 ? "s" : ""} remaining`,
      startRecording: "Start recording",
      stopRecording: "Stop recording",
      listen: "Listen",
      rerecord: "Re-record",
      validate: "Validate permanently",
      validating: "Validating...",
      validationSuccess: "Message validated successfully!",
      redirecting: "Redirecting to listen page...",
      errorRecording: "Error during recording",
      errorValidation: "Error during validation",
      errorMicAccess: "Microphone access denied",
      draftExpiry: "Your draft expires in",
      hours: "hours",
    },
    // Listen page
    listen: {
      title: "Your personal message",
      subtitle: "This message was specially recorded for you",
      listensRemaining: (n: number) => `${n} listen${n > 1 ? "s" : ""} remaining`,
      play: "Play",
      pause: "Pause",
      recordedBy: "Recorded by",
      duration: "Duration",
      noListensLeft: "No listens left",
      recharge: "Recharge",
    },
    // Recharge page
    recharge: {
      title: "Recharge",
      subtitle: "Choose an offer to continue",
      credits: "credits",
      listens: "listens",
      buy: "Buy",
      processing: "Processing...",
      error: "Payment error",
    },
    // Success page
    success: {
      title: "Thank you!",
      message: "Your payment has been successfully recorded.",
      subtitle: "The jewelry can be scanned again.",
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      cancel: "Cancel",
      confirm: "Confirm",
      close: "Close",
    },
  },
};

export function useTranslations(locale: Locale) {
  return translations[locale];
}
