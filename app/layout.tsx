// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/navbar";

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
          <NavBar />
          {/* Contenu principal */}
          <main className="py-8">{children}</main>
<<<<<<< Updated upstream
        </div>
=======
        </main>
        <Toaster position="top-center" richColors />
>>>>>>> Stashed changes
      </body>
    </html>
  );
}
