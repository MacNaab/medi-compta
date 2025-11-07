// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediCompta - Suivi Honoraires Médecin",
  description: "Application de suivi des honoraires pour médecins remplaçants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <main className="min-h-screen bg-slate-50">
          {/* Header de navigation */}
          <NavBar />
          {/* Contenu principal */}
          <main className="py-8">{children}</main>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
