"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/generate" className="font-semibold tracking-tight text-foreground">
          LetterCraft
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            className={`rounded-full px-3 py-2 transition hover:bg-accent ${
              pathname === "/generate" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
            href="/generate"
          >
            Generate
          </Link>
          <Link
            className={`rounded-full px-3 py-2 transition hover:bg-accent ${
              pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
            href="/dashboard"
          >
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
