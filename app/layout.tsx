import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from './components/LanguageContext'
import { CountryProvider } from './components/CountryContext'
import { SiteFooter } from './components/SiteFooter'
import { BackToTopButton } from './components/BackToTopButton'

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
    <html lang="en" className="dark">
      <body className="font-korean min-h-screen">
        <LanguageProvider>
          <CountryProvider>
            <div className="atlas-page-content">
              {children}
            </div>
            <SiteFooter />
            <BackToTopButton />
          </CountryProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
