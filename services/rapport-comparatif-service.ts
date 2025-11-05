// services/rapport-comparatif-service.ts
import { JourneeAvecLieu } from '@/types/journee'
import { VirementAvecLieu } from '@/types/virement'
import { Lieu } from '@/types/lieu'

export interface RapportComparatifTrimestriel {
  annee: number
  trimestre: 1 | 2 | 3 | 4
  dateDebut: Date
  dateFin: Date
  totalTheorique: number
  totalReel: number
  difference: number
  pourcentageDifference: number
  donneesParLieu: DonneesComparatifLieu[]
}

export interface DonneesComparatifLieu {
  lieuId: string
  nomLieu: string
  couleurLieu: string
  theorique: number
  reel: number
  difference: number
  pourcentageDifference: number
  statut: 'conforme' | 'surplus' | 'deficit' | 'manquant'
}

export interface RapportComparatifAnnuel {
  annee: number
  totalTheorique: number
  totalReel: number
  difference: number
  pourcentageDifference: number
  trimestres: RapportComparatifTrimestriel[]
  lieuxAProblemes: LieuAProbleme[]
}

export interface LieuAProbleme {
  lieuId: string
  nomLieu: string
  couleurLieu: string
  deficitTotal: number
  trimestresManquants: number[]
}

export class RapportComparatifService {
  static genererRapportComparatifTrimestriel(
    journees: JourneeAvecLieu[],
    virements: VirementAvecLieu[],
    lieux: Lieu[],
    annee: number,
    trimestre: 1 | 2 | 3 | 4
  ): RapportComparatifTrimestriel {
    const trimestreData = this.getTrimestres().find(t => t.numero === trimestre)
    if (!trimestreData) {
      throw new Error('Trimestre invalide')
    }

    const dateDebut = new Date(annee, trimestreData.debut.getMonth(), trimestreData.debut.getDate())
    const dateFin = new Date(annee, trimestreData.fin.getMonth(), trimestreData.fin.getDate())

    // Données théoriques (journées)
    const journeesTrimestre = journees.filter(j => {
      const date = new Date(j.date)
      return date >= dateDebut && date <= dateFin
    })

    // Données réelles (virements)
    const virementsTrimestre = virements.filter(v => {
      const dateReception = new Date(v.dateReception)
      return dateReception >= dateDebut && dateReception <= dateFin
    })

    const totalTheorique = journeesTrimestre.reduce((sum, j) => sum + j.honorairesTheoriques, 0)
    const totalReel = virementsTrimestre.reduce((sum, v) => sum + v.montantRecu, 0)
    const difference = totalReel - totalTheorique
    const pourcentageDifference = totalTheorique > 0 ? (difference / totalTheorique) * 100 : 0

    // Données par lieu
    const donneesParLieu: DonneesComparatifLieu[] = lieux.map(lieu => {
      const theorique = journeesTrimestre
        .filter(j => j.lieuId === lieu.id)
        .reduce((sum, j) => sum + j.honorairesTheoriques, 0)

      const reel = virementsTrimestre
        .filter(v => v.lieuId === lieu.id)
        .reduce((sum, v) => sum + v.montantRecu, 0)

      const differenceLieu = reel - theorique
      const pourcentageDifferenceLieu = theorique > 0 ? (differenceLieu / theorique) * 100 : 0

      let statut: DonneesComparatifLieu['statut'] = 'conforme'
      if (theorique > 0 && reel === 0) statut = 'manquant'
      else if (differenceLieu < -10) statut = 'deficit' // Seuil de -10€
      else if (differenceLieu > 10) statut = 'surplus' // Seuil de +10€

      return {
        lieuId: lieu.id,
        nomLieu: lieu.nom,
        couleurLieu: lieu.couleur,
        theorique,
        reel,
        difference: differenceLieu,
        pourcentageDifference: pourcentageDifferenceLieu,
        statut
      }
    }).filter(donnees => donnees.theorique > 0 || donnees.reel > 0)

    return {
      annee,
      trimestre,
      dateDebut,
      dateFin,
      totalTheorique,
      totalReel,
      difference,
      pourcentageDifference,
      donneesParLieu
    }
  }

  static genererRapportComparatifAnnuel(
    journees: JourneeAvecLieu[],
    virements: VirementAvecLieu[],
    lieux: Lieu[],
    annee: number
  ): RapportComparatifAnnuel {
    const trimestres = [1, 2, 3, 4].map(trimestre => 
      this.genererRapportComparatifTrimestriel(journees, virements, lieux, annee, trimestre as 1 | 2 | 3 | 4)
    )

    const totalTheorique = trimestres.reduce((sum, t) => sum + t.totalTheorique, 0)
    const totalReel = trimestres.reduce((sum, t) => sum + t.totalReel, 0)
    const difference = totalReel - totalTheorique
    const pourcentageDifference = totalTheorique > 0 ? (difference / totalTheorique) * 100 : 0

    // Détecter les lieux avec problèmes
    const lieuxAProblemes: LieuAProbleme[] = lieux.map(lieu => {
      const deficitTotal = trimestres.reduce((sum, trimestre) => {
        const donneesLieu = trimestre.donneesParLieu.find(d => d.lieuId === lieu.id)
        return sum + (donneesLieu?.difference || 0)
      }, 0)

      const trimestresManquants = trimestres
        .map((trimestre, index) => {
          const donneesLieu = trimestre.donneesParLieu.find(d => d.lieuId === lieu.id)
          const theorique = donneesLieu?.theorique || 0
          const reel = donneesLieu?.reel || 0
          return theorique > 0 && reel === 0 ? index + 1 : null
        })
        .filter(Boolean) as number[]

      return {
        lieuId: lieu.id,
        nomLieu: lieu.nom,
        couleurLieu: lieu.couleur,
        deficitTotal,
        trimestresManquants
      }
    }).filter(lieu => lieu.deficitTotal < -50 || lieu.trimestresManquants.length > 0) // Seuil de 50€ de déficit

    return {
      annee,
      totalTheorique,
      totalReel,
      difference,
      pourcentageDifference,
      trimestres,
      lieuxAProblemes
    }
  }

  private static getTrimestres() {
    const annee = new Date().getFullYear()
    return [
      { numero: 1, debut: new Date(annee, 0, 1), fin: new Date(annee, 2, 31) },
      { numero: 2, debut: new Date(annee, 3, 1), fin: new Date(annee, 5, 30) },
      { numero: 3, debut: new Date(annee, 6, 1), fin: new Date(annee, 8, 30) },
      { numero: 4, debut: new Date(annee, 9, 1), fin: new Date(annee, 11, 31) }
    ]
  }
}