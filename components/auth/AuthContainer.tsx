// components/auth/AuthContainer.tsx
"use client";

import { useState } from "react";
import { AuthTabs } from "./AuthTabs";
import { AuthForm } from "./AuthForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export type AuthView = "signin" | "signup" | "forgot-password";

export function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>("signin");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">MediCompta</h1>
          <p className="text-gray-600 mt-2">Gestion financière simplifiée</p>
        </div>

        {/* Navigation par onglets */}
        <AuthTabs currentView={currentView} onViewChange={setCurrentView} />

        {/* Formulaire principal */}
        <div className="mt-6">
          {currentView === "forgot-password" ? (
            <ForgotPasswordForm
              onBackToSignIn={() => setCurrentView("signin")}
            />
          ) : (
            <AuthForm view={currentView} onViewChange={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  );
}
