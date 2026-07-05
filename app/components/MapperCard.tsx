import React from 'react'
import { User, ChevronDown, ChevronUp, Sparkles, SortAsc } from 'lucide-react'
import { Mapper, SortOption, SortDirection } from './types'
import { BeatmapsetCard } from './BeatmapsetCard'
import { formatNumber } from './utils'
import { hasRecentRankedMap, sortMapperBeatmapsetsV2 } from './sorting'
import { useLanguage } from './LanguageContext'

interface MapperCardProps {
  mapper: Mapper
  selectedModes: Set<string>
  selectedStatuses?: Set<string>
  displayStyle?: 'card' | 'thumbnail' | 'minimal'
  isExpanded: boolean
  onToggle: (mapperId: string) => void
  beatmapSortBy: SortOption
  beatmapSortDirection: SortDirection
}

export const MapperCard: React.FC<MapperCardProps> = ({
  mapper,
  selectedModes,
  selectedStatuses = new Set(['1', '4']),
  displayStyle = 'card',
  isExpanded,
  onToggle,
  beatmapSortBy,
  beatmapSortDirection
}) => {
  const { t } = useLanguage()
  // No longer need local state - using global sorting from main page
  const isNewMapper = hasRecentRankedMap(mapper, selectedModes, selectedStatuses)
  // Filter beatmapsets based on selected modes and statuses
  const filteredBeatmapsets = (mapper.beatmapsets || []).filter(set => {
    // Check if beatmapset status is selected
    const hasMatchingStatus = selectedStatuses.has(set.approved || '1')
    
    // Check if beatmapset has difficulties that match selected modes
    // We need to check the difficulties array, not just the modes array
    const hasMatchingMode = set.difficulties && set.difficulties.some(diff => 
      selectedModes.has(diff.mode)
    )
    
    // Fallback: if no difficulties array, check modes array
    const hasModeInArray = !hasMatchingMode && set.modes && set.modes.some(mode => 
      selectedModes.has(mode)
    )
    
    return hasMatchingStatus && (hasMatchingMode || hasModeInArray)
  })

  // Filter beatmaps based on selected modes
  const filteredBeatmaps = (mapper.beatmaps || []).filter(beatmap => 
    selectedModes.has(beatmap.mode || '0')
  )

  // Sort beatmaps based on selected criteria
  const sortedBeatmaps = [...filteredBeatmaps].sort((a, b) => {
    const multiplier = beatmapSortDirection === 'desc' ? -1 : 1
    let result = 0
    
    switch (beatmapSortBy) {
      case 'date':
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
      case 'artist':
        result = a.artist.localeCompare(b.artist)
        // For text sorting, reverse the multiplier logic (asc by default makes more sense)
        return result * (beatmapSortDirection === 'asc' ? 1 : -1)
      case 'title':
        result = a.title.localeCompare(b.title)
        // For text sorting, reverse the multiplier logic (asc by default makes more sense)
        return result * (beatmapSortDirection === 'asc' ? 1 : -1)
      default:
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
    }
    return result * multiplier
  })

  // Handle different sorting approaches
  let finalBeatmapsets: typeof filteredBeatmapsets
  let sortingLabel: string

  if (beatmapSortBy === 'artist' || beatmapSortBy === 'title') {
    // For artist/title sorting, reconstruct beatmapsets from sorted individual beatmaps
    const beatmapsetMap = new Map<string, typeof filteredBeatmapsets[0]>()
    
    // Create a map of beatmapset_id to beatmapset for quick lookup
    filteredBeatmapsets.forEach(set => {
      beatmapsetMap.set(set.beatmapset_id, set)
    })
    
    // Reconstruct beatmapsets in the order of sorted beatmaps
    const seenBeatmapsets = new Set<string>()
    finalBeatmapsets = []
    
    sortedBeatmaps.forEach(beatmap => {
      if (!seenBeatmapsets.has(beatmap.beatmapset_id)) {
        const beatmapset = beatmapsetMap.get(beatmap.beatmapset_id)
        if (beatmapset) {
          finalBeatmapsets.push(beatmapset)
          seenBeatmapsets.add(beatmap.beatmapset_id)
        }
      }
    })
    
    sortingLabel = beatmapSortBy === 'artist' ? t.sortByArtist : t.sortByTitle
  } else {
    // For other sorting criteria, use beatmapset-level sorting
    const effectiveSortBy = beatmapSortBy as 'date' | 'favorite' | 'playcount'
    finalBeatmapsets = sortMapperBeatmapsetsV2(filteredBeatmapsets, effectiveSortBy, beatmapSortDirection)
    sortingLabel = effectiveSortBy === 'date' ? t.sortByDate : effectiveSortBy === 'favorite' ? t.sortByFavorites : t.sortByPlaycount
  }

  const displayName = mapper.username
  const aliases = mapper.aliases && mapper.aliases.length > 0 ? mapper.aliases : []

  return (
    <div className="bg-slate-50/95 dark:bg-gray-800 rounded-lg border-2 border-slate-300 dark:border-gray-600 hover:border-osu-pink dark:hover:border-osu-pink shadow-md hover:shadow-lg transition-all duration-200">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => onToggle(mapper.user_id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={`https://a.ppy.sh/${mapper.user_id}`}
              alt={`${mapper.username} avatar`}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-12 h-12 bg-gradient-to-r from-osu-pink to-purple-600 rounded-full flex items-center justify-center hidden">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {displayName}
                </h3>
                {isNewMapper && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                    title={t.recentlyRankedMap}
                  >
                    <Sparkles className="h-3 w-3" />
                    New
                  </span>
                )}
              </div>
              {aliases.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.alsoKnownAs}: {aliases.join(', ')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-osu-pink">
                {formatNumber(filteredBeatmapsets.length)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.beatmapsets}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(filteredBeatmaps.length)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t.beatmaps}</div>
            </div>
            <div className="ml-4">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          {/* Beatmapset sorting info */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t.beatmapsets} ({finalBeatmapsets.length})
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <SortAsc className="h-4 w-4" />
              <span>{t.sortedBy}: {sortingLabel}</span>
            </div>
          </div>
          
          <div className={displayStyle === 'minimal' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
            {finalBeatmapsets.map((beatmapset, index) => (
              <div
                key={beatmapset.beatmapset_id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <BeatmapsetCard
                  beatmapset={beatmapset}
                  selectedModes={selectedModes}
                  displayStyle={displayStyle}
                  showMapperName={false}
                  className={displayStyle === 'minimal' ? '' : 'h-full'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
