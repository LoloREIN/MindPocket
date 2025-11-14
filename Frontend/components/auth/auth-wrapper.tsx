'use client'

import { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import { getCurrentUser, signOut } from 'aws-amplify/auth'

// Configure Amplify directly in the component
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: true,
      },
    },
  },
  API: {
    REST: {
      MindPocketAPI: {
        endpoint: process.env.NEXT_PUBLIC_API_URL!,
        region: process.env.NEXT_PUBLIC_API_REGION!,
      },
    },
  },
}

// Configure Amplify
console.log('🔧 Configuring Amplify in AuthWrapper...')
console.log('Environment variables:', {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  clientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
  region: process.env.NEXT_PUBLIC_COGNITO_REGION,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
})
Amplify.configure(amplifyConfig)
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'
import { ForgotPasswordForm } from './forgot-password-form'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface AuthWrapperProps {
  children: React.ReactNode
}

type AuthView = 'login' | 'signup' | 'forgot-password'

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentView, setCurrentView] = useState<AuthView>('login')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(true)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
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

  // Authenticated - show app with sign out option
  return (
    <div className="min-h-screen">
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
      {children}
    </div>
  )
}
