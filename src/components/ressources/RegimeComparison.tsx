import { useState } from 'react';
import { Check, X, ArrowRight, Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegimeComparisonChart } from '@/components/simulator/RegimeComparisonChart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MICRO_BNC_LIMIT = 77700;

const SITUATION_FAMILIALE = [
  { value: "'célibataire'", label: "Célibataire" },
  { value: "'couple'", label: "Marié(e)s / Pacsé(e)s" },
];

const SECTEUR = [
  { value: "'S1'", label: "Secteur 1" },
  { value: "'S2'", label: "Secteur 2" },
  { value: "'non conventionné'", label: "Non conventionné" },
];

interface ComparisonItem {
  label: string;
  microBNC: string | boolean;
  reel: string | boolean;
  highlight?: 'micro' | 'reel' | 'both';
}

const comparisonData: ComparisonItem[] = [
  {
    label: 'Plafond de CA',
    microBNC: `${MICRO_BNC_LIMIT.toLocaleString('fr-FR')} €`,
    reel: 'Illimité',
    highlight: 'reel',
  },
  {
    label: 'Déduction des charges',
    microBNC: 'Abattement forfaitaire 34%',
    reel: 'Charges réelles déduites',
  },
  {
    label: 'Simplicité comptable',
    microBNC: true,
    reel: false,
    highlight: 'micro',
  },
  {
    label: 'Livre de recettes',
    microBNC: 'Obligatoire (simplifié)',
    reel: 'Comptabilité complète',
  },
  {
    label: 'Déclaration fiscale',
    microBNC: '2042-C PRO',
    reel: '2035 + 2042-C PRO',
  },
  {
    label: 'TVA',
    microBNC: 'Franchise de base (exonéré)',
    reel: 'Option possible',
  },
  {
    label: 'Déficit reportable',
    microBNC: false,
    reel: true,
    highlight: 'reel',
  },
  {
    label: 'Amortissements',
    microBNC: false,
    reel: true,
    highlight: 'reel',
  },
  {
    label: 'Adhésion AGA obligatoire',
    microBNC: false,
    reel: 'Recommandée (majoration 10% sinon)',
  },
];

interface RegimeComparisonProps {
  onClose?: () => void;
}

export function RegimeComparison({ onClose }: RegimeComparisonProps) {
  const [showChart, setShowChart] = useState(false);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(5000);
  const [situationFamiliale, setSituationFamiliale] = useState("'célibataire'");
  const [secteur, setSecteur] = useState("'S1'");
  const [currentCA, setCurrentCA] = useState(50000);

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const renderCellValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-success" />
      ) : (
        <X className="w-5 h-5 text-destructive" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Micro-BNC vs Régime Réel
          </h2>
          <p className="text-muted-foreground text-sm">
            Comparez les deux régimes fiscaux pour choisir le plus adapté à votre situation
          </p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-info/30 bg-info/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-info" />
            <h3 className="font-semibold text-info">Micro-BNC</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Idéal pour débuter ou si vos charges réelles sont inférieures à 34% de votre CA.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Comptabilité simplifiée
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Moins de formalités
            </li>
            <li className="flex items-center gap-2">
              <X className="w-4 h-4 text-destructive" />
              Limité à {formatCurrency(MICRO_BNC_LIMIT)} € de CA
            </li>
          </ul>
        </div>

        <div className="rounded-xl border-2 border-success/30 bg-success/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-success" />
            <h3 className="font-semibold text-success">Régime Réel</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Avantageux si vos charges dépassent 34% de votre CA ou si vous dépassez le plafond.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Déduction des charges réelles
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Pas de plafond de CA
            </li>
            <li className="flex items-center gap-2">
              <X className="w-4 h-4 text-destructive" />
              Comptabilité plus complexe
            </li>
          </ul>
        </div>
      </div>

      {/* Decision helper */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary mb-2">Comment choisir ?</h4>
            <p className="text-sm text-muted-foreground mb-2">
              La règle simple : si vos <strong>charges réelles dépassent 34% de votre CA</strong>, 
              le régime Réel sera plus avantageux.
            </p>
            <p className="text-sm text-muted-foreground">
              Par exemple, pour un CA de 50 000 €, l'abattement Micro-BNC = 17 000 €. 
              Si vos charges réelles dépassent ce montant, optez pour le Réel.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold">Critère</th>
                <th className="text-center p-4 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-info" />
                    Micro-BNC
                  </div>
                </th>
                <th className="text-center p-4 font-semibold">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    Réel
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, index) => (
                <tr 
                  key={item.label} 
                  className={cn(
                    "border-b border-border last:border-b-0",
                    index % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}
                >
                  <td className="p-4 font-medium">{item.label}</td>
                  <td className={cn(
                    "p-4 text-center",
                    item.highlight === 'micro' && "bg-info/10"
                  )}>
                    {renderCellValue(item.microBNC)}
                  </td>
                  <td className={cn(
                    "p-4 text-center",
                    item.highlight === 'reel' && "bg-success/10"
                  )}>
                    {renderCellValue(item.reel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart section toggle */}
      {!showChart ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h3 className="font-semibold mb-2">Simuler avec vos données</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Visualisez l'évolution du Super-Net selon votre CA pour les deux régimes
          </p>
          <Button onClick={() => setShowChart(true)}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Afficher le graphique comparatif
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart parameters */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold mb-4">Paramètres de simulation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Votre CA annuel (€)</Label>
                <Input
                  type="number"
                  value={currentCA}
                  onChange={(e) => setCurrentCA(parseFloat(e.target.value) || 0)}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Charges annuelles (€)</Label>
                <Input
                  type="number"
                  value={chargesAnnuelles}
                  onChange={(e) => setChargesAnnuelles(parseFloat(e.target.value) || 0)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Situation familiale</Label>
                <Select value={situationFamiliale} onValueChange={setSituationFamiliale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATION_FAMILIALE.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secteur</Label>
                <Select value={secteur} onValueChange={setSecteur}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEUR.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chart */}
          <RegimeComparisonChart
            chargesAnnuelles={chargesAnnuelles}
            situationFamiliale={situationFamiliale}
            nombreEnfants="0 enfant"
            secteur={secteur}
            proportionNonConventionne="25"
            dateCreationEntreprise="01/01/2024"
            currentCA={currentCA}
          />

          <Button variant="outline" onClick={() => setShowChart(false)} className="w-full">
            Masquer le graphique
          </Button>
        </div>
      )}

      {/* Footer note */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning mb-1">Important</p>
            <p className="text-muted-foreground">
              Le choix du régime fiscal doit être fait en début d'année et s'applique pour toute l'année civile. 
              Consultez un expert-comptable pour une analyse personnalisée de votre situation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
