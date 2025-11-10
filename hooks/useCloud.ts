import { Journee } from "@/types/journee";
import { Lieu } from "@/types/lieu";
import { Virement } from "@/types/virement";
import { isEqual } from "lodash";
import { createClient } from "@/lib/supabase/client";
import { ExportImportService } from "@/services/export-import-service";
import { toast } from "sonner";

export function useCloud() {
  const supabase = createClient();

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  const getProfile = async () => {
    const user = await getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single();
    return profile;
  };

  const getCloudDonnees = async () => {
    // récupérer les données du cloud
    const { data: journees } = await supabase.from("journees").select();
    const { data: lieux } = await supabase.from("lieux").select();
    const { data: virements } = await supabase.from("virements").select();

    return { journees, lieux, virements };
  };

  const cloudToDonnees = async () => {
    const { journees, lieux, virements } = await getCloudDonnees();
    return await ExportImportService.cloudToDonnees({
      lieux: lieux || [],
      journees: journees || [],
      virements: virements || [],
    });
  };

  const synchroniserDonnees = async (
    localJournees: Journee[],
    localLieux: Lieu[],
    localVirements: Virement[]
  ) => {
    // récupérer les données du cloud
    const {
      journees: cloudJournees = [],
      lieux: cloudLieux = [],
      virements: cloudVirements = [],
    } = await getCloudDonnees();

    // supprimer la paramètre "lieu" de localJournees
    localJournees = localJournees.map((j) => {
      delete j.lieu;
      return j;
    });
    localVirements = localVirements.map((v) => {
      delete v.lieu;
      delete v.difference;
      delete v.montantTheorique;
      return v;
    });

    // comparer les données locales avec les données du cloud à enregistrer
    const journeesAEnregistrer = localJournees.filter(
      (j) => !cloudJournees?.some((cj) => cj.id === j.id)
    );
    const lieuxAEnregistrer = localLieux.filter(
      (l) => !cloudLieux?.some((cl) => cl.id === l.id)
    );
    const virementsAEnregistrer = localVirements.filter(
      (v) => !cloudVirements?.some((cv) => cv.id === v.id)
    );

    // comparer les données locales avec les données du cloud à supprimer
    const journeesASupprimer = cloudJournees?.filter(
      (cj) => !localJournees?.some((j) => j.id === cj.id)
    );
    const lieuxASupprimer = cloudLieux?.filter(
      (cl) => !localLieux?.some((l) => l.id === cl.id)
    );
    const virementsASupprimer = cloudVirements?.filter(
      (cv) => !localVirements?.some((v) => v.id === cv.id)
    );

    // comparer les données locales avec les données du cloud à mettre à jour
    const journeesAMettreAJour = localJournees.filter((j) =>
      cloudJournees?.some((cj) => cj.id === j.id && !isEqual(j, cj))
    );
    const lieuxAMettreAJour = localLieux.filter((l) =>
      cloudLieux?.some(
        (cl) =>
          cl.id === l.id &&
          !isEqual(
            { ...l, createdAt: undefined, updatedAt: undefined },
            { ...cl, createdAt: undefined, updatedAt: undefined }
          )
      )
    );

    const virementsAMettreAJour = localVirements.filter((v) =>
      cloudVirements?.some((cv) => cv.id === v.id && !isEqual(v, cv))
    );

    // enregistrer les données dans le cloud superbase
    if (lieuxAEnregistrer.length > 0) {
      const { error } = await supabase.from("lieux").insert(lieuxAEnregistrer);
      if (error) {
        toast.error(error.message);
      }
    }
    if (journeesAEnregistrer.length > 0) {
      const { error } = await supabase
        .from("journees")
        .insert(journeesAEnregistrer);
      if (error) {
        toast.error(error.message);
      }
    }
    if (virementsAEnregistrer.length > 0) {
      const { error } = await supabase
        .from("virements")
        .insert(virementsAEnregistrer);
      if (error) {
        toast.error(error.message);
      }
    }

    // supprimer les données dans le cloud superbase
    if (journeesASupprimer && journeesASupprimer.length > 0) {
      // array avec les liste des id à supprimer
      const idsJourneesASupprimer = journeesASupprimer.map((j) => j.id);
      const { error } = await supabase
        .from("journees")
        .delete()
        .eq("id", idsJourneesASupprimer);
      if (error) {
        toast.error(error.message);
      }
    }
    if (lieuxASupprimer && lieuxASupprimer.length > 0) {
      // array avec les liste des id à supprimer
      const idsLieuxASupprimer = lieuxASupprimer.map((l) => l.id);
      const { error } = await supabase
        .from("lieux")
        .delete()
        .eq("id", idsLieuxASupprimer);
      if (error) {
        toast.error(error.message);
      }
    }
    if (virementsASupprimer && virementsASupprimer.length > 0) {
      // array avec les liste des id à supprimer
      const idsVirementsASupprimer = virementsASupprimer.map((v) => v.id);
      const { error } = await supabase
        .from("virements")
        .delete()
        .eq("id", idsVirementsASupprimer);
      if (error) {
        toast.error(error.message);
      }
    }

    // metre à jour les données dans le cloud superbase
    if (journeesAMettreAJour && journeesAMettreAJour.length > 0) {
      const updates = journeesAMettreAJour.map((journee) =>
        supabase.from("journees").update(journee).eq("id", journee.id)
      );
      await Promise.all(updates);
    }
    if (lieuxAMettreAJour && lieuxAMettreAJour.length > 0) {
      const updates = lieuxAMettreAJour.map((lieu) =>
        supabase.from("lieux").update(lieu).eq("id", lieu.id)
      );
      await Promise.all(updates);
    }
    if (virementsAMettreAJour && virementsAMettreAJour.length > 0) {
      const updates = virementsAMettreAJour.map((virement) =>
        supabase.from("virements").update(virement).eq("id", virement.id)
      );
      await Promise.all(updates);
    }

    return {
      "a enregistrer": {
        journees: journeesAEnregistrer,
        lieux: lieuxAEnregistrer,
        virements: virementsAEnregistrer,
      },
      "a supprimer": {
        journees: journeesASupprimer,
        lieux: lieuxASupprimer,
        virements: virementsASupprimer,
      },
      "a mettre à jour": {
        journees: journeesAMettreAJour,
        lieux: lieuxAMettreAJour,
        virements: virementsAMettreAJour,
      },
    };
  };

  const insertToCloud = async (
    database: "journees" | "lieux" | "virements",
    data: Journee | Lieu | Virement
  ) => {
    const { error } = await supabase.from(database).insert(data);
    if (error) {
      // new row violates row-level security policy for table "lieux"
      if (!error.message.includes("row-level security policy")) {
        toast.error(error.message);
      }
    }else{
      toast.info("Donnée enregistrée dans le cloud");
    }
  };

  const updateToCloud = async (
    database: "journees" | "lieux" | "virements",
    data: Journee | Lieu | Virement
  ) => {
    const { error } = await supabase
      .from(database)
      .update(data)
      .eq("id", data.id);
    if (error) {
      toast.error(error.message);
    }else{
      toast.info("Donnée mise à jour dans le cloud");
    }
  };

  const deleteToCloud = async (
    database: "journees" | "lieux" | "virements",
    id: string
  ) => {
    const { error } = await supabase.from(database).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    }else{
      toast.info("Donnée supprimée dans le cloud");
    }
  };

  return {
    getUser,
    getProfile,
    getCloudDonnees,
    synchroniserDonnees,
    cloudToDonnees,
    insertToCloud,
    updateToCloud,
    deleteToCloud,
  };
}
