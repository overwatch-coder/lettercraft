import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { Toaster } from "react-hot-toast";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
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
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
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
      <body className={`${inter.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <Toaster position="top-right" />
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
