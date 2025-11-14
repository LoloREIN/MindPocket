import { Amplify } from 'aws-amplify'

// Debug: Log environment variables (only in browser)
if (typeof window !== 'undefined') {
  console.log('🔧 Amplify Config Debug:')
  console.log('User Pool ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID)
  console.log('Client ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID)
  console.log('Region:', process.env.NEXT_PUBLIC_COGNITO_REGION)
  console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
}

const amplifyConfig = {
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

// Only configure in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Configuring Amplify with:', amplifyConfig)
  Amplify.configure(amplifyConfig, { ssr: true })
}

export default amplifyConfig
