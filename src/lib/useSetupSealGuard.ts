"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GuardMode = "murmures" | "recorded";

type SetupStatusResponse = {
  success?: boolean;
  data?: {
    type_bijou?: string | null;
  };
};

export function useSetupSealGuard(id: string | undefined, mode: GuardMode) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    async function checkSealStatus() {
      try {
        const res = await fetch(`/api/setup/${id}/firstname`, {
          method: "GET",
          cache: "no-store",
        });

        const json = (await res.json().catch(() => ({}))) as SetupStatusResponse;
        const type = String(json?.data?.type_bijou ?? "");

        if (mode === "murmures" && type === "voix_enregistree") {
          router.replace(`/setup/${id}/mode-scelle?mode=murmures`);
          return;
        }

        if (mode === "murmures" && type === "murmures_IA") {
          router.replace(`/setup/${id}/mode-scelle?mode=murmures&reason=already`);
          return;
        }

        if (mode === "recorded" && type === "murmures_IA") {
          router.replace(`/setup/${id}/mode-scelle?mode=recorded`);
          return;
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    void checkSealStatus();

    return () => {
      cancelled = true;
    };
  }, [id, mode, router]);

  return isChecking;
}
