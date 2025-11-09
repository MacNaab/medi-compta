// app/login/page.tsx
import { Metadata } from "next";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre compte pour accéder à votre suivi",
};

export default function LoginPage() {
  return <AuthContainer />;
}
