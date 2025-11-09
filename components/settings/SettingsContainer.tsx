// @/components/settings/SettingsContainer.tsx
"use client";

import { User } from "@supabase/supabase-js";
import { EmailSection } from "./EmailSection";
import { PasswordSection } from "./PasswordSection";
import { ProfileSection } from "./ProfileSection";
import { LogoutButton } from "./LogoutButton";
import { Lieu } from "@/types/lieu";
import { Journee } from "@/types/journee";
import { Virement } from "@/types/virement";
import { useLieux } from "@/hooks/useLieux";
import { useJournees } from "@/hooks/useJournees";
import { useVirements } from "@/hooks/useVirements";
import { toast } from "sonner";
import { useCloud } from "@/hooks/useCloud";
import { useEffect, useState } from "react";

interface Profile {
  full_name: string | null;
}

interface SettingsContainerProps {
  user: User;
  profile: Profile | null;
}

export function SettingsContainer({ user, profile }: SettingsContainerProps) {
  const { lieux, importLieux } = useLieux();
  const { journees, importJournees } = useJournees();
  const { virements, importVirements } = useVirements(journees);
  const { synchroniserDonnees, cloudToDonnees } = useCloud();

  const [donnees, setDonnees] = useState<{
    lieux: Lieu[];
    journees: Journee[];
    virements: Virement[];
  } | null>(null);

  useEffect(() => {
    const fetchDonnees = async () => {
      const donnees = await cloudToDonnees();
      setDonnees(donnees);
    };
    fetchDonnees();
  }, [cloudToDonnees]);

  const handleImport = () => {
    const importPromise = async (): Promise<{
      lieuxCount: number;
      journeesCount: number;
      virementsCount: number;
      totalItems: number;
    }> => {
      try {
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
  
  const handleSynchronize = () => {
    const syncPromise = async (): Promise<{
      suppressions: number;
      misesAJour: number;
      ajouts: number;
      total: number;
    }> => {
      const progressToast = toast.loading("Démarrage de la synchronisation...");

      try {
        toast.loading("Analyse des données...", { id: progressToast });
        const sync = await synchroniserDonnees(journees, lieux, virements);

        if (!sync) {
          throw new Error("Aucun résultat de synchronisation");
        }

        toast.loading("Application des changements...", {
          id: progressToast,
        });

        const suppressions =
          (sync["a supprimer"].journees?.length || 0) +
          (sync["a supprimer"].lieux?.length || 0) +
          (sync["a supprimer"].virements?.length || 0);

        const misesAJour =
          (sync["a mettre à jour"].journees?.length || 0) +
          (sync["a mettre à jour"].lieux?.length || 0) +
          (sync["a mettre à jour"].virements?.length || 0);

        const ajouts =
          sync["a enregistrer"].journees.length +
          sync["a enregistrer"].lieux.length +
          sync["a enregistrer"].virements.length;

        const total = suppressions + misesAJour + ajouts;

        return { suppressions, misesAJour, ajouts, total };
      } finally {
        toast.dismiss(progressToast);
      }
    };

    toast.promise(syncPromise(), {
      loading: "Initialisation...",
      success: (data) => {
        const { suppressions, misesAJour, ajouts, total } = data;

        if (total === 0) {
          return "Aucun changement nécessaire - données déjà synchronisées";
        }

        return (
          <div>
            <div>Synchronisation réussie :</div>
            <ul className="list-disc ml-6">
              <li>
                {`${ajouts} ajout${ajouts > 1 ? "s" : ""}`}
              </li>
              <li>
                {`${misesAJour} mise${misesAJour > 1 ? "s" : ""} à jour`}
              </li>
              <li>
                {`${suppressions} suppression${suppressions > 1 ? "s" : ""}`}
              </li>
            </ul>
          </div>
        );
      },
      error: (error: Error) => {
        return `Échec de la synchronisation : ${error.message}`;
      },
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Paramètres du compte
          </h1>
          <p className="text-gray-600 mt-2">Bonjour {profile?.full_name},</p>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos préférences de sécurité
          </p>
        </div>

        <div className="space-y-6">
          {/* Section Déconnexion */}
          <LogoutButton />

          {/* Section importer les données du cloud */}
          <div className="flex justify-center gap-2">
            <button
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded"
              onClick={handleImport}
            >
              Importer
              <br />
              les données du cloud
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              onClick={handleSynchronize}
            >
              Synchroniser
              <br />
              les données au cloud
            </button>
          </div>

          {/* Section Profil */}
          <ProfileSection
            currentFullName={profile?.full_name || ""}
            userId={user.id}
          />

          {/* Section Email */}
          <EmailSection currentEmail={user.email!} userId={user.id} />

          {/* Section Mot de passe */}
          <PasswordSection />
        </div>
      </div>
    </div>
  );
}
