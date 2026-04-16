"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { applyTheme, getInitialTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    setTheme(initialTheme);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:w-auto md:gap-2 md:px-3"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="sr-only md:not-sr-only md:text-sm md:font-medium">{theme === "dark" ? "Light" : "Dark"} mode</span>
    </button>
  );
}
