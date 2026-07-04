import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from './components/LanguageContext'
import { CountryProvider } from './components/CountryContext'

export const metadata: Metadata = {
  title: 'osu! Mappers Atlas',
  description: 'Discover osu! mappers and ranked beatmaps by country',
  keywords: 'osu, mappers, beatmaps, country, ranked beatmaps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-korean bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <LanguageProvider>
          <CountryProvider>
            {children}
          </CountryProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
