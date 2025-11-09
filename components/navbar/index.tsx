/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const pages = [
  { name: "Lieux d'exercice", href: "/lieux" },
  { name: "Saisie quotidienne", href: "/saisie" },
  { name: "Virements", href: "/virements" },
  { name: "Rapports", href: "/rapports" },
  { name: "Sauvegarde", href: "/sauvegarde" },
];

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  // Surveiller les changements d'authentification
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Écouter les changements d'authentification en temps réel
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // Forcer le rafraîchissement du routeur pour mettre à jour les pages
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const PageLinks = pages.map((page) => (
    <Link
      key={"PageLinks_" + page.name}
      href={page.href}
      className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
    >
      {page.name}
    </Link>
  ));

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800">MediCompta</h1>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {PageLinks}
            {user ? (
              <Link
                href="/settings"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
              >
                Paramètres
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              {PageLinks}
              {user ? (
                <Link
                  href="/settings"
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Paramètres
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
