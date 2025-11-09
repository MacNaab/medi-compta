// components/auth/AuthTabs.tsx
import { AuthView } from "./AuthContainer";

interface AuthTabsProps {
  currentView: AuthView;
  onViewChange: (view: AuthView) => void;
}

export function AuthTabs({ currentView, onViewChange }: AuthTabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onViewChange("signin")}
        className={`flex-1 py-4 px-2 text-center font-medium text-sm ${
          currentView === "signin"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Connexion
      </button>
      <button
        onClick={() => onViewChange("signup")}
        className={`flex-1 py-4 px-2 text-center font-medium text-sm ${
          currentView === "signup"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Inscription
      </button>
    </div>
  );
}
