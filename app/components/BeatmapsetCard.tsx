import React, { useState } from 'react'
import { Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Beatmapset, Difficulty } from './types'
import { getModeIcon, getModeName, getApprovedStatus, formatDate, formatNumber } from './utils'
import { getDifficultyStyle, formatStarRating } from './difficulty-colors'
import { useLanguage } from './LanguageContext'

interface BeatmapsetCardProps {
  beatmapset: Beatmapset
  selectedModes: Set<string>
  displayStyle?: 'card' | 'thumbnail' | 'minimal'
  showMapperName?: boolean
  className?: string
}

export const BeatmapsetCard: React.FC<BeatmapsetCardProps> = ({
  beatmapset,
  selectedModes,
  displayStyle = 'card',
  showMapperName = true,
  className = ''
}) => {
  const { t } = useLanguage()
  const [showAllDifficulties, setShowAllDifficulties] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  // Filter and sort difficulties based on selected modes and star rating (descending)
  const filteredDifficulties = beatmapset.difficulties
    .filter(diff => selectedModes.has(diff.mode))
    .sort((a, b) => parseFloat(b.difficultyrating) - parseFloat(a.difficultyrating))

  if (filteredDifficulties.length === 0) return null

  const status = getApprovedStatus(beatmapset.approved)
  const statusLabel =
    status.text === 'Approved' ? t.approved :
    status.text === 'Qualified' ? t.qualified :
    status.text === 'Loved' ? t.loved :
    t.ranked
  
  // Always aggregate stats from difficulties to ensure accuracy
  // Favorite count: use beatmapset-level if available, otherwise use first difficulty's value (shared across set)
  const favoriteCount = beatmapset.favourite_count ? 
    parseInt(beatmapset.favourite_count) : 
    (filteredDifficulties.length > 0 ? parseInt(filteredDifficulties[0].favourite_count || '0') : 0)
  
  // Playcount: use beatmapset-level if available (already aggregated), otherwise sum from difficulties
  const totalPlaycount = beatmapset.playcount ? 
    parseInt(beatmapset.playcount) : 
    filteredDifficulties.reduce((sum, diff) => sum + parseInt(diff.playcount || '0'), 0)

  // Minimal display style - simplified one-line listing
  if (displayStyle === 'minimal') {
    const uniqueModes = Array.from(new Set(filteredDifficulties.map(d => d.mode)))
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Only prevent default if clicking on the card itself, not the external link
      if ((e.target as HTMLElement).closest('.external-link')) return
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
    
    return (
      <div className={`bg-slate-50/95 dark:bg-gray-800 rounded-lg border-2 border-slate-300 dark:border-gray-600 hover:border-osu-pink dark:hover:border-osu-pink hover:shadow-lg transition-all duration-200 ${className}`}>
        <div 
          className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left section: Main info in one line */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.color} flex-shrink-0`}>
                  {status.code} {statusLabel}
                </span>
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {beatmapset.title}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{t.byArtist} {beatmapset.artist}</span>
                {showMapperName && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">• {beatmapset.creator}</span>
                )}
              </div>
            </div>
            
            {/* Right section: Stats and modes */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-red-500">❤️ {formatNumber(favoriteCount)}</span>
                <span className="text-blue-500">▶️ {formatNumber(totalPlaycount)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {uniqueModes.map(mode => (
                  <span key={mode} className="text-xl p-1 bg-gray-100 dark:bg-gray-700 rounded" title={getModeName(mode)}>
                    {getModeIcon(mode)}
                  </span>
                ))}
              </div>
              
              <a
                href={`https://osu.ppy.sh/beatmapsets/${beatmapset.beatmapset_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link text-gray-400 hover:text-osu-pink transition-colors"
                title={t.openOnOsu}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          {/* Expanded beatmaps section with smooth animations */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
          }`}>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {filteredDifficulties.map((difficulty, index) => (
                  <div 
                    key={difficulty.beatmap_id} 
                    className={`flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 transform transition-all duration-200 ease-out ${
                      isExpanded 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-2 opacity-0'
                    }`}
                    style={{
                      transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
                    }}
                  >
                    <span className="text-base">{getModeIcon(difficulty.mode)}</span>
                    <span className="flex-1 truncate">{difficulty.version}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <span>▶️</span>
              <span>{formatNumber(parseInt(difficulty.playcount || '0'))}</span>
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:scale-105"
                      style={getDifficultyStyle(parseFloat(difficulty.difficultyrating))}
                    >
                      ★{formatStarRating(difficulty.difficultyrating)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Thumbnail display style
  if (displayStyle === 'thumbnail') {
    const uniqueModes = Array.from(new Set(filteredDifficulties.map(d => d.mode)))
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Only prevent default if clicking on the card itself, not the external link or image
      if ((e.target as HTMLElement).closest('.external-link') || (e.target as HTMLElement).closest('.thumbnail-image')) return
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
    
    return (
      <div className={`bg-slate-50/95 dark:bg-gray-800 rounded-lg border-2 border-slate-300 dark:border-gray-600 hover:border-osu-pink dark:hover:border-osu-pink shadow-sm hover:shadow-lg transition-all duration-200 ${isExpanded ? 'col-span-full' : ''} ${className}`}>
        <div className="p-3">
          <div 
            className="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg p-2 -m-2"
            onClick={handleCardClick}
          >
            <div className="relative flex-shrink-0">
              <a
                href={`https://osu.ppy.sh/beatmapsets/${beatmapset.beatmapset_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="thumbnail-image block"
              >
                <img
                  src={`https://assets.ppy.sh/beatmaps/${beatmapset.beatmapset_id}/covers/list.jpg`}
                  alt={`${beatmapset.title} cover`}
                  className="w-16 h-16 object-cover rounded transition-transform duration-200 hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </a>
              <div className="absolute -top-1 -left-1">
                <span className={`text-xs px-1 py-0.5 rounded ${status.color}`}>
                  {status.code}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                {beatmapset.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                {t.byArtist} {beatmapset.artist}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  {showMapperName && <span>{beatmapset.creator}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span>❤️ {formatNumber(favoriteCount)}</span>
                  <span>▶️ {formatNumber(totalPlaycount)}</span>
                  <div className="flex items-center gap-1">
                    {uniqueModes.map(mode => (
                      <span key={mode} className="text-base p-1 bg-gray-100 dark:bg-gray-700 rounded" title={getModeName(mode)}>
                        {getModeIcon(mode)}
                      </span>
                    ))}
                  </div>
                  <a
                    href={`https://osu.ppy.sh/beatmapsets/${beatmapset.beatmapset_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link text-gray-400 hover:text-osu-pink transition-colors"
                title={t.openOnOsu}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expanded beatmaps section with smooth animations */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
          }`}>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {filteredDifficulties.map((difficulty, index) => (
                  <div 
                    key={difficulty.beatmap_id} 
                    className={`flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 transform transition-all duration-200 ease-out ${
                      isExpanded 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-2 opacity-0'
                    }`}
                    style={{
                      transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
                    }}
                  >
                    <span className="text-base">{getModeIcon(difficulty.mode)}</span>
                    <span className="flex-1 truncate">{difficulty.version}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <span>▶️</span>
                      <span>{formatNumber(parseInt(difficulty.playcount || '0'))}</span>
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold transition-all duration-200 hover:scale-105"
                      style={getDifficultyStyle(parseFloat(difficulty.difficultyrating))}
                    >
                      ★{formatStarRating(difficulty.difficultyrating)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card display style (default)
  return (
    <div className={`bg-slate-50/95 dark:bg-gray-800 rounded-lg border-2 border-slate-300 dark:border-gray-600 hover:border-osu-pink dark:hover:border-osu-pink shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}>
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-osu-pink to-purple-600">
        <a
          href={`https://osu.ppy.sh/beatmapsets/${beatmapset.beatmapset_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src={`https://assets.ppy.sh/beatmaps/${beatmapset.beatmapset_id}/covers/cover.jpg`}
            alt={`${beatmapset.title} cover`}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </a>
        
        {/* Status and Mode indicators */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={`bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1 ${status.color}`}>
            {status.code} {statusLabel}
          </span>
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1">
          {Array.from(new Set(filteredDifficulties.map(d => d.mode))).map(mode => (
            <span
              key={mode}
              className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
              title={getModeName(mode)}
            >
              {getModeIcon(mode)}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate">
            {beatmapset.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 truncate">
            {t.byArtist} {beatmapset.artist}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(beatmapset.approved_date)}
          </span>
          {showMapperName && (
            <span>{t.mappedBy} {beatmapset.creator}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>
            {filteredDifficulties.length} {filteredDifficulties.length === 1 ? t.difficulty : t.difficulties}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{formatNumber(favoriteCount)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>▶️</span>
              <span>{formatNumber(totalPlaycount)}</span>
            </span>
          </div>
        </div>

        {/* Difficulties list */}
        <div className="mt-3 space-y-1">
          {(showAllDifficulties ? filteredDifficulties : filteredDifficulties.slice(0, 3)).map((difficulty, index) => (
            <div key={difficulty.beatmap_id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{getModeIcon(difficulty.mode)}</span>
              <span className="truncate flex-1">{difficulty.version}</span>
              <span className="flex items-center gap-1 text-gray-400">
                <span>▶️</span>
                <span>{formatNumber(parseInt(difficulty.playcount || '0'))}</span>
              </span>
              <span 
                className="px-1.5 py-0.5 rounded text-xs font-semibold bg-black/10 dark:bg-white/10"
                style={getDifficultyStyle(parseFloat(difficulty.difficultyrating))}
              >
                ★{formatStarRating(difficulty.difficultyrating)}
              </span>
            </div>
          ))}
          {filteredDifficulties.length > 3 && (
            <button
              onClick={() => setShowAllDifficulties(!showAllDifficulties)}
              className="flex items-center gap-1 text-xs text-osu-pink hover:text-osu-purple transition-colors cursor-pointer"
            >
              {showAllDifficulties ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  {t.showLess}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  +{filteredDifficulties.length - 3} {t.more}...
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
