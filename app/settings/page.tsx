// app/settings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsContainer } from "@/components/settings/SettingsContainer";

export const metadata: Metadata = {
  title: "Paramètres",
  description: "Paramètres de votre compte",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer les données du profil
  const { data: profile } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single();

  return <SettingsContainer user={user} profile={profile} />;
}
