"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LuxeOption = {
  value: string;
  label: string;
  description?: string;
};

function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    function listener(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function LuxeDropdown({
  label,
  hint,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Sélectionner…",
  searchable = true,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: LuxeOption[];
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useOnClickOutside(rootRef, () => {
    setOpen(false);
    setQ("");
  });

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    if (!searchable) return options;
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.label.toLowerCase().includes(s));
  }, [options, q, searchable]);

  const closeMenu = () => {
    setOpen(false);
    setQ("");
  };

  function choose(v: string) {
    onChange(v);
    closeMenu();
  }

  return (
    <div ref={rootRef} style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>{label}</span>
        {hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{hint}</span> : null}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => {
            const nextOpen = !v;
            if (!nextOpen) {
              setQ("");
            }
            return nextOpen;
          });
        }}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 14px",
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.10)",
          background: disabled ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.92)",
          boxShadow: disabled ? "none" : "0 16px 45px rgba(0,0,0,0.10)",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 2 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 750,
                color: selected ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.45)",
              }}
            >
              {selected?.label ?? placeholder}
            </span>
            {selected?.description ? (
              <span style={{ fontSize: 12, opacity: 0.65 }}>{selected.description}</span>
            ) : (
              <span style={{ fontSize: 12, opacity: 0.55 }}>
                {selected ? "Sélection confirmée" : "Touchez pour choisir"}
              </span>
            )}
          </div>

          <span style={{ opacity: disabled ? 0.35 : 0.6, fontSize: 14 }}>▾</span>
        </div>
      </button>

      {open ? (
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 18,
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}
        >
          {searchable ? (
            <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                autoFocus
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.10)",
                  outline: "none",
                }}
              />
            </div>
          ) : null}

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, opacity: 0.7 }}>Aucun résultat.</div>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => choose(o.value)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 14,
                      border: "none",
                      background: active ? "rgba(0,0,0,0.04)" : "transparent",
                      cursor: "pointer",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontWeight: 750 }}>{o.label}</span>
                    {o.description ? (
                      <span style={{ fontSize: 12, opacity: 0.65 }}>{o.description}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}