import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/server/site";
import { Bodoni_Moda, Inter } from "next/font/google";
import "./globals.css";


const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Sea Seakers",
};

export const viewport: Viewport = {
  themeColor: "#0b1a2b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${inter.variable}`}>
      <head>
        {/* On the home page: runs before the browser restores the old scroll position, so reloads open at the hero */}
        <script dangerouslySetInnerHTML={{ __html: "if(location.pathname==='/')history.scrollRestoration='manual'" }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
