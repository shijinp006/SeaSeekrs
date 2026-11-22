import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "SeaSeekers — Private Yacht Charters",
  description:
    "Every horizon, privately yours. Crewed luxury yacht charters across the Mediterranean, the Caribbean and the Indian Ocean.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a2b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${inter.variable}`}>
      <head>
        {/* Runs before the browser restores the old scroll position, so reloads open at the hero */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual'" }} />
      </head>
      <body suppressHydrationWarning>
        <Header />
        {children}
      </body>
    </html>
  );
}
