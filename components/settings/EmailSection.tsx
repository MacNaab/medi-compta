// app/settings/components/EmailSection.tsx
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmailSectionProps {
  currentEmail: string;
  userId: string;
}

export function EmailSection({ currentEmail }: EmailSectionProps) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Email de confirmation envoyé. Vérifiez votre nouvelle adresse email.",
      });
      setNewEmail("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erreur lors du changement d'email",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Changer l&apos;adresse email
        </h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Email actuel : <span className="font-medium">{currentEmail}</span>
          </p>
        </div>

        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div>
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nouvel email
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="nouveau@exemple.com"
              required
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
              disabled={loading || !newEmail}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Envoi en cours..." : "Changer l'email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
