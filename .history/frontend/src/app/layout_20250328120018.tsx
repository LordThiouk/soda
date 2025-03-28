import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/context/AppContext'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SODAV Monitor',
  description: 'Système de monitoring des diffusions pour SODAV',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            <main className="min-h-screen flex flex-col">
              {children}
            </main>
            <Toaster />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
