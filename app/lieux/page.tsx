// app/lieux/page.tsx
import { LieuManager } from "@/components/lieux/lieu-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion des Lieux - Suivi Honoraires",
  description: "Gérez vos cabinets et pourcentages de rétrocession",
};

export default function LieuxPage() {
  return <LieuManager />;
}
