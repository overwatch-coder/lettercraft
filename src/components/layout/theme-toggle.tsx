"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { applyTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const domTheme: Theme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      setTheme(domTheme);
    }
  }, []);

  if (theme === null) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/60 opacity-70"
        aria-label="Loading theme"
        title="Loading theme"
      >
        <span className="sr-only">Loading theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        setTheme((current) => {
          const nextTheme: Theme = current === "dark" ? "light" : "dark";
          applyTheme(nextTheme);
          return nextTheme;
        })
      }
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}
