// app/patient/page.tsx
import { PatientManager } from "@/components/patient/patient-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracking Patients - Suivi Consultations",
  description: "Gérez vos consultations et suivez vos revenus par patient",
};

export default function PatientPage() {
  return <PatientManager />;
}
