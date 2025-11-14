'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'
import { ForgotPasswordForm } from './forgot-password-form'

interface AuthWrapperProps {
  children: React.ReactNode
}

type AuthView = 'login' | 'signup' | 'forgot-password'

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentView, setCurrentView] = useState<AuthView>('login')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      await getCurrentUser()
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleAuthSuccess = () => {
    checkAuthStatus()
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated - show auth forms
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        {currentView === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setCurrentView('signup')}
            onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
          />
        )}
        {currentView === 'signup' && (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        {currentView === 'forgot-password' && (
          <ForgotPasswordForm
            onSuccess={() => setCurrentView('login')}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
      </div>
    )
  }

  // Authenticated - show app
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
