// components/saisie/calendrier-saisie.tsx
import { useState, useMemo } from "react";
import { JourneeAvecLieu } from "@/types/journee";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Euro,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CalendrierSaisieProps {
  journees: JourneeAvecLieu[];
  onDateClick: (date: Date) => void;
  onJourneeClick: (journee: JourneeAvecLieu) => void;
  onCreateClick: () => void;
}

export function CalendrierSaisie({
  journees,
  onDateClick,
  onJourneeClick,
  onCreateClick,
}: CalendrierSaisieProps) {
  const [dateCourante, setDateCourante] = useState(new Date());

  // Générer le mois courant
  const joursDuMois = useMemo(() => {
    const annee = dateCourante.getFullYear();
    const mois = dateCourante.getMonth();

    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    const joursDansMois = dernierJour.getDate();

    const jours = [];

    // Ajouter les jours du mois précédent pour compléter la première semaine
    const premierJourSemaine = premierJour.getDay();
    const decalageLundi = premierJourSemaine === 0 ? 6 : premierJourSemaine - 1;

    for (let i = decalageLundi - 1; i >= 0; i--) {
      const date = new Date(annee, mois, -i);
      jours.push({ date, estHorsMois: true });
    }

    // Ajouter les jours du mois courant
    for (let jour = 1; jour <= joursDansMois; jour++) {
      const date = new Date(annee, mois, jour);
      jours.push({ date, estHorsMois: false });
    }

    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const joursManquants = 42 - jours.length;
    for (let i = 1; i <= joursManquants; i++) {
      const date = new Date(annee, mois + 1, i);
      jours.push({ date, estHorsMois: true });
    }

    return jours;
  }, [dateCourante]);

  // Grouper les journées par date
  const journeesParDate = useMemo(() => {
    const groupes: { [key: string]: JourneeAvecLieu[] } = {};

    journees.forEach((journee) => {
      const dateCle = new Date(journee.date).toDateString();
      if (!groupes[dateCle]) {
        groupes[dateCle] = [];
      }
      groupes[dateCle].push(journee);
    });

    return groupes;
  }, [journees]);

  // Navigation
  const moisPrecedent = () => {
    setDateCourante(
      new Date(dateCourante.getFullYear(), dateCourante.getMonth() - 1, 1)
    );
  };

  const moisSuivant = () => {
    setDateCourante(
      new Date(dateCourante.getFullYear(), dateCourante.getMonth() + 1, 1)
    );
  };

  const aujourdhui = () => {
    setDateCourante(new Date());
  };

  // Formater le mois/année
  const formatMoisAnnee = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  // Vérifier si une date est aujourd'hui
  const estAujourdhui = (date: Date) => {
    const aujourdhui = new Date();
    //    return date.toDateString() === aujourdhui.toDateString();
    return (
      date.getFullYear() === aujourdhui.getFullYear() &&
      date.getMonth() === aujourdhui.getMonth() &&
      date.getDate() === aujourdhui.getDate()
    );
  };

  // Calculer le total des honoraires pour une date
  const getTotalHonoraires = (journees: JourneeAvecLieu[]) => {
    return journees.reduce((total, j) => total + j.honorairesTheoriques, 0);
  };

  const handleDateClick = (date: Date) => {
    // Créer une nouvelle date sans l'heure pour éviter les problèmes de timezone
    const dateSansHeure = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    onDateClick(dateSansHeure);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier des honoraires
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={moisPrecedent}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={aujourdhui}>
              Aujourd&apos;hui
            </Button>

            <Button variant="outline" size="sm" onClick={moisSuivant}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-800">
            {formatMoisAnnee(dateCourante)}
          </h3>
        </div>
      </CardHeader>

      <CardContent>
        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((jour) => (
            <div
              key={jour}
              className="text-center text-sm font-medium text-slate-500 py-2"
            >
              {jour}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {joursDuMois.map(({ date, estHorsMois }, index) => {
            const dateCle = date.toDateString();
            const journeesDuJour = journeesParDate[dateCle] || [];
            const totalHonoraires = getTotalHonoraires(journeesDuJour);
            const estAujd = estAujourdhui(date);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border rounded-lg p-2 transition-all cursor-pointer
                  ${
                    estHorsMois
                      ? "bg-slate-50 border-slate-200 text-slate-400"
                      : estAujd ? "bg-blue-50 border-blue-500" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                  }
                `}
                onClick={() => !estHorsMois && handleDateClick(date)}
              >
                {/* Numéro du jour */}
                <div
                  className={`
                  text-sm font-medium mb-1
                  ${estHorsMois ? "text-slate-400" : estAujd ? "text-blue-600" : "text-slate-700"}
                `}
                >
                  {date.getDate()}
                </div>

                {/* Contenu des journées */}
                <div className="space-y-1">
                  {journeesDuJour.map((journee, idx) => (
                    <div
                      key={journee.id}
                      className={`
                        text-xs p-1 rounded border-l-2 cursor-pointer
                        ${idx >= 2 ? "hidden" : ""}
                      `}
                      style={{
                        borderLeftColor: journee.lieu.couleur,
                        backgroundColor: `${journee.lieu.couleur}10`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onJourneeClick(journee);
                      }}
                    >
                      <div className="font-medium truncate">
                        {journee.lieu.nom}
                      </div>
                      <div className="text-green-600 font-bold flex items-center gap-1">
                        <Euro className="h-2 w-2" />
                        {journee.honorairesTheoriques.toFixed(0)}€
                      </div>
                    </div>
                  ))}

                  {/* Indicateur de journées supplémentaires */}
                  {journeesDuJour.length > 2 && (
                    <Badge variant="secondary" className="w-full text-xs">
                      +{journeesDuJour.length - 2} autre
                      {journeesDuJour.length - 2 > 1 ? "s" : ""}
                    </Badge>
                  )}

                  {/* Indicateur pour ajouter une journée */}
                  {journeesDuJour.length === 0 && !estHorsMois && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-6 text-xs text-slate-400 hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(date);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>

                {/* Total du jour */}
                {totalHonoraires > 0 && (
                  <div className="mt-1 pt-1 border-t border-slate-100">
                    <div className="text-xs font-semibold text-green-600 text-center">
                      {totalHonoraires.toFixed(0)}€
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Aujourd&apos;hui</span>
            </div>
            <div className="flex items-center gap-1">
              <Euro className="h-3 w-3 text-green-600" />
              <span>Honoraires théoriques</span>
            </div>
          </div>

          <Button onClick={onCreateClick} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle saisie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
