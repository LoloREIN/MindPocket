import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { AmplifyProvider } from '@/lib/amplify-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MindPocket - Your Wellness Collection',
  description: 'Save and organize wellness content from TikTok: recipes, routines, and more',
  generator: 'MindPocket',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`font-sans antialiased`}>
        <AmplifyProvider>
          <AuthWrapper>
            <div className="pb-16">
              {children}
            </div>
            <BottomNav />
          </AuthWrapper>
        </AmplifyProvider>
      </body>
    </html>
  )
}
