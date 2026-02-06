import { NextResponse } from "next/server";
import crypto from "crypto";

type Body = {
  prenom?: string;
  theme?: string;
  sous_theme?: string;
  lieu?: string;
  souvenir?: string;
  langue?: "fr" | "en" | string;
  voix?: "masculin" | "feminin" | string;
};

function clean(v: any) {
  return String(v ?? "").trim();
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

type Intent =
  | "amour"
  | "gratitude"
  | "guerison"
  | "chemin_vie"
  | "courage"
  | "creativite"
  | "reves"
  | "presence"
  | "gardien_bois"
  | "cycles"
  | "intuition"
  | "projets"
  | "celebration"
  | "calme"
  | "connexion"
  | "confiance"
  | "difficultes"
  | "alignement"
  | "racines"
  | "energie"
  | "default";

function inferIntent(themeRaw: string, sousRaw: string): Intent {
  const t = keyify(themeRaw);
  const s = keyify(sousRaw);

  const byTheme: Record<string, Intent> = {
    amour: "amour",
    gratitude: "gratitude",
    guerison: "guerison",
    chemin_vie: "chemin_vie",
    courage: "courage",
    creativite: "creativite",
    reves: "reves",
    presence: "presence",
    gardien_bois: "gardien_bois",
    cycles: "cycles",
    intuition: "intuition",
    projets: "projets",
    celebration: "celebration",
    calme: "calme",
    connexion: "connexion",
    confiance: "confiance",
    difficultes: "difficultes",
    alignement: "alignement",
    racines: "racines",
    energie: "energie",
  };

  if (byTheme[t]) return byTheme[t];

  const blob = `${t}__${s}`;
  if (blob.includes("amour")) return "amour";
  if (blob.includes("gratitude")) return "gratitude";
  if (blob.includes("guerison") || blob.includes("apaisement") || blob.includes("deuil") || blob.includes("angoisse")) return "guerison";
  if (blob.includes("chemin") || blob.includes("orientation") || blob.includes("decision")) return "chemin_vie";
  if (blob.includes("courage") || blob.includes("depassement") || blob.includes("peur")) return "courage";
  if (blob.includes("creativite") || blob.includes("inspiration")) return "creativite";
  if (blob.includes("reves") || blob.includes("nuit")) return "reves";
  if (blob.includes("presence") || blob.includes("pleine_conscience")) return "presence";
  if (blob.includes("gardien") || blob.includes("bois") || blob.includes("foret")) return "gardien_bois";
  if (blob.includes("cycles") || blob.includes("renouveau")) return "cycles";
  if (blob.includes("intuition")) return "intuition";
  if (blob.includes("projets") || blob.includes("objectifs")) return "projets";
  if (blob.includes("celebration") || blob.includes("joie") || blob.includes("anniversaire")) return "celebration";
  if (blob.includes("calme") || blob.includes("serenite")) return "calme";
  if (blob.includes("connexion") || blob.includes("lien")) return "connexion";
  if (blob.includes("confiance")) return "confiance";
  if (blob.includes("difficultes")) return "difficultes";
  if (blob.includes("alignement") || blob.includes("authenticite")) return "alignement";
  if (blob.includes("racines") || blob.includes("origines") || blob.includes("famille")) return "racines";
  if (blob.includes("energie") || blob.includes("vitalite")) return "energie";

  return "default";
}

// Poetic, elegant messages for each intent (3-4 sentences max)
const messagesFr: Record<Intent, string[][]> = {
  amour: [
    ["Tu es capable de donner et de recevoir.", "L'amour n'est pas un luxe, c'est ta nature.", "Laisse-toi atteindre."],
    ["Quelque chose en toi attend d'être aimé.", "C'est d'une douceur que tu mérites.", "Ouvre-toi, doucement."],
    ["L'amour circule, il ne se retient pas.", "Tu le sais au fond de toi.", "C'est maintenant le moment."],
  ],
  gratitude: [
    ["La beauté vit dans ce que tu remarques.", "Chaque instant mérite ta présence.", "C'est là que la magie commence."],
    ["Tu portes plus que tu ne le crois.", "Ce que tu donnes revient, transformé.", "C'est suffisant. Tu es suffisant."],
    ["La reconnaissance ouvre les portes.", "Regarde ce que tu as construit.", "C'est un trésor, ce chemin."],
  ],
  guerison: [
    ["La blessure est aussi un message.", "Tu peux sentir sans te briser.", "Le temps guérit, mais c'est toi qui grandis."],
    ["Ce qui fait mal mérite attention.", "Tu n'es pas seul dans cette traversée.", "Chaque cicatrice est une force."],
    ["Guérir, c'est aussi accepter.", "La douleur a une sagesse.", "Tu vas retrouver la légèreté."],
  ],
  chemin_vie: [
    ["Le chemin se révèle en le marchant.", "Tu n'as pas besoin de tout voir pour avancer.", "Fais confiance aux pas que tu poses."],
    ["Chaque direction a quelque chose à t'enseigner.", "Tu possèdes déjà ta boussole.", "Écoute ce qui t'appelle vraiment."],
    ["La vie est un art, pas une formule.", "Tu es libre de choisir à chaque instant.", "Le chemin qui te ressemble n'attend que toi."],
  ],
  courage: [
    ["La peur est juste le signal que ça compte.", "Tu as déjà traversé l'impossible.", "Cette fois aussi, tu peux."],
    ["Un pas minuscule est encore un pas.", "La bravoure vit dans les gestes simples.", "Tu es plus forte que tes doutes."],
    ["Ce qui te fait trembler te fait aussi grandir.", "Reste debout, même si c'est lentement.", "C'est assez. C'est tout ce qu'il faut."],
  ],
  creativite: [
    ["La création n'attend pas la perfection.", "Ce qui naît en toi est déjà beau.", "Laisse ton geste parler."],
    ["L'inspiration vit dans l'action.", "Une idée imparfaite vaut mieux qu'aucune idée.", "Commence. Le reste suivra."],
    ["Tu es un canal, pas un juge.", "Fais confiance à ce qui passe par toi.", "L'art c'est l'authentique, jamais le parfait."],
  ],
  reves: [
    ["La nuit est un refuge, pas une fuite.", "Ton sommeil a besoin de douceur.", "Laisse-toi glisser vers le repos."],
    ["Les rêves savent ce que tu ne sais pas encore.", "La nuit te guérit sans que tu le fasses.", "Abandonne-toi au silence."],
    ["Le sommeil est un acte de tendresse envers toi.", "Ce qui vient la nuit mérite d'être écouté.", "Repose-toi comme tu l'as mérité."],
  ],
  presence: [
    ["Être là, c'est tout ce qui existe.", "L'instant présent ne demande rien d'autre.", "Tu es suffisant, maintenant."],
    ["La pleine conscience est un retour à soi.", "Chaque respiration t'ancre davantage.", "Tu es ici, et c'est parfait."],
    ["Revenir au moment, c'est revenir à la vie.", "L'ici et maintenant te contient entièrement.", "Sois simplement présent."],
  ],
  gardien_bois: [
    ["Les arbres savent rester debout dans la tempête.", "Tu peux trouver ta stabilité en toi.", "Plonge tes racines plus profond."],
    ["La forêt ne juge pas, elle accueille.", "La nature t'enseigne la patience.", "Tu as la force silencieuse des bois."],
    ["Ce qui grandit lentement grandit fort.", "Tu peux être ancré tout en bougeant.", "La terre te soutient toujours."],
  ],
  cycles: [
    ["Chaque fin est aussi un commencement.", "Tu es capable de renaître.", "Ce cycle t'appartient."],
    ["Ce qui se termine fait place à l'nouveau.", "Tu ne perds rien, tu te transformes.", "La continuité vit dans le changement."],
    ["Les cycles sont ta sagesse naturelle.", "Tu sais comment recommencer.", "L'hiver prépare toujours le printemps."],
  ],
  intuition: [
    ["Ton instinct sait ce que la raison ignore.", "Écoute la voix calme en toi.", "Elle ne te trompe jamais vraiment."],
    ["Le cœur parle dans le silence.", "Tu reconnais la vérité quand tu la sens.", "Fais confiance à ton premier mouvement."],
    ["L'intuition est la sagesse du corps.", "Ce qui sait, sait sans explication.", "Tu peux sentir le chemin."],
  ],
  projets: [
    ["Un projet commence par un petit pas.", "Chaque jour t'en rapproche.", "Tu avances plus que tu ne le crois."],
    ["La régularité crée le miracle.", "Ce qui semble loin devient proche.", "Persévère dans la simplicité."],
    ["Tu construis un futur à chaque instant.", "Les petites actions deviennent des empires.", "Tes mains créent vraiment."],
  ],
  celebration: [
    ["Ce moment mérite d'être savouré.", "Tu as accomplí quelque chose d'important.", "Célèbre-toi simplement, vraiment."],
    ["La joie a besoin de toi pour exister.", "Accueille ce succès sans culpabilité.", "Tu en as plus que mérité."],
    ["Chaque victoire, même mineure, compte.", "Tu le savais en toi depuis le début.", "C'est le moment de briller."],
  ],
  calme: [
    ["Le silence est une forme de sagesse.", "Tu peux lâcher prise sans danger.", "La paix vit en toi, attends-la."],
    ["Ralentir n'est pas reculer.", "Dans le calme naît la clarté.", "Tu as le droit de prendre du temps."],
    ["La sérénité n'est pas l'absence de tempête.", "C'est ta réaction qui crée la paix.", "Respire. Le reste attendra."],
  ],
  connexion: [
    ["Les liens vrais survivent à tout.", "Tu peux te montrer, vraiment.", "Quelqu'un t'écoute vraiment."],
    ["La vulnérabilité crée la connexion.", "Parler ta vérité change tout.", "Tu es entendu, tu es vu."],
    ["Les cœurs qui se parlent se comprennent.", "L'authenticité attire l'authenticité.", "Tend la main, elle sera prise."],
  ],
  confiance: [
    ["Tu as déjà prouvé ta force.", "Crois en ce que tu sais de toi.", "Tu as le droit de prendre ta place."],
    ["La confiance grandit en osant.", "Tu es bien plus que tes doutes.", "Sois fière de ce que tu es."],
    ["Tu appartiens à cet espace, à ce moment.", "Rien ne peut t'enlever ta valeur.", "Tu es exactement où tu dois être."],
  ],
  difficultes: [
    ["La difficulté t'enseigne ta force.", "Tu peux traverser sans te perdre.", "C'est une saison, pas une condamnation."],
    ["Ce qui est dur forge le diamant.", "Tu tiens bon, et c'est déjà tout.", "L'aide existe, tu peux la chercher."],
    ["Les difficultés ne sont pas des défaites.", "Tu peux rester debout ou tomber, tu te relèves.", "Chaque jour est une victoire."],
  ],
  alignement: [
    ["Être authentique est un choix courageux.", "Tu peux dire non sans te justifier.", "Ce qui te sied te rend belle."],
    ["L'alignement est une forme de liberté.", "Tu sais quoi rejeter et quoi garder.", "Vis selon ta vérité intérieure."],
    ["La cohérence crée la paix.", "Tu n'es pas obligée de plaire à tous.", "Sois fidèle à ce qui t'appelle."],
  ],
  racines: [
    ["Ton héritage te rend plus forte.", "Tu portes la sagesse de ceux qui t'ont précédée.", "D'où tu viens te donne des ailes."],
    ["Les racines ne sont pas des chaînes.", "Elles te nourrissent, tu peux voler.", "Tu honores ton passé en te créant."],
    ["Tu es le fruit d'une longue histoire.", "C'est une force, pas un poids.", "Tu es libre, tu viens de quelque part."],
  ],
  energie: [
    ["L'énergie se réveille en bougeant.", "Un geste infime commence le mouvement.", "Tu as plus de force qu'il n'y paraît."],
    ["Le repos nourrit l'élan.", "Tu peux créer sans t'épuiser.", "L'énergie circule en toi, elle n'a jamais quitté."],
    ["Réveille-toi doucement, sans hâte.", "Ton corps sait ce dont il a besoin.", "L'étincelle vit toujours en toi."],
  ],
  default: [
    ["Tu es exactement là où il faut être.", "Le temps t'apportera les réponses.", "Fais simplement le prochain pas."],
    ["La vie est une conversation avec toi-même.", "Tu sais plus que tu ne le crois.", "Continue, tu vas trouver."],
    ["Tu as tout ce qu'il faut pour continuer.", "Chaque jour te rend plus sage.", "Tu es sur le bon chemin."],
  ],
};

const messagesEn: Record<Intent, string[][]> = {
  amour: [
    ["You're capable of giving and receiving.", "Love isn't a luxury, it's your nature.", "Let yourself be touched."],
    ["Something in you waits to be loved.", "It's a gentleness you deserve.", "Open yourself, slowly."],
    ["Love flows, it doesn't hold back.", "You know this deep inside.", "Now is the moment."],
  ],
  gratitude: [
    ["Beauty lives in what you notice.", "Every moment deserves your presence.", "That's where magic begins."],
    ["You carry more than you believe.", "What you give comes back, transformed.", "It's enough. You are enough."],
    ["Recognition opens doors.", "Look at what you've built.", "It's a treasure, this path."],
  ],
  guerison: [
    ["The wound is also a message.", "You can feel without breaking.", "Time heals, but you grow."],
    ["What hurts deserves attention.", "You're not alone in this crossing.", "Every scar is a strength."],
    ["Healing is also accepting.", "Pain has its own wisdom.", "You'll find lightness again."],
  ],
  chemin_vie: [
    ["The path reveals itself as you walk it.", "You don't need to see everything to move forward.", "Trust the steps you take."],
    ["Every direction has something to teach you.", "You already have your compass.", "Listen to what truly calls you."],
    ["Life is an art, not a formula.", "You're free to choose at every moment.", "The path that fits you waits only for you."],
  ],
  courage: [
    ["Fear is just the signal that it matters.", "You've already crossed the impossible.", "This time too, you can."],
    ["A tiny step is still a step.", "Bravery lives in simple gestures.", "You're stronger than your doubts."],
    ["What makes you tremble also makes you grow.", "Stay standing, even if it's slowly.", "It's enough. It's all it takes."],
  ],
  creativite: [
    ["Creation doesn't wait for perfection.", "What's born in you is already beautiful.", "Let your gesture speak."],
    ["Inspiration lives in action.", "An imperfect idea beats no idea.", "Begin. The rest will follow."],
    ["You're a channel, not a judge.", "Trust what flows through you.", "Art is authentic, never perfect."],
  ],
  reves: [
    ["Night is a refuge, not an escape.", "Your sleep needs gentleness.", "Let yourself slip toward rest."],
    ["Dreams know what you don't yet.", "Night heals you without your doing.", "Abandon yourself to silence."],
    ["Sleep is an act of kindness toward yourself.", "What comes at night deserves to be heard.", "Rest as you've deserved."],
  ],
  presence: [
    ["Being here is all that exists.", "The present moment asks nothing else.", "You're enough, now."],
    ["Mindfulness is a return to yourself.", "Every breath anchors you more.", "You're here, and it's perfect."],
    ["Coming back to the moment is coming back to life.", "The here and now contains you entirely.", "Simply be present."],
  ],
  gardien_bois: [
    ["Trees know how to stand in storms.", "You can find your stability within.", "Deepen your roots more."],
    ["The forest doesn't judge, it welcomes.", "Nature teaches you patience.", "You have the silent strength of the woods."],
    ["What grows slowly grows strong.", "You can be rooted while moving.", "The earth always supports you."],
  ],
  cycles: [
    ["Every ending is also a beginning.", "You're capable of rebirth.", "This cycle is yours."],
    ["What ends makes room for the new.", "You don't lose anything, you transform.", "Continuity lives in change."],
    ["Cycles are your natural wisdom.", "You know how to begin again.", "Winter always prepares spring."],
  ],
  intuition: [
    ["Your instinct knows what reason ignores.", "Listen to the quiet voice in you.", "It never truly deceives you."],
    ["The heart speaks in silence.", "You recognize truth when you feel it.", "Trust your first impulse."],
    ["Intuition is the body's wisdom.", "What knows, knows without explanation.", "You can feel the way."],
  ],
  projets: [
    ["A project begins with one small step.", "Every day brings you closer.", "You're advancing more than you think."],
    ["Consistency creates miracles.", "What seems far becomes near.", "Persevere in simplicity."],
    ["You're building a future every moment.", "Small actions become empires.", "Your hands truly create."],
  ],
  celebration: [
    ["This moment deserves to be savored.", "You've accomplished something important.", "Celebrate yourself simply, truly."],
    ["Joy needs you to exist.", "Welcome this success without guilt.", "You've earned far more than this."],
    ["Every victory, even small, counts.", "You knew it in yourself from the start.", "It's time to shine."],
  ],
  calme: [
    ["Silence is a form of wisdom.", "You can let go without danger.", "Peace lives in you, await it."],
    ["Slowing down isn't going back.", "In calm is born clarity.", "You have the right to take time."],
    ["Serenity isn't the absence of storms.", "It's your reaction that creates peace.", "Breathe. The rest can wait."],
  ],
  connexion: [
    ["True bonds survive everything.", "You can show yourself, truly.", "Someone listens to you truly."],
    ["Vulnerability creates connection.", "Speaking your truth changes everything.", "You're heard, you're seen."],
    ["Hearts that speak understand each other.", "Authenticity attracts authenticity.", "Reach out, your hand will be taken."],
  ],
  confiance: [
    ["You've already proven your strength.", "Believe in what you know about yourself.", "You have the right to take your place."],
    ["Confidence grows by daring.", "You're far more than your doubts.", "Be proud of who you are."],
    ["You belong in this space, at this moment.", "Nothing can take away your value.", "You're exactly where you need to be."],
  ],
  difficultes: [
    ["Difficulty teaches you your strength.", "You can cross without losing yourself.", "It's a season, not a verdict."],
    ["What's hard forges the diamond.", "You're holding on, and that's everything.", "Help exists, you can seek it."],
    ["Difficulties aren't defeats.", "You can fall, you rise again.", "Every day is a victory."],
  ],
  alignement: [
    ["Being authentic is a courageous choice.", "You can say no without justifying.", "What suits you makes you beautiful."],
    ["Alignment is a form of freedom.", "You know what to reject and what to keep.", "Live by your inner truth."],
    ["Consistency creates peace.", "You're not obligated to please everyone.", "Stay true to what calls you."],
  ],
  racines: [
    ["Your heritage makes you stronger.", "You carry the wisdom of those before you.", "Where you come from gives you wings."],
    ["Roots aren't chains.", "They nourish you, you can fly.", "You honor your past by creating yourself."],
    ["You're the fruit of a long story.", "It's a strength, not a burden.", "You're free, you come from somewhere."],
  ],
  energie: [
    ["Energy wakes up through movement.", "One tiny gesture begins momentum.", "You have more strength than appears."],
    ["Rest nourishes momentum.", "You can create without exhausting yourself.", "Energy flows through you, it never left."],
    ["Wake up slowly, without rush.", "Your body knows what it needs.", "The spark still lives in you."],
  ],
  default: [
    ["You're exactly where you need to be.", "Time will bring you answers.", "Just take the next step."],
    ["Life is a conversation with yourself.", "You know more than you think.", "Keep going, you'll find it."],
    ["You have everything you need to continue.", "Every day makes you wiser.", "You're on the right path."],
  ],
};

function buildFr(p: { prenom: string; intent: Intent; seed: string }) {
  const { prenom, intent, seed } = p;
  const messages = messagesFr[intent] || messagesFr.default;
  const chosen = pickStable(messages, seed);
  const opening = prenom + ",";
  return opening + " " + chosen.join(" ");
}

function buildEn(p: { prenom: string; intent: Intent; seed: string }) {
  const { prenom, intent, seed } = p;
  const messages = messagesEn[intent] || messagesEn.default;
  const chosen = pickStable(messages, seed);
  const opening = prenom + ",";
  return opening + " " + chosen.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prenom = clean(body.prenom) || "toi";
    const theme = clean(body.theme) || "";
    const sous_theme = clean(body.sous_theme) || "";

    const langue = normalizeLang(body.langue || "fr");
    const voix = normalizeVoice(body.voix || "feminin");

    const intent = inferIntent(theme, sous_theme);

    // Seed includes timestamp so messages vary on each call
    const timestamp = Math.floor(Date.now() / 1000);
    const seed = `${intent}::${prenom}::${timestamp}`;

    const text = langue === "en" ? buildEn({ prenom, intent, seed }) : buildFr({ prenom, intent, seed });

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur génération texte." }, { status: 500 });
  }
}
