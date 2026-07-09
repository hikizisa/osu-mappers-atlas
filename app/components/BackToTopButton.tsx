'use client'

import React, { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { useLanguage } from './LanguageContext'

export const BackToTopButton: React.FC = () => {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`atlas-back-to-top ${visible ? 'atlas-back-to-top--visible' : ''}`}
      aria-label={t.backToTop}
      title={t.backToTop}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
