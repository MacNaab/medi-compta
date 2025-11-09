/* eslint-disable @typescript-eslint/no-explicit-any */
// components/reset-password/ResetPasswordForm.tsx
"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const params = use(searchParams);

  useEffect(() => {
    const emailParam = params.q;
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [params]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Le mot de passe doit contenir au moins 6 caractères",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Mot de passe mis à jour avec succès ! Redirection...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text:
          err.message || "Erreur lors de la réinitialisation du mot de passe",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-600 mt-2">
            {email ? `Pour ${email}` : "Choisissez votre nouveau mot de passe"}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirmez votre mot de passe"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
