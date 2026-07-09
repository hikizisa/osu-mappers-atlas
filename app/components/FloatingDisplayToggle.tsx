'use client'

import React from 'react'
import { Grid, List, Image } from 'lucide-react'
import { useLanguage } from './LanguageContext'

interface FloatingDisplayToggleProps {
  displayStyle: 'card' | 'thumbnail' | 'minimal'
  onDisplayStyleChange: (style: 'card' | 'thumbnail' | 'minimal') => void
  className?: string
}

export const FloatingDisplayToggle: React.FC<FloatingDisplayToggleProps> = ({
  displayStyle,
  onDisplayStyleChange,
  className = ''
}) => {
  const { t } = useLanguage()

  const displayOptions = [
    {
      value: 'card' as const,
      icon: Grid,
      label: t.cardView,
      tooltip: 'Card View'
    },
    {
      value: 'thumbnail' as const,
      icon: Image,
      label: t.thumbnailView,
      tooltip: 'Thumbnail View'
    },
    {
      value: 'minimal' as const,
      icon: List,
      label: t.minimalView,
      tooltip: 'List View'
    }
  ]

  return (
    // Sit left of the fixed back-to-top button + above the floating footer
    <div className={`fixed bottom-20 right-20 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1">
        {displayOptions.map(({ value, icon: Icon, tooltip }) => (
          <button
            key={value}
            onClick={() => onDisplayStyleChange(value)}
            className={`p-3 rounded-full transition-all duration-200 ease-in-out ${
              displayStyle === value
                ? 'bg-osu-pink text-white shadow-md scale-110'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={tooltip}
            aria-label={tooltip}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  )
}
