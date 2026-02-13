import { useState } from 'react';
import { 
  Search, 
  Car, 
  Home, 
  Laptop, 
  GraduationCap, 
  Shield, 
  Phone, 
  Briefcase,
  FileText,
  ExternalLink,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeductibleItem {
  name: string;
  description: string;
  examples: string[];
  deductionType: 'total' | 'partial' | 'forfait';
  deductionDetails?: string;
  conditions?: string[];
  notDeductible?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  items: DeductibleItem[];
}

const categories: Category[] = [
  {
    id: 'transport',
    name: 'Frais de déplacement',
    icon: Car,
    color: 'text-info',
    items: [
      {
        name: 'Véhicule professionnel',
        description: 'Frais liés à l\'utilisation d\'un véhicule pour l\'activité professionnelle',
        examples: [
          'Carburant',
          'Entretien et réparations',
          'Assurance auto',
          'Location ou crédit-bail',
          'Péages',
          'Stationnement professionnel'
        ],
        deductionType: 'partial',
        deductionDetails: 'Au prorata de l\'usage professionnel. Option : barème kilométrique de l\'administration fiscale.',
        conditions: [
          'Tenir un carnet de bord des déplacements professionnels',
          'Conserver les justificatifs (factures, tickets)'
        ],
        notDeductible: [
          'Trajets domicile-travail habituels (sauf cas particuliers)',
          'Amendes et contraventions'
        ]
      },
      {
        name: 'Transports en commun',
        description: 'Billets de train, avion, métro pour déplacements professionnels',
        examples: [
          'Billets de train pour formations',
          'Billets d\'avion pour congrès',
          'Abonnements transports (quote-part pro)'
        ],
        deductionType: 'total',
        conditions: ['Justificatifs obligatoires', 'Motif professionnel documenté']
      },
      {
        name: 'Frais de mission',
        description: 'Dépenses lors de déplacements professionnels',
        examples: [
          'Hôtel lors de formations/congrès',
          'Repas en déplacement',
          'Frais de parking'
        ],
        deductionType: 'total',
        deductionDetails: 'Frais réels sur justificatifs ou forfaits selon barème URSSAF',
        conditions: ['Conserver tous les justificatifs', 'Déplacement à plus de 50 km ou 1h30 du domicile']
      }
    ]
  },
  {
    id: 'local',
    name: 'Local professionnel',
    icon: Home,
    color: 'text-success',
    items: [
      {
        name: 'Loyer du local professionnel',
        description: 'Location d\'un cabinet ou espace de travail dédié',
        examples: [
          'Loyer mensuel du cabinet',
          'Charges locatives',
          'Taxe foncière (si propriétaire)'
        ],
        deductionType: 'total',
        conditions: ['Bail professionnel ou clause d\'exercice dans bail habitation']
      },
      {
        name: 'Usage mixte (domicile)',
        description: 'Utilisation d\'une partie du domicile pour l\'activité',
        examples: [
          'Quote-part du loyer',
          'Quote-part des charges (électricité, chauffage)',
          'Quote-part de la taxe d\'habitation',
          'Quote-part de l\'assurance habitation'
        ],
        deductionType: 'partial',
        deductionDetails: 'Déduction au prorata de la surface professionnelle (généralement 10-20%)',
        conditions: [
          'Pièce dédiée à l\'activité professionnelle',
          'Calcul de la quote-part justifiable'
        ]
      },
      {
        name: 'Aménagement et entretien',
        description: 'Travaux et entretien du local professionnel',
        examples: [
          'Peinture et rénovation',
          'Ménage professionnel',
          'Petites réparations'
        ],
        deductionType: 'total',
        deductionDetails: 'Gros travaux : amortissables sur plusieurs années'
      }
    ]
  },
  {
    id: 'materiel',
    name: 'Matériel et équipement',
    icon: Laptop,
    color: 'text-warning',
    items: [
      {
        name: 'Matériel informatique',
        description: 'Ordinateurs, imprimantes et accessoires',
        examples: [
          'Ordinateur portable/fixe',
          'Imprimante, scanner',
          'Écran, clavier, souris',
          'Disque dur externe',
          'Logiciels professionnels'
        ],
        deductionType: 'total',
        deductionDetails: 'Moins de 500€ HT : déduction immédiate. Plus de 500€ HT : amortissement sur 3 ans',
        conditions: ['Usage professionnel majoritaire']
      },
      {
        name: 'Matériel médical',
        description: 'Équipement spécifique à l\'exercice médical',
        examples: [
          'Stéthoscope',
          'Tensiomètre',
          'Otoscope',
          'Mallette médicale',
          'Consommables médicaux'
        ],
        deductionType: 'total'
      },
      {
        name: 'Mobilier professionnel',
        description: 'Meubles et équipement du cabinet',
        examples: [
          'Bureau et chaise',
          'Armoire de rangement',
          'Table d\'examen',
          'Salle d\'attente (chaises, table)'
        ],
        deductionType: 'total',
        deductionDetails: 'Amortissement sur 5-10 ans selon le type de meuble'
      },
      {
        name: 'Téléphonie et internet',
        description: 'Abonnements et matériel de communication',
        examples: [
          'Abonnement téléphone professionnel',
          'Abonnement internet (quote-part pro)',
          'Téléphone portable professionnel'
        ],
        deductionType: 'partial',
        deductionDetails: 'Usage mixte : déduction au prorata de l\'usage professionnel (souvent 50-70%)'
      }
    ]
  },
  {
    id: 'formation',
    name: 'Formation et documentation',
    icon: GraduationCap,
    color: 'text-primary',
    items: [
      {
        name: 'Formation continue',
        description: 'DPC, formations médicales obligatoires et facultatives',
        examples: [
          'Frais d\'inscription DPC',
          'Formations médicales',
          'Congrès et séminaires',
          'E-learning professionnel'
        ],
        deductionType: 'total',
        conditions: ['Formation en lien avec l\'activité professionnelle']
      },
      {
        name: 'Documentation professionnelle',
        description: 'Livres, revues et ressources documentaires',
        examples: [
          'Abonnements revues médicales',
          'Livres et manuels médicaux',
          'Bases de données médicales (Vidal, etc.)',
          'Abonnement à des sites professionnels'
        ],
        deductionType: 'total'
      }
    ]
  },
  {
    id: 'assurances',
    name: 'Assurances et cotisations',
    icon: Shield,
    color: 'text-destructive',
    items: [
      {
        name: 'Assurance RCP',
        description: 'Responsabilité Civile Professionnelle obligatoire',
        examples: [
          'Prime RCP annuelle'
        ],
        deductionType: 'total'
      },
      {
        name: 'Cotisations professionnelles',
        description: 'Cotisations obligatoires et facultatives',
        examples: [
          'Cotisation Ordre des Médecins',
          'Cotisation AGA (Association de Gestion Agréée)',
          'Cotisation syndicale'
        ],
        deductionType: 'total'
      },
      {
        name: 'Prévoyance et retraite facultative',
        description: 'Contrats Madelin et assurances complémentaires',
        examples: [
          'Contrat Madelin retraite',
          'Contrat Madelin prévoyance',
          'Mutuelle loi Madelin'
        ],
        deductionType: 'partial',
        deductionDetails: 'Déductible dans la limite des plafonds fiscaux (environ 10% du bénéfice)',
        conditions: ['Contrat éligible loi Madelin', 'Respecter les plafonds annuels']
      }
    ]
  },
  {
    id: 'services',
    name: 'Services et honoraires',
    icon: Briefcase,
    color: 'text-accent',
    items: [
      {
        name: 'Comptabilité',
        description: 'Frais de tenue de comptabilité',
        examples: [
          'Honoraires expert-comptable',
          'Logiciel de comptabilité',
          'Frais AGA'
        ],
        deductionType: 'total',
        deductionDetails: 'Réduction d\'impôt supplémentaire possible si adhésion AGA (2/3 des frais, max 915€)'
      },
      {
        name: 'Services bancaires',
        description: 'Frais liés au compte professionnel',
        examples: [
          'Frais de tenue de compte pro',
          'Commissions sur paiements CB',
          'Intérêts d\'emprunt professionnel'
        ],
        deductionType: 'total',
        conditions: ['Compte dédié à l\'activité professionnelle']
      },
      {
        name: 'Secrétariat et services',
        description: 'Externalisation de tâches administratives',
        examples: [
          'Secrétariat téléphonique',
          'Télésecrétariat médical',
          'Services de ménage du cabinet'
        ],
        deductionType: 'total'
      }
    ]
  },
  {
    id: 'divers',
    name: 'Fournitures et divers',
    icon: FileText,
    color: 'text-muted-foreground',
    items: [
      {
        name: 'Fournitures de bureau',
        description: 'Consommables et petites fournitures',
        examples: [
          'Papier, stylos, classeurs',
          'Cartouches d\'encre',
          'Enveloppes, timbres',
          'Ordonnances, tampons'
        ],
        deductionType: 'total'
      },
      {
        name: 'Frais postaux et bancaires',
        description: 'Envois et communications',
        examples: [
          'Affranchissement courriers',
          'Envois recommandés',
          'Frais d\'encaissement chèques'
        ],
        deductionType: 'total'
      },
      {
        name: 'Vêtements professionnels',
        description: 'Tenue spécifique à l\'exercice médical',
        examples: [
          'Blouses blanches',
          'Chaussures médicales',
          'Entretien/blanchisserie des blouses'
        ],
        deductionType: 'total',
        conditions: ['Vêtements spécifiquement professionnels'],
        notDeductible: ['Vêtements de ville, même portés au travail']
      }
    ]
  }
];

const officialSources = [
  {
    name: 'BOFiP - Bulletin Officiel des Finances Publiques',
    description: 'Documentation officielle sur les charges déductibles BNC',
    url: 'https://bofip.impots.gouv.fr/bofip/4653-PGP.html/identifiant=BOI-BNC-BASE-40-20160706'
  },
  {
    name: 'impots.gouv.fr - Professionnels libéraux',
    description: 'Guide des obligations fiscales des professions libérales',
    url: 'https://www.impots.gouv.fr/professionnel/les-benefices-non-commerciaux-bnc'
  },
  {
    name: 'URSSAF - Frais professionnels',
    description: 'Barèmes et limites d\'exonération des frais professionnels',
    url: 'https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels.html'
  },
  {
    name: 'Service-Public.fr - Déclaration BNC',
    description: 'Informations générales sur la déclaration des BNC',
    url: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F32105'
  }
];

interface FraisDeductiblesProps {
  onClose?: () => void;
}

export function FraisDeductibles({ onClose }: FraisDeductiblesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.examples.some(ex => ex.toLowerCase().includes(searchLower))
      );
    })
  })).filter(category => category.items.length > 0);

  const getDeductionBadge = (type: DeductibleItem['deductionType']) => {
    switch (type) {
      case 'total':
        return <Badge className="bg-success/20 text-success border-success/30">100% déductible</Badge>;
      case 'partial':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Partiellement déductible</Badge>;
      case 'forfait':
        return <Badge className="bg-info/20 text-info border-info/30">Forfait applicable</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Frais déductibles
          </h2>
          <p className="text-muted-foreground text-sm">
            Guide complet des charges professionnelles déductibles en BNC
          </p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>

      {/* Introduction */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary mb-2">Principe de déductibilité</h3>
            <p className="text-sm text-muted-foreground mb-3">
              En régime <strong>Réel (déclaration 2035)</strong>, vous pouvez déduire de votre chiffre d'affaires 
              toutes les dépenses <strong>nécessaires à l'exercice de votre profession</strong>, justifiées et 
              engagées dans l'intérêt de l'activité.
            </p>
            <p className="text-sm text-muted-foreground">
              En <strong>Micro-BNC</strong>, vous bénéficiez d'un abattement forfaitaire de 34% qui couvre 
              l'ensemble de vos charges - vous ne pouvez donc pas déduire vos frais réels.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un frais déductible..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setExpandedCategories(categories.map(c => c.id))}
        >
          Tout déplier
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setExpandedCategories([]);
            setExpandedItems([]);
          }}
        >
          Tout replier
        </Button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const Icon = category.icon;
          
          return (
            <div 
              key={category.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-muted", category.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.items.length} type{category.items.length > 1 ? 's' : ''} de frais
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Category items */}
              {isExpanded && (
                <div className="border-t border-border">
                  {category.items.map((item, index) => {
                    const itemId = `${category.id}-${index}`;
                    const isItemExpanded = expandedItems.includes(itemId);
                    
                    return (
                      <div 
                        key={itemId}
                        className={cn(
                          "border-b border-border last:border-b-0",
                          index % 2 === 0 ? "bg-card" : "bg-muted/20"
                        )}
                      >
                        {/* Item header */}
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{item.name}</span>
                                {getDeductionBadge(item.deductionType)}
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          {isItemExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </button>

                        {/* Item details */}
                        {isItemExpanded && (
                          <div className="px-4 pb-4 space-y-4">
                            {/* Examples */}
                            <div>
                              <p className="text-sm font-medium mb-2">Exemples :</p>
                              <div className="flex flex-wrap gap-2">
                                {item.examples.map((example, i) => (
                                  <span 
                                    key={i}
                                    className="text-xs bg-muted px-2 py-1 rounded-full"
                                  >
                                    {example}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Deduction details */}
                            {item.deductionDetails && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                                <p className="text-sm text-info">{item.deductionDetails}</p>
                              </div>
                            )}

                            {/* Conditions */}
                            {item.conditions && item.conditions.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Check className="w-4 h-4 text-success" />
                                  Conditions :
                                </p>
                                <ul className="space-y-1">
                                  {item.conditions.map((condition, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-success mt-1">•</span>
                                      {condition}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Not deductible */}
                            {item.notDeductible && item.notDeductible.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <X className="w-4 h-4 text-destructive" />
                                  Non déductible :
                                </p>
                                <ul className="space-y-1">
                                  {item.notDeductible.map((nd, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-destructive mt-1">•</span>
                                      {nd}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Aucun résultat pour "{searchQuery}"
          </p>
        </div>
      )}

      {/* Important notice */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-warning mb-2">Règles importantes</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Justificatifs obligatoires</strong> : Conservez toutes les factures et tickets pendant 6 ans</li>
              <li>• <strong>Usage professionnel</strong> : Seule la part professionnelle est déductible pour les dépenses mixtes</li>
              <li>• <strong>Proportionnalité</strong> : Les dépenses doivent être proportionnées à l'activité</li>
              <li>• <strong>Bonne foi</strong> : En cas de contrôle, vous devez pouvoir justifier chaque dépense</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Official sources */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          Sources officielles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {officialSources.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {source.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {source.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Ces informations sont fournies à titre indicatif et sont basées sur la législation fiscale française en vigueur.
          <br />
          Consultez un expert-comptable pour une analyse personnalisée de votre situation.
        </p>
      </div>
    </div>
  );
}
