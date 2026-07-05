import { Mapper, BeatmapsetGroup, Beatmapset, SortOption, MapperSortOption, SortDirection, SortConfig, MapperSortConfig } from './types'

/**
 * Check if a mapper has a recently ranked map (within last 30 days)
 * @param mapper Mapper object
 * @param selectedModes Optional mode filter
 * @param selectedStatuses Optional status filter
 * @returns boolean indicating if mapper has recent ranked map
 */
export const hasRecentRankedMap = (
  mapper: Mapper,
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>
): boolean => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  
  // Use filtered recent date calculation
  const mostRecentDate = calculateMostRecentRankedDateFiltered(mapper, selectedModes, selectedStatuses)
  if (!mostRecentDate || mostRecentDate === '1970-01-01') return false
  
  const recentDate = new Date(mostRecentDate)
  return recentDate > oneMonthAgo
}

/**
 * Sort beatmapsets within a mapper by favorite count or playcount
 * @param beatmapsets Array of beatmapsets (BeatmapsetGroup)
 * @param sortBy Sort criteria ('favorite' or 'playcount')
 * @param direction Sort direction ('asc' or 'desc')
 * @returns Sorted array of beatmapsets
 */
export const sortMapperBeatmapsets = (beatmapsets: BeatmapsetGroup[], sortBy: 'favorite' | 'playcount' | 'date', direction: SortDirection = 'desc'): BeatmapsetGroup[] => {
  const multiplier = direction === 'desc' ? -1 : 1
  
  return [...beatmapsets].sort((a, b) => {
    let result = 0
    switch (sortBy) {
      case 'favorite':
        const aFav = parseInt(a.favourite_count || '0')
        const bFav = parseInt(b.favourite_count || '0')
        result = aFav - bFav
        break
      case 'playcount':
        const aPlay = parseInt(a.playcount || '0')
        const bPlay = parseInt(b.playcount || '0')
        result = aPlay - bPlay
        break
      case 'date':
      default:
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
    }
    return result * multiplier
  })
}

/**
 * Sort beatmapsets within a mapper by favorite count or playcount (for Beatmapset type)
 * @param beatmapsets Array of beatmapsets (Beatmapset)
 * @param sortBy Sort criteria ('favorite' or 'playcount')
 * @param direction Sort direction ('asc' or 'desc')
 * @returns Sorted array of beatmapsets
 */
export const sortMapperBeatmapsetsV2 = (beatmapsets: Beatmapset[], sortBy: 'favorite' | 'playcount' | 'date', direction: SortDirection = 'desc'): Beatmapset[] => {
  const multiplier = direction === 'desc' ? -1 : 1
  
  return [...beatmapsets].sort((a, b) => {
    let result = 0
    switch (sortBy) {
      case 'favorite':
        const aFav = parseInt(a.favourite_count || '0')
        const bFav = parseInt(b.favourite_count || '0')
        result = aFav - bFav
        break
      case 'playcount':
        const aPlay = parseInt(a.playcount || '0')
        const bPlay = parseInt(b.playcount || '0')
        result = aPlay - bPlay
        break
      case 'date':
      default:
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
    }
    return result * multiplier
  })
}

export const sortMappers = (
  mappers: Mapper[], 
  sortBy: MapperSortOption,
  direction: SortDirection = 'desc',
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>,
  sortSourceById: Map<string, Mapper> = new Map()
): Mapper[] => {
  const multiplier = direction === 'desc' ? -1 : 1
  
  return [...mappers].sort((a, b) => {
    const aSortSource = sortSourceById.get(a.user_id) || a
    const bSortSource = sortSourceById.get(b.user_id) || b
    let result = 0
    switch (sortBy) {
      case 'name':
        result = a.username.localeCompare(b.username)
        // For name sorting, reverse the multiplier logic (asc by default makes more sense)
        return result * (direction === 'asc' ? 1 : -1)
      case 'beatmaps':
        const aFilteredBeatmaps = getFilteredBeatmapCount(a, selectedModes, selectedStatuses)
        const bFilteredBeatmaps = getFilteredBeatmapCount(b, selectedModes, selectedStatuses)
        result = aFilteredBeatmaps - bFilteredBeatmaps
        break
      case 'mapsets':
        const aFilteredMapsets = getFilteredBeatmapsetCount(a, selectedModes, selectedStatuses)
        const bFilteredMapsets = getFilteredBeatmapsetCount(b, selectedModes, selectedStatuses)
        result = aFilteredMapsets - bFilteredMapsets
        break
      case 'recent':
        // Sort by most recently ranked beatmapset (considering filters)
        const aRecentDate = calculateMostRecentRankedDateFiltered(aSortSource, selectedModes, selectedStatuses)
        const bRecentDate = calculateMostRecentRankedDateFiltered(bSortSource, selectedModes, selectedStatuses)
        result = new Date(aRecentDate).getTime() - new Date(bRecentDate).getTime()
        break
      case 'first':
        // Sort by first ranked/loved beatmapset after active non-year filters.
        const aFirstDate = calculateFirstRankedDateFiltered(aSortSource, selectedModes, selectedStatuses)
        const bFirstDate = calculateFirstRankedDateFiltered(bSortSource, selectedModes, selectedStatuses)
        result = new Date(aFirstDate).getTime() - new Date(bFirstDate).getTime()
        break
      default:
        const aDefaultMapsets = getFilteredBeatmapsetCount(a, selectedModes, selectedStatuses)
        const bDefaultMapsets = getFilteredBeatmapsetCount(b, selectedModes, selectedStatuses)
        result = aDefaultMapsets - bDefaultMapsets
        break
    }
    return result * multiplier
  })
}

export const sortBeatmapsets = (beatmapsets: BeatmapsetGroup[], sortBy: SortOption, direction: SortDirection = 'desc'): BeatmapsetGroup[] => {
  const multiplier = direction === 'desc' ? -1 : 1
  
  return [...beatmapsets].sort((a, b) => {
    let result = 0
    switch (sortBy) {
      case 'date':
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
      case 'artist':
        result = a.artist.localeCompare(b.artist)
        // For text sorting, reverse the multiplier logic (asc by default makes more sense)
        return result * (direction === 'asc' ? 1 : -1)
      case 'title':
        result = a.title.localeCompare(b.title)
        // For text sorting, reverse the multiplier logic (asc by default makes more sense)
        return result * (direction === 'asc' ? 1 : -1)
      case 'favorite':
        const aFav = parseInt(a.favourite_count || '0')
        const bFav = parseInt(b.favourite_count || '0')
        result = aFav - bFav
        break
      case 'playcount':
        const aPlay = parseInt(a.playcount || '0')
        const bPlay = parseInt(b.playcount || '0')
        result = aPlay - bPlay
        break
      default:
        result = new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime()
        break
    }
    return result * multiplier
  })
}

export const filterBeatmapsetsByModes = (
  beatmapsets: BeatmapsetGroup[], 
  selectedModes: Set<string>
): BeatmapsetGroup[] => {
  return beatmapsets.filter(beatmapset => 
    beatmapset.modes.some(mode => selectedModes.has(mode))
  )
}

export const calculateMostRecentRankedDate = (mapper: Mapper): string => {
  if (!mapper.beatmapsets || mapper.beatmapsets.length === 0) {
    return '1970-01-01'
  }
  
  const sortedByDate = mapper.beatmapsets
    .filter(beatmapset => beatmapset.approved_date)
    .sort((a, b) => new Date(b.approved_date).getTime() - new Date(a.approved_date).getTime())
  
  return sortedByDate.length > 0 ? sortedByDate[0].approved_date : '1970-01-01'
}

/**
 * Calculate most recent ranked date considering only beatmapsets matching filters
 */
export const calculateMostRecentRankedDateFiltered = (
  mapper: Mapper,
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>
): string => {
  if (!mapper.beatmapsets || mapper.beatmapsets.length === 0) {
    return '1970-01-01'
  }
  
  let filteredBeatmapsets = mapper.beatmapsets.filter(beatmapset => beatmapset.approved_date)
  
  // Apply status filter if provided
  if (selectedStatuses && selectedStatuses.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset => 
      selectedStatuses.has(beatmapset.approved.toString())
    )
  }
  
  // Apply mode filter if provided
  if (selectedModes && selectedModes.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset => {
      // Check difficulties array first
      const hasMatchingMode = beatmapset.difficulties && beatmapset.difficulties.some(diff => 
        selectedModes.has(diff.mode)
      )
      
      // Fallback: check modes array
      const hasModeInArray = !hasMatchingMode && beatmapset.modes && beatmapset.modes.some(mode => 
        selectedModes.has(mode)
      )
      
      return hasMatchingMode || hasModeInArray
    })
  }
  
  const sortedByDate = filteredBeatmapsets
    .sort((a, b) => new Date(b.approved_date).getTime() - new Date(a.approved_date).getTime())
  
  return sortedByDate.length > 0 ? sortedByDate[0].approved_date : '1970-01-01'
}

/**
 * Calculate first ranked/loved date considering only beatmapsets matching filters
 */
export const calculateFirstRankedDateFiltered = (
  mapper: Mapper,
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>
): string => {
  if (!mapper.beatmapsets || mapper.beatmapsets.length === 0) {
    return '9999-12-31'
  }

  let filteredBeatmapsets = mapper.beatmapsets.filter(beatmapset => beatmapset.approved_date)

  if (selectedStatuses && selectedStatuses.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset =>
      selectedStatuses.has(beatmapset.approved.toString())
    )
  }

  if (selectedModes && selectedModes.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset => {
      const hasMatchingMode = beatmapset.difficulties && beatmapset.difficulties.some(diff =>
        selectedModes.has(diff.mode)
      )
      const hasModeInArray = !hasMatchingMode && beatmapset.modes && beatmapset.modes.some(mode =>
        selectedModes.has(mode)
      )

      return hasMatchingMode || hasModeInArray
    })
  }

  const sortedByDate = filteredBeatmapsets
    .sort((a, b) => new Date(a.approved_date).getTime() - new Date(b.approved_date).getTime())

  return sortedByDate.length > 0 ? sortedByDate[0].approved_date : '9999-12-31'
}

/**
 * Get count of beatmaps matching current filters
 */
export const getFilteredBeatmapCount = (
  mapper: Mapper,
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>
): number => {
  if (!mapper.beatmaps || mapper.beatmaps.length === 0) {
    return 0
  }
  
  let filteredBeatmaps = mapper.beatmaps
  
  // Apply status filter if provided
  if (selectedStatuses && selectedStatuses.size > 0) {
    filteredBeatmaps = filteredBeatmaps.filter(beatmap => 
      selectedStatuses.has(beatmap.approved.toString())
    )
  }
  
  // Apply mode filter if provided
  if (selectedModes && selectedModes.size > 0) {
    filteredBeatmaps = filteredBeatmaps.filter(beatmap => 
      selectedModes.has(beatmap.mode)
    )
  }
  
  return filteredBeatmaps.length
}

/**
 * Get count of beatmapsets matching current filters
 */
export const getFilteredBeatmapsetCount = (
  mapper: Mapper,
  selectedModes?: Set<string>,
  selectedStatuses?: Set<string>
): number => {
  if (!mapper.beatmapsets || mapper.beatmapsets.length === 0) {
    return 0
  }
  
  let filteredBeatmapsets = mapper.beatmapsets
  
  // Apply status filter if provided
  if (selectedStatuses && selectedStatuses.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset => 
      selectedStatuses.has(beatmapset.approved.toString())
    )
  }
  
  // Apply mode filter if provided
  if (selectedModes && selectedModes.size > 0) {
    filteredBeatmapsets = filteredBeatmapsets.filter(beatmapset => {
      // Check difficulties array first
      const hasMatchingMode = beatmapset.difficulties && beatmapset.difficulties.some(diff => 
        selectedModes.has(diff.mode)
      )
      
      // Fallback: check modes array
      const hasModeInArray = !hasMatchingMode && beatmapset.modes && beatmapset.modes.some(mode => 
        selectedModes.has(mode)
      )
      
      return hasMatchingMode || hasModeInArray
    })
  }
  
  return filteredBeatmapsets.length
}
