"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LuxeDropdownOption = {
  value: string;
  label: string;
  hint?: string; // petit texte en dessous dans la liste
};

export type LuxeDropdownProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: LuxeDropdownOption[];
  disabled?: boolean;
  hint?: string; // hint à droite du label (en haut)
  displayValue?: string;
  placeholder?: string;
};

export function LuxeDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
  hint,
  displayValue,
  placeholder,
}: LuxeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const shown = displayValue ?? selectedOption?.label ?? placeholder ?? "Sélection";

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const menuOpen = open && !disabled;

  const handleToggle = () => {
    if (!disabled) setOpen((prev) => !prev);
  };

  const handleSelect = (nextValue: string) => {
    if (nextValue !== value) onChange(nextValue);
    setOpen(false);
  };

  return (
    <label style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>{label}</span>
        {hint ? <span style={{ fontSize: 12, opacity: 0.65 }}>{hint}</span> : null}
      </div>

      <div
        ref={containerRef}
        style={{
          border: "1.5px solid rgba(120, 78, 45, 0.42)",
          borderRadius: 22,
          padding: 18,
          background: disabled
            ? "rgba(0,0,0,0.02)"
            : "linear-gradient(135deg, rgba(245, 235, 220, 0.95) 0%, rgba(210, 174, 132, 0.92) 45%, rgba(160, 112, 78, 0.9) 100%)",
          boxShadow: disabled
            ? "none"
            : "0 20px 50px rgba(59, 38, 21, 0.26), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 8px rgba(110, 70, 40, 0.3)",
          position: "relative",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: menuOpen ? 40 : 1,
          transition: "transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 250ms ease, border-color 250ms ease",
          transform: "translateY(0)",
        }}
        onMouseEnter={(event) => {
          if (disabled) return;
          event.currentTarget.style.transform = "translateY(-2px)";
          event.currentTarget.style.boxShadow =
            "0 26px 60px rgba(59, 38, 21, 0.32), inset 0 1px 1px rgba(255,255,255,0.65), inset 0 -1px 10px rgba(110, 70, 40, 0.34)";
          event.currentTarget.style.borderColor = "rgba(120, 78, 45, 0.6)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "translateY(0)";
          event.currentTarget.style.boxShadow = disabled
            ? "none"
            : "0 20px 50px rgba(59, 38, 21, 0.26), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 8px rgba(110, 70, 40, 0.3)";
          event.currentTarget.style.borderColor = "rgba(120, 78, 45, 0.42)";
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 22,
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0) 60%)",
            pointerEvents: "none",
            mixBlendMode: "screen",
            transition: "opacity 250ms ease",
            opacity: menuOpen ? 1 : 0.82,
          }}
        />
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleToggle();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!open && !disabled) setOpen(true);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 16,
            padding: 0,
            fontWeight: 750,
            color: value ? "rgba(36, 22, 12, 0.96)" : "rgba(54, 38, 26, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: disabled ? "not-allowed" : "pointer",
            position: "relative",
            zIndex: 1,
            transition: "transform 180ms ease, color 200ms ease",
          }}
        >
          <span>{shown}</span>
          <span style={{ opacity: disabled ? 0.35 : 0.6, fontSize: 14 }} aria-hidden>
            ▾
          </span>
        </button>

        {menuOpen ? (
          <div
            role="listbox"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 10px)",
              background: "linear-gradient(180deg, rgba(255,248,240,0.98) 0%, rgba(240,223,200,0.98) 100%)",
              borderRadius: 16,
              border: "1px solid rgba(110, 70, 40, 0.25)",
              boxShadow: "0 28px 80px rgba(59, 38, 21, 0.36)",
              padding: 6,
              zIndex: 100,
              maxHeight: 280,
              overflowY: "auto",
              transform: "translateY(0) scale(1)",
              opacity: 1,
              transition: "transform 180ms ease, opacity 180ms ease",
            }}
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(option.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background: active
                      ? "linear-gradient(120deg, rgba(255,255,255,0.7), rgba(210,174,132,0.35))"
                      : "transparent",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 14,
                    cursor: "pointer",
                    display: "grid",
                    gap: 4,
                    transition: "background 120ms ease",
                    color: "rgba(36, 22, 12, 0.96)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget.style.background = active
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(0,0,0,0.03)");
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget.style.background = active
                      ? "rgba(0,0,0,0.05)"
                      : "transparent");
                  }}
                >
                  <span style={{ fontWeight: 750, fontSize: 14 }}>{option.label}</span>
                  {option.hint ? (
                    <span style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.35 }}>
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: 12, height: 1, background: "rgba(0,0,0,0.06)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Sélection</span>
          <span style={{ fontSize: 12, fontWeight: 750, opacity: 0.75 }}>{shown}</span>
        </div>
      </div>
    </label>
  );
}