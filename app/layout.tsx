// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
        <div className="min-h-screen bg-slate-50">
          {/* Header de navigation */}
          <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-800">
                    MediCompta
                  </h1>
                </div>

                <nav className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href="/lieux"
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Lieux de travail
                  </Link>
                  <Link
                    href="/saisie"
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Saisie quotidienne
                  </Link>
                  <Link
                    href="/rapports"
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Rapports
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Contenu principal */}
          <main className="py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
