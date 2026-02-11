import { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Scale,
  Users,
  Building2,
  Car,
  Calendar,
  FileText,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RetrocessionGuideProps {
  onClose?: () => void;
}

interface NegotiationFactor {
  id: string;
  label: string;
  description: string;
  impact: 'increase' | 'decrease';
  value: number; // Percentage impact
  icon: React.ElementType;
}

const negotiationFactors: NegotiationFactor[] = [
  {
    id: 'secretariat',
    label: 'Secrétariat inclus',
    description: 'Le cabinet dispose d\'un secrétariat qui gère les RDV',
    impact: 'decrease',
    value: 5,
    icon: Users,
  },
  {
    id: 'materiel',
    label: 'Matériel médical fourni',
    description: 'Équipements spécifiques mis à disposition (ECG, etc.)',
    impact: 'decrease',
    value: 3,
    icon: Building2,
  },
  {
    id: 'patientele',
    label: 'Patientèle établie',
    description: 'Cabinet avec patientèle fidèle et agenda rempli',
    impact: 'decrease',
    value: 5,
    icon: Users,
  },
  {
    id: 'rural',
    label: 'Zone rurale / sous-dotée',
    description: 'Déplacement important requis, zone en tension',
    impact: 'increase',
    value: 5,
    icon: Car,
  },
  {
    id: 'urgences',
    label: 'Gardes / Urgences',
    description: 'Remplacement incluant des gardes ou astreintes',
    impact: 'increase',
    value: 5,
    icon: AlertTriangle,
  },
  {
    id: 'duree',
    label: 'Remplacement long (> 1 mois)',
    description: 'Engagement sur une longue période',
    impact: 'increase',
    value: 3,
    icon: Calendar,
  },
  {
    id: 'experience',
    label: 'Expérience du remplaçant',
    description: 'Thèse récente vs plusieurs années d\'expérience',
    impact: 'increase',
    value: 3,
    icon: FileText,
  },
];

const tauxReference = {
  min: 60,
  moyen: 75,
  max: 100,
  median: 77,
};

const bonnesPratiques = [
  {
    titre: 'Avant la négociation',
    items: [
      'Renseignez-vous sur les taux pratiqués dans la région',
      'Identifiez les charges du cabinet (loyer, secrétariat, matériel)',
      'Préparez vos arguments (expérience, disponibilité, spécialités)',
      'Calculez votre seuil de rentabilité minimum',
    ],
  },
  {
    titre: 'Pendant la négociation',
    items: [
      'Posez des questions sur le fonctionnement du cabinet',
      'Demandez le détail des charges déduites de la rétrocession',
      'Négociez les conditions annexes (logement, frais de déplacement)',
      'Soyez transparent sur vos attentes et contraintes',
    ],
  },
  {
    titre: 'Points à clarifier',
    items: [
      'Base de calcul : CA brut ou après déduction de charges ?',
      'Fréquence de versement des rétrocessions',
      'Gestion des impayés et rejets CPAM',
      'Conditions en cas d\'annulation du remplacement',
    ],
  },
];

const erreursCourantes = [
  {
    erreur: 'Accepter sans négocier',
    conseil: 'Les taux sont toujours négociables, surtout en zone sous-dotée',
  },
  {
    erreur: 'Ignorer les charges réelles',
    conseil: 'Un taux de 70% avec secrétariat peut valoir plus qu\'un 80% sans',
  },
  {
    erreur: 'Ne pas formaliser par écrit',
    conseil: 'Toujours signer un contrat de remplacement détaillé',
  },
  {
    erreur: 'Oublier les frais annexes',
    conseil: 'Négociez aussi l\'hébergement et les frais de déplacement',
  },
];

const sources = [
  {
    titre: 'Ordre des Médecins - Contrat de remplacement',
    url: 'https://www.conseil-national.medecin.fr/documents-types-demarches/documents-types-medecins/cabinet-carriere/contrat-remplacement-liberal',
    description: 'Modèle de contrat type et recommandations déontologiques',
  },
  {
    titre: 'CARMF - Statut du remplaçant',
    url: 'https://www.carmf.fr/page.php?page=chiffrescles/stats/secteur',
    description: 'Statistiques sur les revenus des médecins',
  },
  {
    titre: 'URSSAF - Médecins remplaçants',
    url: 'https://www.urssaf.fr/portail/home/praticien-et-auxiliaire-medical/medecin/remplacant.html',
    description: 'Obligations sociales et fiscales des remplaçants',
  },
];

export function RetrocessionGuide({ onClose }: RetrocessionGuideProps) {
  const [caJournalier, setCaJournalier] = useState(800);
  const [tauxBase, setTauxBase] = useState(77);
  const [activeFactors, setActiveFactors] = useState<Set<string>>(new Set());

  const toggleFactor = (id: string) => {
    const newFactors = new Set(activeFactors);
    if (newFactors.has(id)) {
      newFactors.delete(id);
    } else {
      newFactors.add(id);
    }
    setActiveFactors(newFactors);
  };

  const calculations = useMemo(() => {
    let adjustedRate = tauxBase;
    
    negotiationFactors.forEach(factor => {
      if (activeFactors.has(factor.id)) {
        if (factor.impact === 'increase') {
          adjustedRate += factor.value;
        } else {
          adjustedRate -= factor.value;
        }
      }
    });

    // Clamp between reasonable bounds
    adjustedRate = Math.max(55, Math.min(100, adjustedRate));

    const retrocessionJournaliere = caJournalier * (adjustedRate / 100);
    const partCabinet = caJournalier - retrocessionJournaliere;
    const retrocessionMensuelle = retrocessionJournaliere * 20; // ~20 jours travaillés
    const retrocessionAnnuelle = retrocessionMensuelle * 11; // ~11 mois

    return {
      adjustedRate,
      retrocessionJournaliere,
      partCabinet,
      retrocessionMensuelle,
      retrocessionAnnuelle,
    };
  }, [caJournalier, tauxBase, activeFactors]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const getRateColor = (rate: number) => {
    if (rate >= 85) return 'text-success';
    if (rate >= 75) return 'text-primary';
    if (rate >= 65) return 'text-warning';
    return 'text-destructive';
  };

  const getRateLabel = (rate: number) => {
    if (rate >= 90) return { label: 'Exceptionnel', color: 'bg-success/20 text-success' };
    if (rate >= 82) return { label: 'Très favorable', color: 'bg-success/10 text-success' };
    if (rate >= 75) return { label: 'Favorable', color: 'bg-primary/10 text-primary' };
    if (rate >= 65) return { label: 'Standard', color: 'bg-warning/10 text-warning' };
    return { label: 'Bas', color: 'bg-destructive/10 text-destructive' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Scale className="w-6 h-6 text-primary" />
          Guide du taux de rétrocession
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Calculez et négociez votre taux de rétrocession de manière éclairée
        </p>
      </div>

      {/* Introduction */}
      <Card className="border-info/30 bg-info/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-info mb-1">Qu'est-ce que la rétrocession ?</p>
            <p className="text-sm text-muted-foreground">
              La rétrocession est le pourcentage du chiffre d'affaires que le médecin remplacé 
              reverse au remplaçant. Elle couvre généralement <strong>70%</strong> du CA, 
              le reste servant à financer les charges du cabinet (loyer, secrétariat, matériel...).
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calculateur" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="calculateur">Calculateur</TabsTrigger>
          <TabsTrigger value="negociation">Négociation</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        {/* Calculateur Tab */}
        <TabsContent value="calculateur" className="space-y-6">
          {/* Reference rates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Taux de référence du marché
              </CardTitle>
              <CardDescription>
                Fourchette des taux pratiqués en France métropolitaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Minimum</span>
                <span className="text-sm text-muted-foreground">Médian</span>
                <span className="text-sm text-muted-foreground">Maximum</span>
              </div>
              <div className="relative h-3 bg-gradient-to-r from-destructive/30 via-primary/30 to-success/30 rounded-full">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-sm"
                  style={{ left: `${((calculations.adjustedRate - 55) / 40) * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium">{tauxReference.min}%</span>
                <span className="text-sm font-medium">{tauxReference.median}%</span>
                <span className="text-sm font-medium">{tauxReference.max}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Calculator inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Simulateur de rétrocession
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CA journalier */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    CA journalier moyen estimé
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Chiffre d'affaires quotidien moyen du cabinet. 
                          Généralement entre 600€ et 1200€ selon la spécialité et la zone.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <span className="text-lg font-bold text-primary">{formatCurrency(caJournalier)} €</span>
                </div>
                <Slider
                  value={[caJournalier]}
                  onValueChange={(value) => setCaJournalier(value[0])}
                  min={400}
                  max={1500}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>400 €</span>
                  <span>1 500 €</span>
                </div>
              </div>

              {/* Taux de base */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Taux de base proposé</Label>
                  <span className={cn("text-lg font-bold", getRateColor(tauxBase))}>{tauxBase}%</span>
                </div>
                <Slider
                  value={[tauxBase]}
                  onValueChange={(value) => setTauxBase(value[0])}
                  min={55}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>55%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Adjustment factors */}
              <div className="space-y-3">
                <Label>Facteurs d'ajustement</Label>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez les éléments qui s'appliquent à votre situation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {negotiationFactors.map((factor) => {
                    const isActive = activeFactors.has(factor.id);
                    const Icon = factor.icon;
                    return (
                      <button
                        key={factor.id}
                        onClick={() => toggleFactor(factor.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                          isActive
                            ? factor.impact === 'increase'
                              ? "border-success bg-success/10"
                              : "border-warning bg-warning/10"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          isActive
                            ? factor.impact === 'increase'
                              ? "bg-success/20"
                              : "bg-warning/20"
                            : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            isActive
                              ? factor.impact === 'increase'
                                ? "text-success"
                                : "text-warning"
                              : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium text-sm",
                              isActive && "text-foreground"
                            )}>
                              {factor.label}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs shrink-0",
                                factor.impact === 'increase' 
                                  ? "text-success border-success/50" 
                                  : "text-warning border-warning/50"
                              )}
                            >
                              {factor.impact === 'increase' ? '+' : '-'}{factor.value}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {factor.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="rounded-xl gradient-primary p-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/80">Taux ajusté recommandé</p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold">{calculations.adjustedRate}%</p>
                  <Badge className={getRateLabel(calculations.adjustedRate).color}>
                    {getRateLabel(calculations.adjustedRate).label}
                  </Badge>
                </div>
              </div>
              <Scale className="w-12 h-12 text-primary-foreground/30" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary-foreground/20">
              <div>
                <p className="text-primary-foreground/60 text-xs">Rétrocession/jour</p>
                <p className="font-semibold">{formatCurrency(calculations.retrocessionJournaliere)} €</p>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs">Part cabinet/jour</p>
                <p className="font-semibold">{formatCurrency(calculations.partCabinet)} €</p>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs">Estimation/mois</p>
                <p className="font-semibold">{formatCurrency(calculations.retrocessionMensuelle)} €</p>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs">Estimation/an</p>
                <p className="font-semibold">{formatCurrency(calculations.retrocessionAnnuelle)} €</p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning mb-1">Attention aux charges cachées</p>
                <p className="text-muted-foreground">
                  Le taux de rétrocession ne fait pas tout. Vérifiez si les charges suivantes sont 
                  incluses ou à votre charge : secrétariat, logiciels métier, consommables, 
                  ménage, maintenance...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Négociation Tab */}
        <TabsContent value="negociation" className="space-y-6">
          {/* Bonnes pratiques */}
          {bonnesPratiques.map((section, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  {section.titre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Erreurs courantes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Erreurs courantes à éviter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {erreursCourantes.map((item, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 border-l-4 border-warning"
                  >
                    <p className="font-medium text-sm text-warning">{item.erreur}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      → {item.conseil}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Arguments de négociation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Arguments pour négocier à la hausse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="font-medium text-sm text-success mb-1">Votre valeur ajoutée</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Expérience en médecine générale</li>
                    <li>• Compétences spécifiques (pédiatrie, gynéco...)</li>
                    <li>• Disponibilité et flexibilité</li>
                    <li>• Références d'autres cabinets</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="font-medium text-sm text-success mb-1">Contexte favorable</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Zone en tension / désert médical</li>
                    <li>• Période de forte demande (été, hiver)</li>
                    <li>• Remplacement long durée</li>
                    <li>• Pas de secrétariat / faibles charges</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contrat type */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex gap-3">
              <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">
                  Toujours formaliser par un contrat écrit
                </p>
                <p className="text-sm text-muted-foreground">
                  Le Conseil de l'Ordre des Médecins propose un modèle de contrat de remplacement 
                  qui détaille les obligations de chaque partie, le taux de rétrocession, et les 
                  conditions d'exercice.
                </p>
                <a
                  href="https://www.conseil-national.medecin.fr/documents-types-demarches/documents-types-medecins/cabinet-carriere/contrat-remplacement-liberal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  Télécharger le modèle de contrat
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Sources officielles
              </CardTitle>
              <CardDescription>
                Documentation de référence pour les médecins remplaçants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.map((source) => (
                <a
                  key={source.titre}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {source.titre}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {source.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="border-info/30 bg-info/5">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-info mb-1">Statistiques indicatives</p>
                <p className="text-sm text-muted-foreground">
                  Les taux de rétrocession mentionnés sont des moyennes constatées et peuvent varier 
                  significativement selon les régions, les spécialités et les accords individuels. 
                  Ils ne constituent pas une norme réglementaire.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
