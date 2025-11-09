/* eslint-disable @typescript-eslint/no-explicit-any */
// components/auth/ForgotPasswordForm.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void
}

export function ForgotPasswordForm({ onBackToSignIn }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error
      
      setMessage('Un email de réinitialisation a été envoyé à votre adresse. Suivez le lien pour créer un nouveau mot de passe.')
    } catch (err: any) {
      setMessage(err.message || 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBackToSignIn}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Retour à la connexion
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Mot de passe oublié</h2>
      <p className="text-gray-600 text-sm mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="resetEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.includes('envoyé') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>
    </div>
  )
}