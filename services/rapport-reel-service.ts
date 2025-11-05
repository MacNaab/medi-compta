// services/rapport-reel-service.ts
import { Virement, VirementAvecLieu } from "@/types/virement";
import { Lieu } from "@/types/lieu";
import { JourneeAvecLieu } from "@/types/journee";

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
  virementsAutomatiques: VirementAvecLieu[];
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
    journees: JourneeAvecLieu[],
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

    // Calcul des virements en attente automatiques
    const virementsAutomatiques = this.genererVirementsAutomatiques(
      journees,
      virements,
      lieux,
      annee
    );
    // Fusionner les virements réels et automatiques
    const tousLesVirements = [...virements, ...virementsAutomatiques];

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

    // Recalculer les trimestres avec les virements automatiques
    const trimestresAvecAutomatiques = [1, 2, 3, 4].map((trimestre) =>
      this.genererRapportReelTrimestriel(
        tousLesVirements,
        lieux,
        annee,
        trimestre as 1 | 2 | 3 | 4
      )
    );

    // Détecter les lieux avec problèmes
    const lieuxAvecProblemes = this.detecterLieuxAProblemes(
      lieux,
      journees,
      virements,
      annee
    );

    /*
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
    */

    return {
      annee,
      trimestres: trimestresAvecAutomatiques,
      totalVirements,
      totalVirementsEnAttente,
      totalVirementsPartiels,
      lieuxAvecProblemes,
      virementsAutomatiques,
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

  private static genererVirementsAutomatiques(
    journees: JourneeAvecLieu[],
    virementsExistants: VirementAvecLieu[],
    lieux: Lieu[],
    annee: number
  ): VirementAvecLieu[] {
    const virementsAutomatiques: VirementAvecLieu[] = [];
    const aujourdhui = new Date();

    lieux.forEach((lieu) => {
      // Analyser chaque mois de l'année
      for (let mois = 0; mois < 12; mois++) {
        const dateDebut = new Date(annee, mois, 1);
        const dateFin = new Date(annee, mois + 1, 0);

        // Vérifier s'il y a des journées ce mois-ci pour ce lieu
        const journeesMois = journees.filter(
          (j) =>
            j.lieuId === lieu.id &&
            new Date(j.date).getMonth() === mois &&
            new Date(j.date).getFullYear() === annee
        );

        if (journeesMois.length > 0) {
          const totalTheorique = journeesMois.reduce(
            (sum, j) => sum + j.honorairesTheoriques,
            0
          );

          // Vérifier s'il existe déjà un virement pour cette période
          const virementExiste = this.virementExistePourPeriode(
            virementsExistants,
            lieu.id,
            dateDebut,
            dateFin
          );

          if (!virementExiste && totalTheorique > 0) {
            // Déterminer le statut automatique
            let statut: Virement["statut"] = "attente";
            const delai = aujourdhui.getTime() - dateFin.getTime();
            const joursDepuisEcheance = Math.floor(
              delai / (1000 * 60 * 60 * 24)
            );

            if (joursDepuisEcheance > 60) statut = "manquant";
            else if (joursDepuisEcheance > 30) statut = "partiel";

            const virementAutomatique: VirementAvecLieu = {
              id: `auto-${lieu.id}-${annee}-${mois}`,
              lieuId: lieu.id,
              dateDebut,
              dateFin,
              montantRecu: 0, // Montant à recevoir
              dateReception: new Date(annee, mois, 15), // Date estimée
              statut,
              notes: `Virement automatique - ${totalTheorique.toFixed(
                2
              )}€ attendus`,
              createdAt: new Date(),
              updatedAt: new Date(),
              lieu: {
                nom: lieu.nom,
                couleur: lieu.couleur,
              },
              montantTheorique: totalTheorique,
              difference: -totalTheorique,
            };

            virementsAutomatiques.push(virementAutomatique);
          }
        }
      }
    });

    return virementsAutomatiques;
  }

  private static memesDates(date1: Date, date2: Date): boolean {
    // Comparer seulement l'année, le mois et le jour
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private static virementExistePourPeriode(
    virementsExistants: VirementAvecLieu[],
    lieuId: string,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return virementsExistants.some((v) => {
      // Vérifier que c'est le même lieu
      if (v.lieuId !== lieuId) return false;

      // Vérifier que les périodes se chevauchent ou correspondent
      const virementDebut = new Date(v.dateDebut);
      const virementFin = new Date(v.dateFin);

      // Les périodes se chevauchent ou le virement couvre la période
      return (
        (virementDebut <= dateFin && virementFin >= dateDebut) ||
        // Ou le virement est pour le même mois
        (virementDebut.getMonth() === dateDebut.getMonth() &&
          virementDebut.getFullYear() === dateDebut.getFullYear())
      );
    });
  }

  //  Détection des lieux avec problèmes
  private static detecterLieuxAProblemes(
    lieux: Lieu[],
    journees: JourneeAvecLieu[],
    virements: VirementAvecLieu[],
    annee: number
  ): LieuAvecProblemeVirement[] {
    const aujourdhui = new Date();
    const lieuxAProblemes: LieuAvecProblemeVirement[] = [];

    lieux.forEach((lieu) => {
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
                ...virementsLieu.map((v) => new Date(v.dateReception).getTime())
              )
            )
          : undefined;

      // Vérifier s'il y a des problèmes significatifs
      const aDesProblemes =
        virementsEnAttente > 0 ||
        virementsPartiels > 0 ||
        this.aDesRetardsImportants(
          lieu.id,
          journees,
          virements,
          annee,
          aujourdhui
        );

      if (aDesProblemes) {
        lieuxAProblemes.push({
          lieuId: lieu.id,
          nomLieu: lieu.nom,
          couleurLieu: lieu.couleur,
          virementsEnAttente,
          virementsPartiels,
          dernierVirement,
        });
      }
    });

    return lieuxAProblemes;
  }

  // Méthode utilitaire pour détecter les retards importants
  private static aDesRetardsImportants(
    lieuId: string,
    journees: JourneeAvecLieu[],
    virements: VirementAvecLieu[],
    annee: number,
    aujourdhui: Date
  ): boolean {
    // Vérifier les 3 derniers mois pour des retards
    for (let i = 1; i <= 3; i++) {
      const mois = aujourdhui.getMonth() - i;
      const anneeMois = mois >= 0 ? annee : annee - 1;
      const moisCorrect = mois >= 0 ? mois : mois + 12;

      const dateDebut = new Date(anneeMois, moisCorrect, 1);
      const dateFin = new Date(anneeMois, moisCorrect + 1, 0);

      // Vérifier s'il y a des journées mais pas de virement
      const journeesMois = journees.filter(
        (j) =>
          j.lieuId === lieuId &&
          new Date(j.date) >= dateDebut &&
          new Date(j.date) <= dateFin
      );

      if (journeesMois.length > 0) {
        const virementExiste = virements.some(
          (v) =>
            v.lieuId === lieuId &&
            new Date(v.dateReception) >= dateDebut &&
            new Date(v.dateReception) <= dateFin
        );

        if (!virementExiste) {
          return true; // Retard détecté
        }
      }
    }

    return false;
  }
}
