// components/patient/agenda-medical.tsx
"use client";

import { useState, useMemo } from "react";
import { Consultation } from "@/types/consultation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface AgendaMedicalProps {
  date: Date;
  onDateChange: (date: Date) => void;
  consultations: Consultation[];
  onCreateConsultation: (heure: string) => void;
  onEditConsultation: (consultation: Consultation) => void;
}

export function AgendaMedical({
  date,
  onDateChange,
  consultations,
  onCreateConsultation,
  onEditConsultation,
}: AgendaMedicalProps) {
  const [dateCourante, setDateCourante] = useState(date);

  // Générer les heures principales (8h, 9h, 10h...)
  const heuresPrincipales = useMemo(() => {
    const heures = [];
    for (let heure = 8; heure <= 20; heure++) {
      heures.push(heure.toString().padStart(2, "0") + "h00");
    }
    return heures;
  }, []);

  // Générer tous les créneaux de 15 minutes pour le regroupement
  const tousLesCreneaux = useMemo(() => {
    const creneaux = [];
    for (let heure = 8; heure <= 20; heure++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const heureStr = heure.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        creneaux.push(`${heureStr}:${minuteStr}`);
      }
    }
    return creneaux;
  }, []);

  // Grouper les créneaux par heure principale
  const creneauxParHeure = useMemo(() => {
    const groupes: { [key: string]: string[] } = {};

    heuresPrincipales.forEach((heurePrincipale) => {
      const heure = heurePrincipale.replace("h00", "");
      groupes[heurePrincipale] = tousLesCreneaux.filter((creneau) =>
        creneau.startsWith(heure + ":")
      );
    });

    return groupes;
  }, [heuresPrincipales, tousLesCreneaux]);

  // Grouper les consultations par créneau
  const consultationsParCreneau = useMemo(() => {
    const groupes: { [key: string]: Consultation[] } = {};

    consultations.forEach((consultation) => {
      if (!groupes[consultation.heure]) {
        groupes[consultation.heure] = [];
      }
      groupes[consultation.heure].push(consultation);
    });

    return groupes;
  }, [consultations]);

  // Navigation entre les jours
  const jourPrecedent = () => {
    const nouvelleDate = new Date(dateCourante);
    nouvelleDate.setDate(nouvelleDate.getDate() - 1);
    setDateCourante(nouvelleDate);
    onDateChange(nouvelleDate);
  };

  const jourSuivant = () => {
    const nouvelleDate = new Date(dateCourante);
    nouvelleDate.setDate(nouvelleDate.getDate() + 1);
    setDateCourante(nouvelleDate);
    onDateChange(nouvelleDate);
  };

  const aujourdhui = () => {
    const nouvelleDate = new Date();
    setDateCourante(nouvelleDate);
    onDateChange(nouvelleDate);
  };

  // Formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Vérifier si c'est aujourd'hui
  const estAujourdhui = (date: Date) => {
    const aujourdhui = new Date();
    return date.toDateString() === aujourdhui.toDateString();
  };

  // Obtenir la couleur selon le mode de paiement
  const getCouleurPaiement = (modePaiement: Consultation["modePaiement"]) => {
    switch (modePaiement) {
      case "carte":
        return "#3b82f6";
      case "cheque":
        return "#8b5cf6";
      case "especes":
        return "#ef4444";
      default:
        return "#6b7280"; // 100%
    }
  };

  // Obtenir le libellé du mode de paiement
  const getLibellePaiement = (modePaiement: Consultation["modePaiement"]) => {
    switch (modePaiement) {
      case "carte":
        return "Carte";
      case "cheque":
        return "Chèque";
      case "especes":
        return "Espèces";
      default:
        return "100%";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agenda du jour
          </CardTitle>

          <div className="text-center">
          <h3 className="font-semibold text-slate-800">
            {formatDate(dateCourante)}
          </h3>
        </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={jourPrecedent}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant={estAujourdhui(dateCourante) ? "default" : "outline"}
              size="sm"
              onClick={aujourdhui}
            >
              Aujourd&apos;hui
            </Button>

            <Button variant="outline" size="sm" onClick={jourSuivant}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        
      </CardHeader>

      <CardContent>
        {/* Grille des créneaux */}
        <div className="border rounded-lg overflow-hidden">
          {heuresPrincipales.map((heurePrincipale) => {
            const creneauxDeLHeure = creneauxParHeure[heurePrincipale] || [];

            return (
              <div
                key={heurePrincipale}
                className="flex border-b last:border-b-0"
              >
                {/* Colonne Heure Principale */}
                <div className="w-20 shrink-0 border-r p-3 bg-slate-50">
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="font-bold text-slate-700 text-sm">
                      {heurePrincipale}
                    </span>
                  </div>
                </div>

                {/* Colonne Sous-créneaux (4 créneaux de 15min) */}
                <div className="flex-1">
                  <div className="grid grid-cols-4 divide-x">
                    {creneauxDeLHeure.map((creneau) => {
                      const consultationsCreneau =
                        consultationsParCreneau[creneau] || [];
                      const hasConsultations = consultationsCreneau.length > 0;

                      return (
                        <div
                          key={creneau}
                          className="p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => onCreateConsultation(creneau)}
                        >
                          {/* Indicateur du créneau (8h00, 8h15, etc.) */}
                          <div className="text-xs text-slate-500 text-center mb-1 border-b">
                            {creneau.split(":")[1]}
                          </div>

                          {/* Contenu des consultations */}
                          {hasConsultations && (
                            <div className="space-y-1">
                              {consultationsCreneau.map((consultation) => (
                                <div
                                  key={consultation.id}
                                  className="p-2 rounded border-l-2 cursor-pointer hover:shadow-sm transition-all text-xs"
                                  style={{
                                    borderLeftColor: getCouleurPaiement(
                                      consultation.modePaiement
                                    ),
                                    backgroundColor: `${getCouleurPaiement(
                                      consultation.modePaiement
                                    )}10`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditConsultation(consultation);
                                  }}
                                >
                                  <div className="flex justify-between">
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-800 truncate">
                                        {consultation.nomPatient}
                                      </div>
                                      <div className="text-slate-600 truncate">
                                        {consultation.motif}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <div className="text-slate-600">
                                        {
                                          // afficher seulement les premiers mots de la note afin de ne pas trop afficher
                                          consultation.notes &&
                                            consultation.notes
                                              ?.split(" ")
                                              .slice(0, 4)
                                              .join(" ") + "..."
                                        }
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-1">
                                      <div className="flex gap-2">
                                        <div className="font-semibold text-green-600">
                                          {consultation.montantTotal.toFixed(0)}
                                          €
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1"
                                          style={{
                                            backgroundColor: getCouleurPaiement(
                                              consultation.modePaiement
                                            ),
                                            filter: "brightness(150%)",
                                            color: "white",
                                          }}
                                        >
                                          {consultation.acteCode}
                                        </Badge>
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] mt-0.5 px-1"
                                        style={{
                                          backgroundColor: getCouleurPaiement(
                                            consultation.modePaiement
                                          ),
                                          color: "white",
                                        }}
                                      >
                                        {getLibellePaiement(
                                          consultation.modePaiement
                                        )}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende améliorée */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Carte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Chèque</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Espèces</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>100%</span>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              Cliquez sur un créneau vide pour ajouter une consultation
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
