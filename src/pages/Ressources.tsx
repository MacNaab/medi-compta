import { useState } from 'react';
import { BookOpen, ExternalLink, FileText, Calculator, Building, Shield, ArrowLeft, Receipt, SlidersHorizontal, ClipboardList, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RegimeComparison } from '@/components/ressources/RegimeComparison';
import { FraisDeductibles } from '@/components/ressources/FraisDeductibles';
import { QuotePartCalculator } from '@/components/ressources/QuotePartCalculator';
import { Declaration2035Guide } from '@/components/ressources/Declaration2035Guide';
import { RetrocessionGuide } from '@/components/ressources/RetrocessionGuide';

const resources = [
  {
    category: 'Démarches administratives',
    items: [
      {
        title: 'Inscription à l\'Ordre des Médecins',
        description: 'Procédure d\'inscription pour exercer en tant que remplaçant',
        icon: Building,
        url: 'https://www.conseil-national.medecin.fr/',
        action: null,
      },
      {
        title: 'URSSAF - Médecins remplaçants',
        description: 'Guide des cotisations et démarches sociales',
        icon: FileText,
        url: 'https://www.urssaf.fr/portail/home/praticien-et-auxiliaire-medical.html',
        action: null,
      },
      {
        title: 'CARMF - Retraite des médecins',
        description: 'Caisse autonome de retraite des médecins de France',
        icon: Shield,
        url: 'https://www.carmf.fr/',
        action: null,
      },
    ],
  },
  {
    category: 'Fiscalité & Comptabilité',
    items: [
      {
        title: 'Régime Micro-BNC vs Réel',
        description: 'Comprendre les différences et choisir le bon régime',
        icon: Calculator,
        url: '#',
        action: 'regime-comparison',
      },
      {
        title: 'Frais déductibles',
        description: 'Liste des charges professionnelles déductibles',
        icon: Receipt,
        url: '#',
        action: 'frais-deductibles',
      },
      {
        title: 'Calculateur quote-part',
        description: 'Calculez la part déductible de vos dépenses mixtes',
        icon: SlidersHorizontal,
        url: '#',
        action: 'quote-part-calculator',
      },
      {
        title: 'Déclaration 2035',
        description: 'Guide interactif pour remplir sa déclaration de revenus BNC',
        icon: ClipboardList,
        url: '#',
        action: 'declaration-2035',
      },
    ],
  },
  {
    category: 'Outils pratiques',
    items: [
      {
        title: 'Modèle de contrat de remplacement',
        description: 'Template de contrat type pour vos remplacements',
        icon: FileText,
        url: '#',
        action: null,
      },
      {
        title: 'Calcul du taux de rétrocession',
        description: 'Comment négocier et calculer sa rétrocession',
        icon: Scale,
        url: '#',
        action: 'retrocession-guide',
      },
    ],
  },
];

export default function Ressources() {
  const [activeView, setActiveView] = useState<string | null>(null);

  const handleItemClick = (item: typeof resources[0]['items'][0]) => {
    if (item.action) {
      setActiveView(item.action);
    } else if (item.url.startsWith('http')) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Show regime comparison view
  if (activeView === 'regime-comparison') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux ressources
        </Button>
        <RegimeComparison onClose={() => setActiveView(null)} />
      </div>
    );
  }

  // Show frais deductibles view
  if (activeView === 'frais-deductibles') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux ressources
        </Button>
        <FraisDeductibles onClose={() => setActiveView(null)} />
      </div>
    );
  }

  // Show quote-part calculator view
  if (activeView === 'quote-part-calculator') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux ressources
        </Button>
        <QuotePartCalculator onClose={() => setActiveView(null)} />
      </div>
    );
  }

  // Show declaration 2035 guide
  if (activeView === 'declaration-2035') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux ressources
        </Button>
        <Declaration2035Guide onClose={() => setActiveView(null)} />
      </div>
    );
  }

  // Show retrocession guide
  if (activeView === 'retrocession-guide') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView(null)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux ressources
        </Button>
        <RetrocessionGuide onClose={() => setActiveView(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Ressources</h1>
        <p className="text-muted-foreground">
          Guides et outils utiles pour les médecins remplaçants
        </p>
      </div>

      {/* Resources by category */}
      <div className="space-y-8">
        {resources.map((category) => (
          <div key={category.category}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {category.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => {
                const isExternal = item.url.startsWith('http');
                const hasAction = !!item.action;
                const isDisabled = !isExternal && !hasAction;

                return (
                  <button
                    key={item.title}
                    onClick={() => handleItemClick(item)}
                    disabled={isDisabled}
                    className={cn(
                      'group flex flex-col p-5 rounded-xl border border-border bg-card text-left',
                      'transition-all duration-200',
                      !isDisabled && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
                      isDisabled && 'opacity-60 cursor-not-allowed',
                      hasAction && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "p-2.5 rounded-lg",
                        hasAction ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {isExternal && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {hasAction && (
                      <span className="mt-3 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full self-start">
                        Interactif
                      </span>
                    )}
                    {isDisabled && (
                      <span className="mt-3 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full self-start">
                        Bientôt disponible
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <h3 className="font-semibold mb-2">Besoin d'aide ?</h3>
        <p className="text-muted-foreground mb-4">
          Pour toute question spécifique à votre situation, n'hésitez pas à consulter un expert-comptable 
          spécialisé dans les professions libérales de santé.
        </p>
        <p className="text-sm text-muted-foreground">
          Les informations présentées ici sont données à titre indicatif et ne constituent pas un conseil 
          juridique ou fiscal personnalisé.
        </p>
      </div>
    </div>
  );
}
