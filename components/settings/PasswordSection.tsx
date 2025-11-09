// app/settings/components/PasswordSection.tsx
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas",
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Le mot de passe doit contenir au moins 6 caractères",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Mot de passe mis à jour avec succès",
      });
      setNewPassword("");
      setConfirmPassword("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erreur lors du changement de mot de passe",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Changer le mot de passe
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirmer le nouveau mot de passe"
            />
          </div>

          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
