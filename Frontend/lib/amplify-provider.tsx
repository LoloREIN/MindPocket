'use client'

import { useEffect, useState } from 'react'
import { Amplify } from 'aws-amplify'

let isConfigured = false

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isConfigured && typeof window !== 'undefined') {
      console.log('🔧 Initializing Amplify Configuration...')
      
      const config = {
        Auth: {
          Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
            region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
            signUpVerificationMethod: 'code' as const,
            loginWith: {
              email: true,
              username: false,
            },
          },
        },
        API: {
          REST: {
            MindPocketAPI: {
              endpoint: process.env.NEXT_PUBLIC_API_URL!,
              region: process.env.NEXT_PUBLIC_API_REGION || 'us-east-1',
            },
          },
        },
      }

      console.log('✅ Amplify Config:', {
        userPoolId: config.Auth.Cognito.userPoolId,
        clientId: config.Auth.Cognito.userPoolClientId,
        region: config.Auth.Cognito.region,
        apiEndpoint: config.API.REST.MindPocketAPI.endpoint,
      })

      Amplify.configure(config, { ssr: true })
      isConfigured = true
      console.log('✅ Amplify configured successfully')
    }
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
