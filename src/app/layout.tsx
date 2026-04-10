import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Æquo — Valuación de Propiedades Comerciales con IA",
  description:
    "Plataforma inteligente de valuación de propiedades comerciales. Análisis de mercado, comparables y valoraciones impulsadas por inteligencia artificial.",
  keywords: [
    "Æquo",
    "valuación",
    "propiedades comerciales",
    "real estate",
    "IA",
    "análisis de mercado",
  ],
  authors: [{ name: "Æquo" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Æquo — Valuación de Propiedades Comerciales con IA",
    description: "Plataforma inteligente de valuación de propiedades comerciales.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
