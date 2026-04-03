"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id;
  const mode = searchParams.get("mode");
  const reason = searchParams.get("reason");

  const blockedMurmures = mode === "murmures";
  const alreadySealedSameMode = blockedMurmures && reason === "already";

  const title = alreadySealedSameMode
    ? "Bijou déjà scellé"
    : blockedMurmures
    ? "Murmures IA n'est plus disponible"
    : "Voix enregistrée n'est plus disponible";

  const description = alreadySealedSameMode
    ? "Ce bijou est déjà scellé en Murmures IA. Le parcours Murmures IA ne peut pas être relancé."
    : blockedMurmures
    ? "Ce bijou est déjà scellé en voix enregistrée. Le choix est définitif: Murmures IA est fermé pour ce bijou."
    : "Ce bijou est déjà scellé en Murmures IA. Le choix est définitif: la voix enregistrée est fermée pour ce bijou.";

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">MODE DÉJÀ SCELLÉ</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-6xl">{title}</h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-stone-300 md:text-lg">
            {description}
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-100"
              onClick={() => router.push(`/listen/${id}`)}
            >
              Retour au choix
            </button>
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"
              onClick={() => {
                try {
                  window.close();
                  window.setTimeout(() => {
                    if (!window.closed) {
                      window.location.href = "about:blank";
                    }
                  }, 120);
                } catch {
                  window.location.href = "about:blank";
                }
              }}
            >
              Fermer la fenêtre
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
