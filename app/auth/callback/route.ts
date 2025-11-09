/* eslint-disable @typescript-eslint/no-explicit-any */
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/settings";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Gestion des erreurs OAuth
  if (error) {
    console.error("Erreur OAuth:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  // Si pas de code, redirection simple
  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const supabase = await createClient();

  try {
    // Échange le code contre une session
    const {
      data: { user },
      error: exchangeError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Erreur exchange code:", exchangeError);
      throw exchangeError;
    }

    // Vérifie si c'est une réinitialisation de mot de passe
    if (user && user.email_confirmed_at === null && user.email) {
      // C'est probablement une réinitialisation de mot de passe
      // On redirige vers la page de réinitialisation
      return NextResponse.redirect(
        new URL(
          `/reset-password?email=${encodeURIComponent(user.email)}`,
          requestUrl.origin
        )
      );
    }

    // Redirection normale après connexion réussie
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error: any) {
    console.error("Erreur callback auth:", error);

    // Redirection vers login avec message d'erreur
    const errorMessage = error.message || "Erreur lors de la connexion";
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorMessage)}`,
        requestUrl.origin
      )
    );
  }
}
