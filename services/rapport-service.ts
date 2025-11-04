// services/rapport-service.ts
import { JourneeAvecLieu } from '@/types/journee'
import { Lieu } from '@/types/lieu'
import { RapportTrimestriel, DonneesLieu, RapportAnnuel } from '@/types/rapport'

export class RapportService {
  static getTrimestres(): Array<{ numero: 1 | 2 | 3 | 4, nom: string, debut: Date, fin: Date }> {
    const annee = new Date().getFullYear()
    return [
      {
        numero: 1,
        nom: 'T1 - Janvier à Mars',
        debut: new Date(annee, 0, 1),   // 1er janvier
        fin: new Date(annee, 2, 31)     // 31 mars
      },
      {
        numero: 2,
        nom: 'T2 - Avril à Juin',
        debut: new Date(annee, 3, 1),   // 1er avril
        fin: new Date(annee, 5, 30)     // 30 juin
      },
      {
        numero: 3,
        nom: 'T3 - Juillet à Septembre',
        debut: new Date(annee, 6, 1),   // 1er juillet
        fin: new Date(annee, 8, 30)     // 30 septembre
      },
      {
        numero: 4,
        nom: 'T4 - Octobre à Décembre',
        debut: new Date(annee, 9, 1),   // 1er octobre
        fin: new Date(annee, 11, 31)    // 31 décembre
      }
    ]
  }

  static genererRapportTrimestriel(
    journees: JourneeAvecLieu[],
    lieux: Lieu[],
    annee: number,
    trimestre: 1 | 2 | 3 | 4
  ): RapportTrimestriel {
    const trimestreData = this.getTrimestres().find(t => t.numero === trimestre)
    if (!trimestreData) {
      throw new Error('Trimestre invalide')
    }

    // Ajuster les dates pour l'année spécifiée
    const dateDebut = new Date(annee, trimestreData.debut.getMonth(), trimestreData.debut.getDate())
    const dateFin = new Date(annee, trimestreData.fin.getMonth(), trimestreData.fin.getDate())

    // Filtrer les journées du trimestre
    const journeesTrimestre = journees.filter(j => {
      const date = new Date(j.date)
      return date >= dateDebut && date <= dateFin
    })

    // Calculer les totaux généraux
    const totalRecettes = journeesTrimestre.reduce((sum, j) => sum + j.recettesTotales, 0)
    const totalHonoraires = journeesTrimestre.reduce((sum, j) => sum + j.honorairesTheoriques, 0)

    // Calculer les données par lieu
    const donneesParLieu: DonneesLieu[] = lieux.map(lieu => {
      const journeesLieu = journeesTrimestre.filter(j => j.lieuId === lieu.id)
      const totalRecettesLieu = journeesLieu.reduce((sum, j) => sum + j.recettesTotales, 0)
      const totalHonorairesLieu = journeesLieu.reduce((sum, j) => sum + j.honorairesTheoriques, 0)

      return {
        lieuId: lieu.id,
        nomLieu: lieu.nom,
        couleurLieu: lieu.couleur,
        pourcentageRetrocession: lieu.pourcentageRetrocession,
        totalRecettes: totalRecettesLieu,
        totalHonoraires: totalHonorairesLieu,
        nombreJours: journeesLieu.length
      }
    }).filter(donnees => donnees.nombreJours > 0)

    return {
      id: `rapport-${annee}-T${trimestre}`,
      annee,
      trimestre,
      dateDebut,
      dateFin,
      totalRecettes,
      totalHonoraires,
      nombreJours: journeesTrimestre.length,
      donneesParLieu,
      createdAt: new Date()
    }
  }

  static genererRapportAnnuel(
    journees: JourneeAvecLieu[],
    lieux: Lieu[],
    annee: number
  ): RapportAnnuel {
    const trimestres = [1, 2, 3, 4].map(trimestre => 
      this.genererRapportTrimestriel(journees, lieux, annee, trimestre as 1 | 2 | 3 | 4)
    )

    const totalRecettes = trimestres.reduce((sum, t) => sum + t.totalRecettes, 0)
    const totalHonoraires = trimestres.reduce((sum, t) => sum + t.totalHonoraires, 0)
    const totalJours = trimestres.reduce((sum, t) => sum + t.nombreJours, 0)

    return {
      annee,
      trimestres,
      totalRecettes,
      totalHonoraires,
      totalJours
    }
  }

  static getAnneesDisponibles(journees: JourneeAvecLieu[]): number[] {
    const annees = journees.map(j => new Date(j.date).getFullYear())
    const anneesUniques = [...new Set(annees)].sort((a, b) => b - a) // Décroissant
    return anneesUniques.length > 0 ? anneesUniques : [new Date().getFullYear()]
  }
}