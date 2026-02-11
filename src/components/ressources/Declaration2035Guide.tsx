import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  ChevronDown, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calculator,
  Calendar,
  Building,
  Receipt,
  Wallet,
  Car,
  Home,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Declaration2035GuideProps {
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

interface FormCase {
  numero: string;
  intitule: string;
  description: string;
  exemple?: string;
  conseil?: string;
}

const etapes = [
  {
    id: 'preparation',
    titre: 'Préparation',
    icon: Calendar,
    description: 'Rassemblez tous vos documents avant de commencer',
    checklist: [
      { id: 'releves', label: 'Relevés bancaires professionnels de l\'année', description: 'Tous les mois de janvier à décembre' },
      { id: 'factures', label: 'Factures de vos charges professionnelles', description: 'Classées par catégorie' },
      { id: 'recettes', label: 'Récapitulatif de vos recettes (rétrocessions)', description: 'Virements reçus des cabinets' },
      { id: 'cotisations', label: 'Attestations URSSAF et CARMF', description: 'Cotisations payées sur l\'année' },
      { id: 'immobilisations', label: 'Tableau des immobilisations et amortissements', description: 'Si vous avez du matériel professionnel' },
      { id: 'km', label: 'Relevé kilométrique professionnel', description: 'Si vous utilisez le barème kilométrique' },
    ],
  },
  {
    id: 'page1',
    titre: 'Page 1 - Identification',
    icon: Building,
    description: 'Informations générales sur votre activité',
    cases: [
      { numero: 'AA', intitule: 'Nom et prénom', description: 'Votre identité complète', exemple: 'Dr MARTIN Jean' },
      { numero: 'AB', intitule: 'Adresse professionnelle', description: 'Adresse du cabinet ou domicile si remplaçant', exemple: '15 rue de la Santé, 75013 Paris' },
      { numero: 'AC', intitule: 'N° SIRET', description: 'Numéro à 14 chiffres', exemple: '123 456 789 00012' },
      { numero: 'AD', intitule: 'Code APE/NAF', description: 'Généralement 8621Z pour les médecins', exemple: '8621Z' },
      { numero: 'AE', intitule: 'Date de début d\'activité', description: 'Date de votre première inscription', conseil: 'Vérifiez sur votre certificat d\'inscription à l\'Ordre' },
    ],
  },
  {
    id: 'recettes',
    titre: 'Cadre A - Recettes',
    icon: Wallet,
    description: 'Déclaration de vos revenus professionnels',
    cases: [
      { 
        numero: 'AA', 
        intitule: 'Recettes encaissées', 
        description: 'Total des sommes reçues sur l\'année civile (virements des cabinets)', 
        exemple: '45 000 €',
        conseil: 'Comptez les virements reçus entre le 1er janvier et le 31 décembre, quelle que soit la date du remplacement'
      },
      { 
        numero: 'AB', 
        intitule: 'Recettes conventionnées', 
        description: 'Part des honoraires conventionnés secteur 1', 
        exemple: '40 000 €' 
      },
      { 
        numero: 'AC', 
        intitule: 'Recettes hors convention', 
        description: 'Honoraires libres, dépassements', 
        exemple: '5 000 €' 
      },
      { 
        numero: 'AG', 
        intitule: 'Gains divers', 
        description: 'Remboursements de frais, indemnités diverses', 
        exemple: '500 €' 
      },
    ],
  },
  {
    id: 'depenses',
    titre: 'Cadre B - Dépenses',
    icon: Receipt,
    description: 'Vos charges professionnelles déductibles',
    cases: [
      { 
        numero: 'BA', 
        intitule: 'Achats', 
        description: 'Fournitures, petit matériel médical < 500€ HT', 
        exemple: '800 €',
        conseil: 'Conservez toutes les factures pendant 6 ans'
      },
      { 
        numero: 'BB', 
        intitule: 'Frais de personnel', 
        description: 'Salaires et charges si vous employez du personnel', 
        exemple: '0 €' 
      },
      { 
        numero: 'BC', 
        intitule: 'Loyer et charges', 
        description: 'Loyer du cabinet ou quote-part professionnelle du domicile', 
        exemple: '3 600 €',
        conseil: 'Calculez la quote-part selon la surface professionnelle/surface totale'
      },
      { 
        numero: 'BD', 
        intitule: 'Location de matériel', 
        description: 'Leasing, location de véhicule professionnel', 
        exemple: '0 €' 
      },
      { 
        numero: 'BE', 
        intitule: 'Entretien et réparations', 
        description: 'Maintenance du matériel, réparations', 
        exemple: '200 €' 
      },
      { 
        numero: 'BF', 
        intitule: 'Frais de véhicule', 
        description: 'Barème kilométrique OU frais réels (pas les deux)', 
        exemple: '4 500 €',
        conseil: 'Le barème kilométrique 2024 est souvent plus avantageux'
      },
      { 
        numero: 'BG', 
        intitule: 'Autres frais de déplacement', 
        description: 'Train, avion, parking, péages professionnels', 
        exemple: '600 €' 
      },
      { 
        numero: 'BH', 
        intitule: 'Charges sociales personnelles', 
        description: 'URSSAF, CARMF, assurance maladie', 
        exemple: '8 500 €',
        conseil: 'Incluez toutes les cotisations payées dans l\'année'
      },
      { 
        numero: 'BJ', 
        intitule: 'Frais de réception', 
        description: 'Repas d\'affaires (avec justificatifs et motif)', 
        exemple: '300 €' 
      },
      { 
        numero: 'BK', 
        intitule: 'Fournitures de bureau', 
        description: 'Papeterie, cartouches, petit équipement informatique', 
        exemple: '400 €' 
      },
      { 
        numero: 'BM', 
        intitule: 'Frais d\'actes et de contentieux', 
        description: 'Honoraires avocat, huissier (si professionnel)', 
        exemple: '0 €' 
      },
      { 
        numero: 'BN', 
        intitule: 'Cotisation syndicale', 
        description: 'Adhésion syndicat professionnel', 
        exemple: '200 €' 
      },
      { 
        numero: 'BP', 
        intitule: 'Autres impôts', 
        description: 'CFE (Cotisation Foncière des Entreprises)', 
        exemple: '500 €',
        conseil: 'La CFE est exonérée la première année d\'activité'
      },
      { 
        numero: 'BQ', 
        intitule: 'Frais financiers', 
        description: 'Intérêts d\'emprunt professionnel, agios', 
        exemple: '0 €' 
      },
      { 
        numero: 'BR', 
        intitule: 'Pertes diverses', 
        description: 'Créances irrécouvrables', 
        exemple: '0 €' 
      },
      { 
        numero: 'BS', 
        intitule: 'Frais divers de gestion', 
        description: 'Téléphone (quote-part), internet, abonnements pro', 
        exemple: '1 200 €' 
      },
    ],
  },
  {
    id: 'resultat',
    titre: 'Cadre C - Résultat',
    icon: Calculator,
    description: 'Calcul de votre bénéfice imposable',
    cases: [
      { 
        numero: 'CA', 
        intitule: 'Total des recettes', 
        description: 'Report du total du cadre A', 
        exemple: '45 500 €' 
      },
      { 
        numero: 'CB', 
        intitule: 'Total des dépenses', 
        description: 'Report du total du cadre B', 
        exemple: '20 800 €' 
      },
      { 
        numero: 'CC', 
        intitule: 'Bénéfice', 
        description: 'Recettes - Dépenses (si positif)', 
        exemple: '24 700 €',
        conseil: 'Ce montant sera reporté sur votre déclaration 2042 C PRO'
      },
      { 
        numero: 'CD', 
        intitule: 'Déficit', 
        description: 'Recettes - Dépenses (si négatif)', 
        exemple: '0 €',
        conseil: 'Un déficit peut être reporté sur les années suivantes'
      },
    ],
  },
  {
    id: 'annexes',
    titre: 'Annexes obligatoires',
    icon: FileText,
    description: 'Documents à joindre à votre déclaration',
    checklist: [
      { id: '2035-a', label: 'Annexe 2035-A : Compte de résultat fiscal', description: 'Détail des recettes et dépenses' },
      { id: '2035-b', label: 'Annexe 2035-B : Tableau des immobilisations', description: 'Si vous avez du matériel > 500€ HT' },
      { id: '2035-e', label: 'Annexe 2035-E : TVA (si assujetti)', description: 'Uniquement si vous dépassez les seuils de franchise' },
      { id: 'ogbnc', label: 'Attestation OGA/AGA', description: 'Pour bénéficier de la non-majoration de 10%' },
    ],
  },
];

const sources = [
  {
    titre: 'BOFiP - Bénéfices Non Commerciaux',
    url: 'https://bofip.impots.gouv.fr/bofip/4622-PGP.html/identifiant%3DBOI-BNC-20220601',
    description: 'Base officielle des impôts - Règles de détermination du résultat BNC',
  },
  {
    titre: 'Notice officielle 2035',
    url: 'https://www.impots.gouv.fr/formulaire/2035/declaration-des-benefices-non-commerciaux',
    description: 'Formulaire et notice explicative du Ministère des Finances',
  },
  {
    titre: 'CGI - Article 93',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042907461',
    description: 'Code Général des Impôts - Détermination des bénéfices imposables',
  },
  {
    titre: 'Barème kilométrique 2024',
    url: 'https://www.service-public.fr/particuliers/actualites/A16555',
    description: 'Barème officiel des frais kilométriques - Service-Public.fr',
  },
  {
    titre: 'Délais de déclaration',
    url: 'https://www.impots.gouv.fr/professionnel/le-calendrier-des-professionnels',
    description: 'Calendrier fiscal des professionnels - impots.gouv.fr',
  },
];

export function Declaration2035Guide({ onClose }: Declaration2035GuideProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['preparation']));

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const toggleSection = (id: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenSections(newOpen);
  };

  const getProgress = () => {
    const allItems = etapes.flatMap(e => e.checklist || []).map(c => c.id);
    if (allItems.length === 0) return 0;
    return Math.round((checkedItems.size / allItems.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Guide Déclaration 2035
        </h1>
        <p className="text-muted-foreground mt-2">
          Guide étape par étape pour remplir votre déclaration de revenus BNC
        </p>
      </div>

      {/* Important notice */}
      <Card className="border-warning/50 bg-warning/10">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Dates limites 2024</p>
            <p className="text-sm text-muted-foreground">
              Pour les revenus 2024, la déclaration 2035 doit être déposée au plus tard le <strong>3ème jour ouvré suivant le 1er mai 2025</strong> (en pratique, début mai).
              La télédéclaration est obligatoire.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="etapes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="etapes">Étapes & Cases</TabsTrigger>
          <TabsTrigger value="conseils">Conseils pratiques</TabsTrigger>
          <TabsTrigger value="sources">Sources officielles</TabsTrigger>
        </TabsList>

        <TabsContent value="etapes" className="space-y-4">
          {/* Progress bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression de votre checklist</span>
                <span className="text-sm text-muted-foreground">{getProgress()}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          {etapes.map((etape, index) => (
            <Collapsible
              key={etape.id}
              open={openSections.has(etape.id)}
              onOpenChange={() => toggleSection(etape.id)}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10">
                          <etape.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{etape.titre}</CardTitle>
                          <CardDescription>{etape.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        openSections.has(etape.id) && "rotate-180"
                      )} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Checklist items */}
                    {etape.checklist && (
                      <div className="space-y-3">
                        {etape.checklist.map((item) => (
                          <label
                            key={item.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              checkedItems.has(item.id) 
                                ? "border-primary/50 bg-primary/5" 
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={checkedItems.has(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <span className={cn(
                                "font-medium",
                                checkedItems.has(item.id) && "line-through text-muted-foreground"
                              )}>
                                {item.label}
                              </span>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {checkedItems.has(item.id) && (
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Form cases */}
                    {etape.cases && (
                      <div className="space-y-3">
                        {etape.cases.map((caseItem) => (
                          <div 
                            key={caseItem.numero}
                            className="p-4 rounded-lg border border-border bg-card"
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="font-mono text-sm shrink-0">
                                {caseItem.numero}
                              </Badge>
                              <div className="flex-1">
                                <h4 className="font-semibold">{caseItem.intitule}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {caseItem.description}
                                </p>
                                {caseItem.exemple && (
                                  <p className="text-sm mt-2">
                                    <span className="text-muted-foreground">Exemple : </span>
                                    <span className="font-medium">{caseItem.exemple}</span>
                                  </p>
                                )}
                                {caseItem.conseil && (
                                  <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                                    <p className="text-xs flex items-start gap-1.5">
                                      <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                                      <span>{caseItem.conseil}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="conseils" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Remplaçant : Spécificités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold">Adresse professionnelle</h4>
                <p className="text-sm text-muted-foreground">
                  En tant que remplaçant sans cabinet fixe, vous pouvez indiquer votre adresse personnelle comme adresse professionnelle. 
                  Cela vous permet de déduire une quote-part de vos charges de logement.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold">Rétrocessions = Recettes</h4>
                <p className="text-sm text-muted-foreground">
                  Vos recettes sont les <strong>virements reçus</strong> des médecins que vous remplacez, 
                  pas le chiffre d'affaires du cabinet. Comptabilisez uniquement ce qui est arrivé sur votre compte bancaire.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Frais de véhicule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold">Barème kilométrique vs Frais réels</h4>
                <p className="text-sm text-muted-foreground">
                  Vous devez choisir l'un OU l'autre, pas les deux. Le barème kilométrique est souvent plus simple et avantageux 
                  pour les remplaçants qui font beaucoup de kilomètres.
                </p>
                <div className="mt-3 p-3 bg-primary/5 rounded border border-primary/20">
                  <p className="text-xs">
                    <strong>💡 Astuce :</strong> Tenez un carnet de bord avec la date, le déplacement (départ/arrivée) et le nombre de km. 
                    C'est obligatoire pour justifier vos frais en cas de contrôle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                OGA/AGA : Association de Gestion Agréée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold">Pourquoi adhérer ?</h4>
                <p className="text-sm text-muted-foreground">
                  L'adhésion à un OGA (Organisme de Gestion Agréé) ou AGA vous permet d'éviter la majoration de 10% 
                  sur votre bénéfice imposable. Le coût d'adhésion (200-300€/an) est déductible.
                </p>
                <div className="mt-3 p-3 bg-warning/10 rounded border border-warning/30">
                  <p className="text-xs text-warning">
                    <strong>⚠️ Important :</strong> Vous devez adhérer dans les 5 mois suivant le début de votre activité 
                    pour bénéficier de l'avantage dès la première année.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Erreurs fréquentes à éviter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✗</span>
                  <span className="text-sm">Déclarer les honoraires facturés au lieu des sommes encaissées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✗</span>
                  <span className="text-sm">Mélanger barème km et frais réels de véhicule</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✗</span>
                  <span className="text-sm">Oublier de déduire les cotisations CARMF et URSSAF</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✗</span>
                  <span className="text-sm">Ne pas justifier la quote-part professionnelle du domicile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-sm">Conserver tous les justificatifs pendant 6 ans</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Sources officielles
              </CardTitle>
              <CardDescription>
                Textes de référence et documentation officielle
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
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      {source.url}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Télédéclaration obligatoire</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Depuis 2020, tous les professionnels doivent télédéclarer leur liasse fiscale 2035 via le site 
                    <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-1">
                      impots.gouv.fr
                    </a>
                    ou un logiciel agréé (mode EDI).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
