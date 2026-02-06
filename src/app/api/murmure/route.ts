import { NextResponse } from "next/server";
import crypto from "crypto";

type Body = {
  prenom?: string;
  theme?: string;      // peut être id ("amour") OU value ("Amour") OU label ("❤️ Amour")
  sous_theme?: string; // valeur libre (ex: "Pour ma femme")
  lieu?: string;
  souvenir?: string;
  langue?: "fr" | "en" | string;
  voix?: "masculin" | "feminin" | string;
};

// -------- helpers --------
function clean(v: any) {
  return String(v ?? "").trim();
}

function clamp(s: string, max = 140) {
  const t = clean(s);
  return t.length > max ? t.slice(0, max) : t;
}

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function pickStable<T>(arr: T[], seed: string) {
  const h = sha1(seed);
  const n = parseInt(h.slice(0, 2), 16);
  return arr[n % arr.length];
}

function normalizeLang(langue: string) {
  const l = clean(langue).toLowerCase();
  return l.startsWith("en") ? "en" : "fr";
}

function normalizeVoice(voix: string) {
  const v = clean(voix).toLowerCase();
  return v.includes("masc") ? "masculin" : "feminin";
}

function keyify(s: string) {
  return clean(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// -------- intent mapping --------
type Intent =
  | "love"
  | "gratitude"
  | "healing"
  | "life_path"
  | "courage"
  | "creativity"
  | "night"
  | "mindfulness"
  | "wood_guardian"
  | "renewal"
  | "intuition"
  | "projects"
  | "celebration"
  | "calm"
  | "connection"
  | "self_confidence"
  | "difficulties"
  | "alignment"
  | "roots"
  | "energy"
  | "default";

function inferIntent(themeRaw: string, sousRaw: string): Intent {
  const t = keyify(themeRaw);
  const s = keyify(sousRaw);

  const byTheme: Record<string, Intent> = {
    amour: "love",
    gratitude: "gratitude",
    guerison: "healing",
    chemin_vie: "life_path",
    courage: "courage",
    creativite: "creativity",
    reves: "night",
    presence: "mindfulness",
    gardien_bois: "wood_guardian",
    cycles: "renewal",
    intuition: "intuition",
    projets: "projects",
    celebration: "celebration",
    calme: "calm",
    connexion: "connection",
    confiance: "self_confidence",
    difficultes: "difficulties",
    alignement: "alignment",
    racines: "roots",
    energie: "energy",
  };

  if (byTheme[t]) return byTheme[t];

  const blob = `${t}__${s}`;
  if (blob.includes("amour")) return "love";
  if (blob.includes("gratitude")) return "gratitude";
  if (blob.includes("guerison") || blob.includes("apaisement") || blob.includes("deuil") || blob.includes("angoisse")) return "healing";
  if (blob.includes("chemin") || blob.includes("orientation") || blob.includes("decision") || blob.includes("direction")) return "life_path";
  if (blob.includes("courage") || blob.includes("depassement") || blob.includes("defi") || blob.includes("peur")) return "courage";
  if (blob.includes("creativite") || blob.includes("inspiration")) return "creativity";
  if (blob.includes("reves") || blob.includes("nuit") || blob.includes("endormissement")) return "night";
  if (blob.includes("presence") || blob.includes("pleine_conscience") || blob.includes("respiration")) return "mindfulness";
  if (blob.includes("gardien") || blob.includes("bois") || blob.includes("foret")) return "wood_guardian";
  if (blob.includes("cycles") || blob.includes("renouveau") || blob.includes("transition")) return "renewal";
  if (blob.includes("intuition") || blob.includes("synchronicites")) return "intuition";
  if (blob.includes("projets") || blob.includes("objectifs") || blob.includes("intention")) return "projects";
  if (blob.includes("celebration") || blob.includes("joie") || blob.includes("anniversaire") || blob.includes("reussite")) return "celebration";
  if (blob.includes("calme") || blob.includes("serenite") || blob.includes("stress")) return "calm";
  if (blob.includes("connexion") || blob.includes("lien") || blob.includes("communiquer")) return "connection";
  if (blob.includes("confiance")) return "self_confidence";
  if (blob.includes("difficultes")) return "difficulties";
  if (blob.includes("alignement") || blob.includes("authenticite")) return "alignment";
  if (blob.includes("racines") || blob.includes("origines") || blob.includes("famille")) return "roots";
  if (blob.includes("energie") || blob.includes("vitalite")) return "energy";

  return "default";
}

function buildFr(p: {
  prenom: string;
  lieu: string;
  souvenir: string;
  intent: Intent;
  voice: "masculin" | "feminin";
  seed: string;
}) {
  const { prenom, lieu, souvenir, intent, voice, seed } = p;

  const open = pickStable(
    [`${prenom},`, `${prenom}, écoute.`, `${prenom}, petit rappel.`, `${prenom}, juste quelques mots.`],
    seed + "::open"
  );

  const where = lieu
    ? pickStable(
        [`Ici, à ${lieu}, prends 10 secondes pour toi.`, `À ${lieu}, respire un instant.`, `Là, à ${lieu}, reviens au calme.`],
        seed + "::where"
      )
    : "";

  const mem = souvenir
    ? pickStable(
        [
          `Pense à "${souvenir}". Garde ce souvenir comme un point d'appui.`,
          `"${souvenir}" : rappelle-toi que tu sais déjà avancer.`,
          `Quand "${souvenir}" te revient, rappelle-toi que tu es capable.`,
        ],
        seed + "::souvenir"
      )
    : pickStable(
        ["Tu n'as pas besoin de tout gérer aujourd'hui.", "Tu peux faire simple, là, maintenant.", "Tu as le droit de ralentir."],
        seed + "::nosouvenir"
      );

  const tonePrefix =
    voice === "masculin"
      ? pickStable(["Je te le dis calmement :", "Je te le dis simplement :", "Je te le dis franchement :"], seed + "::toneM")
      : pickStable(["Je te le dis doucement :", "Je te le dis simplement :", "Je te le dis avec tendresse :"], seed + "::toneF");

  const coreMessages: Record<Intent, string[]> = {
    love: [
      `${tonePrefix} tu comptes. Vraiment.`,
      `${tonePrefix} tu es aimée.`,
      `${tonePrefix} tu n'as rien à prouver pour mériter l'amour.`,
    ],
    gratitude: [
      `${tonePrefix} merci. Pour toi, pour ce que tu fais, pour ce que tu es.`,
      `${tonePrefix} ce que tu donnes a de la valeur.`,
      `${tonePrefix} tu peux être fière de toi.`,
    ],
    healing: [
      `${tonePrefix} ça peut être lourd… mais tu n'es pas seule.`,
      `${tonePrefix} tu as le droit d'être fragile. Et tu vas te relever.`,
      `${tonePrefix} un pas à la fois. C'est déjà bien.`,
    ],
    life_path: [
      `${tonePrefix} tu n'as pas besoin d'avoir toutes les réponses. Juste la prochaine.`,
      `${tonePrefix} choisis ce qui te rend plus alignée, pas ce qui rassure les autres.`,
      `${tonePrefix} avance avec ce qui est clair aujourd'hui.`,
    ],
    courage: [
      `${tonePrefix} tu peux faire le prochain petit pas. C'est suffisant.`,
      `${tonePrefix} tu es plus forte que ce que tu crois.`,
      `${tonePrefix} continue. Même lentement, tu avances.`,
    ],
    creativity: [
      `${tonePrefix} fais simple : une petite idée, un petit geste, et ça repart.`,
      `${tonePrefix} crée sans juger. Tu trieras après.`,
      `${tonePrefix} commence petit. L'élan vient en faisant.`,
    ],
    night: [
      `${tonePrefix} laisse ta journée se poser. Tu peux relâcher.`,
      `${tonePrefix} calme le souffle. Le reste attendra demain.`,
      `${tonePrefix} tu peux t'endormir sans résoudre tout.`,
    ],
    mindfulness: [
      `${tonePrefix} reviens au corps : épaules, mâchoire, souffle.`,
      `${tonePrefix} une respiration lente. Puis une deuxième.`,
      `${tonePrefix} ici et maintenant, c'est suffisant.`,
    ],
    wood_guardian: [
      `${tonePrefix} ancre-toi. Comme un arbre : stable, même quand ça bouge.`,
      `${tonePrefix} tu peux te sentir protégée. Reste proche de ce qui te fait du bien.`,
      `${tonePrefix} prends racine dans ce qui est simple : souffle, présence, calme.`,
    ],
    renewal: [
      `${tonePrefix} une fin n'efface pas tout. Elle ouvre une nouvelle étape.`,
      `${tonePrefix} tu peux recommencer autrement. Sans te punir.`,
      `${tonePrefix} tourne la page doucement. Tu gardes l'essentiel.`,
    ],
    intuition: [
      `${tonePrefix} écoute la petite voix calme, pas la voix pressée.`,
      `${tonePrefix} si ça serre, c'est peut-être non. Si ça s'ouvre, avance.`,
      `${tonePrefix} fais confiance au ressenti simple.`,
    ],
    projects: [
      `${tonePrefix} clarifie le prochain pas, puis fais-le. Rien de plus.`,
      `${tonePrefix} avance en petit rythme régulier. C'est ça qui marche.`,
      `${tonePrefix} ne cherche pas parfait. Cherche fait.`,
    ],
    celebration: [
      `${tonePrefix} savoure. Tu l'as mérité.`,
      `${tonePrefix} prends le temps de célébrer, même petit.`,
      `${tonePrefix} bravo. Vraiment.`,
    ],
    calm: [
      `${tonePrefix} ralentis. Rien n'est urgent à cette seconde.`,
      `${tonePrefix} souffle. Tu peux relâcher un peu.`,
      `${tonePrefix} tu as le droit de faire une pause.`,
    ],
    connection: [
      `${tonePrefix} dis les choses simplement. Les bons mots sont les plus simples.`,
      `${tonePrefix} un message honnête vaut mieux qu'un long discours.`,
      `${tonePrefix} tu peux renouer doucement. Un pas suffit.`,
    ],
    self_confidence: [
      `${tonePrefix} tu as ta place. Même si tu doutes.`,
      `${tonePrefix} tu es capable. Ce n'est pas un hasard si tu es là.`,
      `${tonePrefix} arrête de te comparer. Reviens à ton rythme.`,
    ],
    difficulties: [
      `${tonePrefix} c'est dur, mais tu tiens. Et c'est déjà énorme.`,
      `${tonePrefix} concentre-toi sur ce que tu contrôles aujourd'hui.`,
      `${tonePrefix} demande de l'aide si tu peux. Ce n'est pas un échec.`,
    ],
    alignment: [
      `${tonePrefix} choisis ce qui te ressemble, pas ce qui te fatigue.`,
      `${tonePrefix} si ça sonne faux, tu as le droit de dire non.`,
      `${tonePrefix} reviens à tes valeurs. Elles savent.`,
    ],
    roots: [
      `${tonePrefix} souviens-toi d'où tu viens. Tu as plus de force que tu crois.`,
      `${tonePrefix} tu portes une histoire. Et tu peux en faire quelque chose de beau.`,
      `${tonePrefix} tu appartiens. Tu n'es pas seule.`,
    ],
    energy: [
      `${tonePrefix} bouge un peu, bois de l'eau, reviens dans le corps.`,
      `${tonePrefix} rallume une petite étincelle : un geste simple, maintenant.`,
      `${tonePrefix} l'élan revient en commençant petit.`,
    ],
    default: [
      `${tonePrefix} respire. Tu fais de ton mieux.`,
      `${tonePrefix} un pas à la fois.`,
      `${tonePrefix} tu peux faire simple.`,
    ],
  };

  const core = pickStable(coreMessages[intent], seed + "::" + intent);
  const close = pickStable(
    ["Respire.", "Respire. Un pas à la fois.", "Respire. Ça va passer.", "Respire. Tu peux y aller doucement."],
    seed + "::close"
  );

  const parts = [open, where, mem, core, close].filter(Boolean);
  return parts.join("\n").trim();
}

function buildEn(p: {
  prenom: string;
  lieu: string;
  souvenir: string;
  intent: Intent;
  voice: "masculin" | "feminin";
  seed: string;
}) {
  const { prenom, lieu, souvenir, intent, seed } = p;

  const open = pickStable([`${prenom},`, `${prenom}, listen.`, `${prenom}, quick reminder.`, `${prenom}, a few words.`], seed + "::open");
  const where = lieu
    ? pickStable([`Here in ${lieu}, take 10 seconds for yourself.`, `In ${lieu}, breathe for a moment.`, `Right there in ${lieu}, slow down.`], seed + "::where")
    : "";

  const mem = souvenir
    ? pickStable(
        [`Think of "${souvenir}". Keep it as your anchor.`, `"${souvenir}" — it's proof you can move forward.`, `When "${souvenir}" comes back, remember you can handle this.`],
        seed + "::souvenir"
      )
    : pickStable(["You don't have to handle everything today.", "You're allowed to keep it simple.", "You're allowed to slow down."], seed + "::nosouvenir");

  const coreMessages: Record<Intent, string[]> = {
    love: ["You matter. Truly.", "You are loved.", "You don't have to prove anything to deserve love."],
    gratitude: ["Thank you—for being you.", "What you give has value.", "You can be proud of yourself."],
    healing: ["This can feel heavy, but you're not alone.", "One step at a time is enough.", "You're allowed to be fragile—and you'll recover."],
    life_path: ["You don't need all the answers—just the next one.", "Choose what aligns you, not what pleases others.", "Move with what is clear today."],
    courage: ["Take the next small step. It's enough.", "You're stronger than you think.", "Even slowly, you're moving forward."],
    creativity: ["Start small. Momentum comes from doing.", "Create first, judge later.", "One simple idea is enough to begin."],
    night: ["Let the day settle. You can let go.", "Slow your breath—tomorrow can wait.", "You can sleep without solving everything."],
    mindfulness: ["Come back to your body: shoulders, jaw, breath.", "One slow breath. Then another.", "Right now is enough."],
    wood_guardian: ["Root yourself like a tree—steady even when it moves.", "Stay close to what truly helps you.", "Return to simple things: breath, presence, calm."],
    renewal: ["An ending can open a new step.", "You can restart differently—without punishing yourself.", "Turn the page gently. Keep what matters."],
    intuition: ["Listen to the calm voice, not the rushed one.", "If it tightens, maybe it's no. If it opens, go.", "Trust the simple feeling."],
    projects: ["Define the next step—then do it.", "Small steady rhythm wins.", "Done beats perfect."],
    celebration: ["Enjoy it—you earned it.", "Celebrate, even in small ways.", "Well done. Truly."],
    calm: ["Slow down—nothing is urgent in this second.", "Breathe—you can ease up a little.", "You're allowed to take a pause."],
    connection: ["Say it simply. Simple words land best.", "A honest short message beats a long speech.", "Reconnect gently—one step is enough."],
    self_confidence: ["You belong here, even if you doubt.", "You are capable—this isn't an accident.", "Stop comparing—come back to your pace."],
    difficulties: ["It's hard, but you're holding on—and that matters.", "Focus on what you control today.", "Asking for help isn't failure."],
    alignment: ["Choose what fits you, not what drains you.", "If it feels false, you can say no.", "Return to your values—they know."],
    roots: ["Remember where you come from—there's strength there.", "You carry a story. You can turn it into something good.", "You belong. You're not alone."],
    energy: ["Drink water, move a little, come back into your body.", "Light one small spark—right now.", "Energy comes back by starting small."],
    default: ["Breathe—you're doing your best.", "One step at a time.", "Keep it simple."],
  };

  const core = pickStable(coreMessages[intent], seed + "::" + intent);
  const close = pickStable(["Breathe.", "Breathe—one step at a time.", "Breathe—it will pass.", "Breathe—go gently."], seed + "::close");

  const parts = [open, where, mem, core, close].filter(Boolean);
  return parts.join("\n").trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prenom = clamp(body.prenom || "toi", 60);
    const theme = clamp(body.theme || "", 80);
    const sous_theme = clamp(body.sous_theme || "", 80);
    const lieu = clamp(body.lieu || "", 120);
    const souvenir = clamp(body.souvenir || "", 180);

    const langue = normalizeLang(body.langue || "fr");
    const voix = normalizeVoice(body.voix || "feminin");

    const intent = inferIntent(theme, sous_theme);
    // Add timestamp to seed so each request gets a different message
    const timestamp = Math.floor(Date.now() / 1000); // seconds
    const seed = `${langue}::${voix}::${prenom}::${theme}::${sous_theme}::${lieu}::${souvenir}::${timestamp}`;

    const text = langue === "en" ? buildEn({ prenom, lieu, souvenir, intent, voice: voix as any, seed }) : buildFr({ prenom, lieu, souvenir, intent, voice: voix as any, seed });

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur génération texte." }, { status: 500 });
  }
}
