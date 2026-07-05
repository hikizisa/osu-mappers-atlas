import React from 'react'
import { Apple, CircleDot, Drum, Piano } from 'lucide-react'

interface ModeIconProps {
  mode: string
  className?: string
}

export const ModeIcon: React.FC<ModeIconProps> = ({ mode, className = 'h-4 w-4' }) => {
  switch (mode) {
    case '0':
      return <CircleDot className={className} aria-hidden="true" />
    case '1':
      return <Drum className={className} aria-hidden="true" />
    case '2':
      return <Apple className={className} aria-hidden="true" />
    case '3':
      return <Piano className={className} aria-hidden="true" />
    default:
      return <CircleDot className={className} aria-hidden="true" />
  }
}
