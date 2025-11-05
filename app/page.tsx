// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  BarChart3,
  HandCoins,
  DatabaseBackup,
  Landmark,
  Hospital,
  Lightbulb,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-6">
      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Suivi des Honoraires Médecin
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Gérez facilement vos honoraires selon les lieux d&apos;exercice et
          faciliter vos déclarations
        </p>
      </div>

      {/* Cartes de fonctionnalités */}
      <div className="grid md:grid-cols-3 gap-6 mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Hospital className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Lieux de travail</CardTitle>
            <CardDescription>
              Gérez vos remplacements dans les cabinets avec les pourcentages de rétrocession
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/lieux">
                <Plus className="h-4 w-4 mr-2" />
                Gérer les lieux
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Saisie quotidienne</CardTitle>
            <CardDescription>
              Déclarez vos revenus journaliers selon votre lieu avec calcul automatique des honoraires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/saisie">Commencer la saisie</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <HandCoins className="h-8 w-8 text-rose-600 mb-2" />
            <CardTitle>Virements</CardTitle>
            <CardDescription>
              Suivez vos virements réels et comparez avec les honoraires
              théoriques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rapports">Voir les virements</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Landmark className="h-8 w-8 text-violet-600 mb-2" />
            <CardTitle>Rapports</CardTitle>
            <CardDescription>
              Génération automatique des déclarations annuelles et trimestrielles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rapports">Voir les rapports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <DatabaseBackup className="h-8 w-8 text-amber-600 mb-2" />
            <CardTitle>Sauvegarder</CardTitle>
            <CardDescription>
              Exportez et importez l&apos;ensemble de vos données au format JSON ou XLSX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sauvegarde">Sauvegarder</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Lightbulb className="h-8 w-8 text-yellow-400 mb-2" />
            <CardTitle>Nouvelle idée</CardTitle>
            <CardDescription>
              Vous souhaitez une nouvelle fonctionnalitée ? N&apos;hesitez pas !
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-sky-600 hover:bg-sky-800">
              <a href="https://github.com/MacNaab/medi-compta/issues" target="_blank">Contactez nous</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
