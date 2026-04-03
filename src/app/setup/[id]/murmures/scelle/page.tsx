"use client";

import { useParams } from "next/navigation";

export default function Page() {
  useParams<{ id: string }>();

  function closeWindow() {
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
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">MURMURES IA · CONFIRMATION</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-6xl">Le murmure est désormais scellé.</h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            Le bijou porte maintenant ce murmure. Il sera découvert plus tard, avec 10 écoutes initiales, sur un simple scan du bijou.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-full border border-amber-200/20 bg-amber-100 px-6 py-3 text-sm uppercase tracking-[0.22em] text-stone-950"
              onClick={closeWindow}
            >
              Fermer la fenêtre
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
