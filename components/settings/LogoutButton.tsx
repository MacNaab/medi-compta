// @components/settings/LogoutButton.tsx
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Redirection vers la page d'accueil après déconnexion
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Déconnexion</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Vous souhaitez vous déconnecter de votre compte ?
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
