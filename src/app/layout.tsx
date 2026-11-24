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
  title: "Best Yacht Rental in Dubai — Sea Seakers Leisure Yachts & Boats Rental",
  description:
    "Welcome to Sea Seakers, where luxury meets affordability on Dubai's waters. Explore the stunning coastline and iconic landmarks in style.",
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
