import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ClientToaster } from "@/components/layout/client-toaster";

const fontSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const themeBootstrapScript = `
(() => {
  try {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const savedTheme = localStorage.getItem(storageKey);
    const theme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {
    const theme =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }
})();`;

export const metadata: Metadata = {
  title: "LetterCraft",
  description: "AI cover letter generator with streaming, dashboard, and secure storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}>
        <script 
          id="theme-bootstrap" 
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <ClientToaster />
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
