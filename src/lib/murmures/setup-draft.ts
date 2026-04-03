import {
  MURMURE_EFFECTS,
  MURMURE_INTENSITIES,
  MURMURE_LENGTHS,
  MURMURE_THEMES,
  MURMURE_TONES,
  type MurmureThemeId,
} from "./theme-definitions";

export type MurmureDraft = {
  recipientFirstName: string;
  relationshipType: string;
  language: "fr" | "en";
  voice: "feminin" | "masculin";
  tone: (typeof MURMURE_TONES)[number];
  emotionalIntensity: (typeof MURMURE_INTENSITIES)[number];
  lengthPreference: (typeof MURMURE_LENGTHS)[number];
  desiredEffect: (typeof MURMURE_EFFECTS)[number];
  theme: MurmureThemeId | "";
  criteriaAnswers: string[];
};

export const initialMurmureDraft: MurmureDraft = {
  recipientFirstName: "",
  relationshipType: "",
  language: "fr",
  voice: "feminin",
  tone: "tendre",
  emotionalIntensity: "sensible",
  lengthPreference: "moyen",
  desiredEffect: "un apaisement",
  theme: "",
  criteriaAnswers: [],
};

function key(id: string) {
  return `murmure:draft:${id}`;
}

export function loadMurmureDraft(id: string): MurmureDraft {
  if (typeof window === "undefined") return initialMurmureDraft;

  try {
    const raw = window.localStorage.getItem(key(id));
    if (!raw) return initialMurmureDraft;

    const parsed = JSON.parse(raw) as Partial<MurmureDraft>;
    return {
      ...initialMurmureDraft,
      ...parsed,
      criteriaAnswers: Array.isArray(parsed.criteriaAnswers)
        ? parsed.criteriaAnswers.map((v) => String(v ?? ""))
        : [],
    };
  } catch {
    return initialMurmureDraft;
  }
}

export function saveMurmureDraft(id: string, draft: MurmureDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(id), JSON.stringify(draft));
}

export function clearMurmureDraft(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(id));
}

export function getMurmureTheme(themeId: MurmureThemeId | "") {
  if (!themeId) return null;
  return MURMURE_THEMES.find((t) => t.id === themeId) ?? null;
}
