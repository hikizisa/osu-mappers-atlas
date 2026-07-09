'use client'

import React from 'react'
import { Github } from 'lucide-react'
import { useLanguage } from './LanguageContext'

export const SiteFooter: React.FC = () => {
  const { t } = useLanguage()

  return (
    <footer className="atlas-footer">
      <div className="container mx-auto flex flex-col items-center justify-center gap-1 px-4 py-3 text-center sm:flex-row sm:gap-3">
        <div className="flex items-center justify-center gap-2">
          <Github className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <a
            href="https://github.com/hikizisa/osu-mappers-atlas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-osu-pink dark:text-slate-300 dark:hover:text-osu-pink"
          >
            {t.viewOnGitHub}
          </a>
        </div>
        <span className="hidden text-slate-300 dark:text-slate-600 sm:inline" aria-hidden="true">
          ·
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          {t.footerText}
        </p>
      </div>
    </footer>
  )
}
