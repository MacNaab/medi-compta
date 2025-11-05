// services/rapport-reel-service.ts
import { VirementAvecLieu } from "@/types/virement";
import { Lieu } from "@/types/lieu";

export interface RapportReelTrimestriel {
  id: string;
  annee: number;
  trimestre: 1 | 2 | 3 | 4;
  dateDebut: Date;
  dateFin: Date;
  totalVirements: number;
  nombreVirements: number;
  donneesParLieu: DonneesVirementLieu[];
  virementsEnAttente: number;
  virementsPartiels: number;
  createdAt: Date;
}

export interface DonneesVirementLieu {
  lieuId: string;
  nomLieu: string;
  couleurLieu: string;
  totalVirements: number;
  nombreVirements: number;
  statutMoyen: "recu" | "attente" | "partiel" | "manquant";
}

export interface RapportReelAnnuel {
  annee: number;
  trimestres: RapportReelTrimestriel[];
  totalVirements: number;
  totalVirementsEnAttente: number;
  totalVirementsPartiels: number;
  lieuxAvecProblemes: LieuAvecProblemeVirement[];
}

export interface LieuAvecProblemeVirement {
  lieuId: string;
  nomLieu: string;
  couleurLieu: string;
  virementsEnAttente: number;
  virementsPartiels: number;
  dernierVirement?: Date;
}

export class RapportReelService {
  static genererRapportReelTrimestriel(
    virements: VirementAvecLieu[],
    lieux: Lieu[],
    annee: number,
    trimestre: 1 | 2 | 3 | 4
  ): RapportReelTrimestriel {
    const trimestreData = this.getTrimestres().find(
      (t) => t.numero === trimestre
    );
    if (!trimestreData) {
      throw new Error("Trimestre invalide");
    }

    const dateDebut = new Date(
      annee,
      trimestreData.debut.getMonth(),
      trimestreData.debut.getDate()
    );
    const dateFin = new Date(
      annee,
      trimestreData.fin.getMonth(),
      trimestreData.fin.getDate()
    );

    // Filtrer les virements du trimestre
    const virementsTrimestre = virements.filter((v) => {
      const dateReception = new Date(v.dateReception);
      return dateReception >= dateDebut && dateReception <= dateFin;
    });

    const totalVirements = virementsTrimestre.reduce(
      (sum, v) => sum + v.montantRecu,
      0
    );
    const virementsEnAttente = virementsTrimestre.filter(
      (v) => v.statut === "attente"
    ).length;
    const virementsPartiels = virementsTrimestre.filter(
      (v) => v.statut === "partiel"
    ).length;

    // Données par lieu
    const donneesParLieu: DonneesVirementLieu[] = lieux
      .map((lieu) => {
        const virementsLieu = virementsTrimestre.filter(
          (v) => v.lieuId === lieu.id
        );
        const totalVirementsLieu = virementsLieu.reduce(
          (sum, v) => sum + v.montantRecu,
          0
        );

        // Déterminer le statut moyen
        let statutMoyen: DonneesVirementLieu["statutMoyen"] = "recu";
        if (virementsLieu.some((v) => v.statut === "attente"))
          statutMoyen = "attente";
        else if (virementsLieu.some((v) => v.statut === "partiel"))
          statutMoyen = "partiel";
        else if (virementsLieu.some((v) => v.statut === "manquant"))
          statutMoyen = "manquant";

        return {
          lieuId: lieu.id,
          nomLieu: lieu.nom,
          couleurLieu: lieu.couleur,
          totalVirements: totalVirementsLieu,
          nombreVirements: virementsLieu.length,
          statutMoyen,
        };
      })
      .filter((donnees) => donnees.nombreVirements > 0);

    return {
      id: `rapport-reel-${annee}-T${trimestre}`,
      annee,
      trimestre,
      dateDebut,
      dateFin,
      totalVirements,
      nombreVirements: virementsTrimestre.length,
      donneesParLieu,
      virementsEnAttente,
      virementsPartiels,
      createdAt: new Date(),
    };
  }

  static genererRapportReelAnnuel(
    virements: VirementAvecLieu[],
    lieux: Lieu[],
    annee: number
  ): RapportReelAnnuel {
    const trimestres = [1, 2, 3, 4].map((trimestre) =>
      this.genererRapportReelTrimestriel(
        virements,
        lieux,
        annee,
        trimestre as 1 | 2 | 3 | 4
      )
    );

    const totalVirements = trimestres.reduce(
      (sum, t) => sum + t.totalVirements,
      0
    );
    const totalVirementsEnAttente = trimestres.reduce(
      (sum, t) => sum + t.virementsEnAttente,
      0
    );
    const totalVirementsPartiels = trimestres.reduce(
      (sum, t) => sum + t.virementsPartiels,
      0
    );

    // Détecter les lieux avec problèmes de virements
    const lieuxAvecProblemes: LieuAvecProblemeVirement[] = lieux
      .map((lieu) => {
        const virementsLieu = virements.filter((v) => v.lieuId === lieu.id);
        const virementsEnAttente = virementsLieu.filter(
          (v) => v.statut === "attente"
        ).length;
        const virementsPartiels = virementsLieu.filter(
          (v) => v.statut === "partiel"
        ).length;
        const dernierVirement =
          virementsLieu.length > 0
            ? new Date(
                Math.max(
                  ...virementsLieu.map((v) =>
                    new Date(v.dateReception).getTime()
                  )
                )
              )
            : undefined;

        return {
          lieuId: lieu.id,
          nomLieu: lieu.nom,
          couleurLieu: lieu.couleur,
          virementsEnAttente,
          virementsPartiels,
          dernierVirement,
        };
      })
      .filter(
        (lieu) => lieu.virementsEnAttente > 0 || lieu.virementsPartiels > 0
      );

    return {
      annee,
      trimestres,
      totalVirements,
      totalVirementsEnAttente,
      totalVirementsPartiels,
      lieuxAvecProblemes,
    };
  }

  private static getTrimestres() {
    const annee = new Date().getFullYear();
    return [
      { numero: 1, debut: new Date(annee, 0, 1), fin: new Date(annee, 2, 31) },
      { numero: 2, debut: new Date(annee, 3, 1), fin: new Date(annee, 5, 30) },
      { numero: 3, debut: new Date(annee, 6, 1), fin: new Date(annee, 8, 30) },
      { numero: 4, debut: new Date(annee, 9, 1), fin: new Date(annee, 11, 31) },
    ];
  }
}
