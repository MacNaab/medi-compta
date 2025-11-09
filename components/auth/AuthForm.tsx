// components/auth/AuthForm.tsx
import { useEffect, useState } from "react";
import { AuthView } from "./AuthContainer";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/input-password";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCloud } from "@/hooks/useCloud";
import { toast } from "sonner";
import { Lieu } from "@/types/lieu";
import { Journee } from "@/types/journee";
import { Virement } from "@/types/virement";
import { useLieux } from "@/hooks/useLieux";
import { useJournees } from "@/hooks/useJournees";
import { useVirements } from "@/hooks/useVirements";

interface AuthFormProps {
  view: "signin" | "signup";
  onViewChange: (view: AuthView) => void;
}

export function AuthForm({ view, onViewChange }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const { importLieux } = useLieux();
  const { journees, importJournees } = useJournees();
  const { importVirements } = useVirements(journees);
  const { cloudToDonnees } = useCloud();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // récupéréer le parametre de l'url error
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      setError(error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Redirection vers le settings après inscription réussie
          router.push("/settings");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          if (checked) {
            await handleImportCloud();
          }
          router.push("/settings");
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleImportCloud = () => {
    const importPromise = async (): Promise<{
      lieuxCount: number;
      journeesCount: number;
      virementsCount: number;
      totalItems: number;
    }> => {
      try {
        const donnees = await cloudToDonnees();

        const lieuxImportes: Lieu[] = donnees?.lieux || [];
        const journeesImportees: Journee[] = donnees?.journees || [];
        const virementsImportes: Virement[] = donnees?.virements || [];

        // Validation des données avant import
        if (
          lieuxImportes.length === 0 &&
          journeesImportees.length === 0 &&
          virementsImportes.length === 0
        ) {
          throw new Error("Aucune donnée à importer");
        }

        await importLieux(lieuxImportes);
        await importJournees(journeesImportees);
        await importVirements(virementsImportes);

        return {
          lieuxCount: lieuxImportes.length,
          journeesCount: journeesImportees.length,
          virementsCount: virementsImportes.length,
          totalItems:
            lieuxImportes.length +
            journeesImportees.length +
            virementsImportes.length,
        };
      } catch (error) {
        console.error("Erreur détaillée import:", error);
        throw error; // Important : propager l'erreur pour toast.promise
      }
    };

    toast.promise(importPromise(), {
      loading: "📤 Importation en cours...",
      success: (data) => {
        if (data.totalItems === 0) {
          return "Aucune donnée à importer";
        }
        return `${data.lieuxCount} lieu(x), ${data.journeesCount} journée(s) et ${data.virementsCount} virement(s) importés avec succès`;
      },
      error: (error: Error) => {
        if (error.message.includes("Aucune donnée")) {
          return error.message;
        }
        return `Échec de l'import : ${error.message}`;
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {view === "signup" && (
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nom complet
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mot de passe
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          minLength={6}
        />
      </div>

      {view === "signin" && (
        <>
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms-2"
              checked={checked}
              onClick={() => setChecked(!checked)}
            />
            <div className="grid gap-2">
              <Label htmlFor="terms-2" className="cursor-pointer">
                Importer les données à la connexion
              </Label>
              <p className="text-muted-foreground text-xs">
                En cochant cette case, vous remplacez vos données locales par
                les données du cloud lors de la connexion.
              </p>
              <p className="text-muted-foreground text-xs">
                Vous pouvez synchroniser vos données locales vers votre cloud
                sur la page de paramètrage de votre compte.
              </p>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => onViewChange("forgot-password")}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? "Chargement..."
          : view === "signin"
          ? "Se connecter"
          : "Créer un compte"}
      </button>
    </form>
  );
}
