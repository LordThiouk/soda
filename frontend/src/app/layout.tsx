import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SODAV Monitor',
  description: 'Système de surveillance des radios et chaînes TV sénégalaises',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
