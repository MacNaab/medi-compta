// services/virement-alerte-service.ts
import { JourneeAvecLieu } from '@/types/journee'
import { VirementAvecLieu } from '@/types/virement'
import { Lieu } from '@/types/lieu'

export interface VirementManquant {
  lieuId: string
  nomLieu: string
  couleurLieu: string
  pourcentageRetrocession: number
  periode: {
    dateDebut: Date
    dateFin: Date
    label: string
  }
  montantTheorique: number
  joursTravailles: number
  dernierJour: Date
  urgence: 'faible' | 'moyenne' | 'elevee'
}

export interface ResumeVirementsManquants {
  totalManquant: number
  nombreAlertes: number
  alertesUrgentes: number
  prochainesEcheances: Date[]
  parLieu: VirementManquant[]
}

export class VirementAlerteService {
  static detecterVirementsManquants(
    journees: JourneeAvecLieu[],
    virements: VirementAvecLieu[],
    lieux: Lieu[]
  ): ResumeVirementsManquants {
    const aujourdhui = new Date()
    const alertes: VirementManquant[] = []

    // Pour chaque lieu, détecter les périodes sans virement
    lieux.forEach(lieu => {
      const journeesLieu = journees.filter(j => j.lieuId === lieu.id)
      const virementsLieu = virements.filter(v => v.lieuId === lieu.id)

      if (journeesLieu.length === 0) return

      // Grouper les journées par mois
      const journeesParMois = this.grouperJourneesParMois(journeesLieu)

      // Vérifier chaque mois
      journeesParMois.forEach(({ annee, mois, journeesMois, totalTheorique }) => {
        const dateDebut = new Date(annee, mois, 1)
        const dateFin = new Date(annee, mois + 1, 0)
        // const periodeKey = `${annee}-${mois}`

        // Vérifier s'il y a un virement pour cette période
        const virementExiste = virementsLieu.some(v => {
          const virementDebut = new Date(v.dateDebut)
          const virementFin = new Date(v.dateFin)
          return (
            virementDebut.getMonth() === mois &&
            virementDebut.getFullYear() === annee &&
            virementFin.getMonth() === mois &&
            virementFin.getFullYear() === annee
          )
        })

        if (!virementExiste && totalTheorique > 0) {
          const dernierJour = new Date(Math.max(...journeesMois.map(j => new Date(j.date).getTime())))
          const delai = aujourdhui.getTime() - dateFin.getTime()
          const joursDepuisEcheance = Math.floor(delai / (1000 * 60 * 60 * 24))

          let urgence: VirementManquant['urgence'] = 'faible'
          if (joursDepuisEcheance > 60) urgence = 'elevee'
          else if (joursDepuisEcheance > 30) urgence = 'moyenne'

          alertes.push({
            lieuId: lieu.id,
            nomLieu: lieu.nom,
            couleurLieu: lieu.couleur,
            pourcentageRetrocession: lieu.pourcentageRetrocession,
            periode: {
              dateDebut,
              dateFin,
              label: dateDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            },
            montantTheorique: totalTheorique,
            joursTravailles: journeesMois.length,
            dernierJour,
            urgence
          })
        }
      })
    })

    // Trier par urgence puis par montant
    alertes.sort((a, b) => {
      const prioriteA = this.getPrioriteUrgence(a.urgence)
      const prioriteB = this.getPrioriteUrgence(b.urgence)
      if (prioriteA !== prioriteB) return prioriteB - prioriteA
      return b.montantTheorique - a.montantTheorique
    })

    const totalManquant = alertes.reduce((sum, alerte) => sum + alerte.montantTheorique, 0)
    const alertesUrgentes = alertes.filter(a => a.urgence === 'elevee').length

    // Prochaines échéances (3 prochains mois)
    const prochainesEcheances = this.calculerProchainesEcheances(aujourdhui)

    return {
      totalManquant,
      nombreAlertes: alertes.length,
      alertesUrgentes,
      prochainesEcheances,
      parLieu: alertes
    }
  }

  private static grouperJourneesParMois(journees: JourneeAvecLieu[]) {
    const groupes: { [key: string]: { annee: number, mois: number, journeesMois: JourneeAvecLieu[], totalTheorique: number } } = {}

    journees.forEach(journee => {
      const date = new Date(journee.date)
      const annee = date.getFullYear()
      const mois = date.getMonth()
      const cle = `${annee}-${mois}`

      if (!groupes[cle]) {
        groupes[cle] = { annee, mois, journeesMois: [], totalTheorique: 0 }
      }

      groupes[cle].journeesMois.push(journee)
      groupes[cle].totalTheorique += journee.honorairesTheoriques
    })

    return Object.values(groupes)
  }

  private static getPrioriteUrgence(urgence: VirementManquant['urgence']): number {
    switch (urgence) {
      case 'elevee': return 3
      case 'moyenne': return 2
      case 'faible': return 1
      default: return 0
    }
  }

  private static calculerProchainesEcheances(aujourdhui: Date): Date[] {
    const echeances: Date[] = []
    for (let i = 1; i <= 3; i++) {
      const echeance = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + i, 1)
      echeances.push(echeance)
    }
    return echeances
  }

  static genererMessageAlerte(resume: ResumeVirementsManquants): string {
    if (resume.nombreAlertes === 0) {
      return "✅ Tous vos virements sont à jour !"
    }

    const messages: string[] = []
    
    if (resume.alertesUrgentes > 0) {
      messages.push(`${resume.alertesUrgentes} virement(s) urgent(s) en retard`)
    }
    
    if (resume.nombreAlertes > 0) {
      messages.push(`${resume.nombreAlertes} virement(s) manquant(s) au total`)
    }

    messages.push(`Montant total manquant : ${resume.totalManquant.toFixed(2)} €`)

    return `⚠️ ${messages.join(' • ')}`
  }
}