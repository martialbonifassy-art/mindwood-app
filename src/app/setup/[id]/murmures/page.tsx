"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSetupSealGuard } from "@/lib/useSetupSealGuard";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isGuardChecking = useSetupSealGuard(id, "murmures");

  if (isGuardChecking) {
    return (
      <main className="min-h-screen bg-[#120d0a] text-stone-100">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
          Preparation...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d0a] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-amber-200/15 bg-[rgba(28,18,12,0.78)] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">MURMURES IA</p>
          <h1 className="mt-6 text-4xl leading-[1.14] text-stone-100 md:text-6xl">
            Façonnez une intention intime.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-stone-300 md:text-lg">
            Vous allez préparer le murmure, puis le sceller dans le bijou pour qu&apos;il soit découvert plus tard.
          </p>

          <div className="mt-14 flex justify-center">
            <Link
              href={`/setup/${id}/murmures/identite`}
              className="inline-flex items-center justify-center rounded-full border border-amber-200/20 bg-amber-100 px-7 py-3 text-sm uppercase tracking-[0.22em] text-stone-950 transition hover:bg-amber-50"
            >
              Commencer le rituel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
