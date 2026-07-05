import { Mapper, Beatmap, Beatmapset, BeatmapsetGroup } from './types'
import { constructBeatmapsetsFromBeatmaps } from './beatmapset-utils'
import { searchInMapper } from './utils'

export const ALL_YEARS = 'all'

export function getApprovedYear(approvedDate?: string): string | null {
  if (!approvedDate) return null
  const year = new Date(approvedDate).getFullYear()
  return Number.isFinite(year) ? String(year) : null
}

export function matchesSelectedYear(approvedDate: string | undefined, selectedYear: string): boolean {
  return selectedYear === ALL_YEARS || getApprovedYear(approvedDate) === selectedYear
}

export function getAvailableYearsFromMappers(mappers: Mapper[]): string[] {
  return Array.from(new Set(
    mappers
      .flatMap(mapper => mapper.beatmaps || [])
      .map(beatmap => getApprovedYear(beatmap.approved_date))
      .filter((year): year is string => Boolean(year))
  )).sort((a, b) => Number(b) - Number(a))
}

export function beatmapMatchesFilters(
  beatmap: Beatmap,
  selectedModes: Set<string>,
  selectedStatuses: Set<string>,
  selectedYear: string = ALL_YEARS
): boolean {
  return selectedModes.has(beatmap.mode || '0') &&
    selectedStatuses.has(beatmap.approved || '1') &&
    matchesSelectedYear(beatmap.approved_date, selectedYear)
}

export function beatmapsetMatchesFilters(
  beatmapset: Beatmapset | BeatmapsetGroup,
  selectedModes: Set<string>,
  selectedStatuses: Set<string>,
  selectedYear: string = ALL_YEARS
): boolean {
  const hasMatchingStatus = selectedStatuses.has(beatmapset.approved || '1')
  const hasMatchingYear = matchesSelectedYear(beatmapset.approved_date, selectedYear)
  const hasMatchingMode = beatmapset.difficulties && beatmapset.difficulties.some(diff =>
    selectedModes.has(diff.mode)
  )
  const hasModeInArray = !hasMatchingMode && beatmapset.modes && beatmapset.modes.some(mode =>
    selectedModes.has(mode)
  )

  return hasMatchingStatus && hasMatchingYear && (hasMatchingMode || hasModeInArray)
}

export function filterMapperMaps(
  mapper: Mapper,
  selectedModes: Set<string>,
  selectedStatuses: Set<string>,
  selectedYear: string = ALL_YEARS
): Mapper {
  const beatmaps = (mapper.beatmaps || []).filter(beatmap =>
    beatmapMatchesFilters(beatmap, selectedModes, selectedStatuses, selectedYear)
  )
  const beatmapsBySet = new Set(beatmaps.map(beatmap => beatmap.beatmapset_id))
  const beatmapsets = (mapper.beatmapsets || []).filter(beatmapset =>
    beatmapsetMatchesFilters(beatmapset, selectedModes, selectedStatuses, selectedYear) &&
    beatmapsBySet.has(beatmapset.beatmapset_id)
  )

  return {
    ...mapper,
    beatmaps,
    beatmapsets,
    rankedBeatmaps: beatmaps.length,
    rankedBeatmapsets: beatmapsets.length,
    stats: {
      ...mapper.stats,
      totalBeatmaps: beatmaps.length,
      totalBeatmapsets: beatmapsets.length
    }
  }
}

/**
 * Filters mappers based on search term and mode/status filters
 * Only includes mappers that have beatmapsets matching the selected modes and statuses
 * 
 * @param mappers Array of mappers to filter
 * @param searchTerm Search term to filter by
 * @param selectedModes Set of selected game modes
 * @param selectedStatuses Set of selected beatmap statuses
 * @returns Filtered array of mappers
 */
export function filterMappers(
  mappers: Mapper[],
  searchTerm: string,
  selectedModes: Set<string>,
  selectedStatuses: Set<string>,
  selectedYear: string = ALL_YEARS
): Mapper[] {
  // Filter mappers based on search term using shared utility
  let filtered = mappers
    .filter(mapper => searchInMapper(mapper, searchTerm))
    .map(mapper => filterMapperMaps(mapper, selectedModes, selectedStatuses, selectedYear))
  
  // Filter out mappers who have no beatmapsets matching the selected modes and statuses
  filtered = filtered.filter(mapper => {
    return (mapper.beatmapsets || []).length > 0 || (mapper.beatmaps || []).length > 0
  })
  
  return filtered
}

/**
 * Filters beatmapsets based on search term, modes, and statuses
 * 
 * @param beatmapsets Array of beatmapsets to filter
 * @param searchTerm Search term to filter by
 * @param selectedModes Set of selected game modes
 * @param selectedStatuses Set of selected beatmap statuses
 * @returns Filtered array of beatmapsets
 */
export function filterBeatmapsets(
  beatmapsets: BeatmapsetGroup[],
  searchTerm: string,
  selectedModes: Set<string>,
  selectedStatuses: Set<string>,
  selectedYear: string = ALL_YEARS
): BeatmapsetGroup[] {
  let filtered = beatmapsets

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(set =>
      (set.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (set.artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (set.creator || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  filtered = filtered.filter(set =>
    beatmapsetMatchesFilters(set, selectedModes, selectedStatuses, selectedYear)
  )

  return filtered
}

/**
 * Collects all beatmapsets from all mappers by constructing them from individual beatmaps
 * 
 * @param mappers Array of mappers
 * @returns Array of all beatmapsets from all mappers
 */
export function getAllBeatmapsetsFromMappers(mappers: Mapper[]): BeatmapsetGroup[] {
  // Ensure mappers is an array before iterating
  if (!Array.isArray(mappers)) {
    return []
  }

  // Collect all beatmaps from all mappers
  const allBeatmaps: any[] = []
  mappers.forEach(mapper => {
    const beatmaps = mapper.beatmaps || []
    allBeatmaps.push(...beatmaps)
  })

  // Use shared utility to construct beatmapsets
  return constructBeatmapsetsFromBeatmaps(allBeatmaps)
}

/**
 * Calculates statistics for filtered mappers based on selected modes
 * 
 * @param filteredMappers Array of filtered mappers
 * @param selectedModes Set of selected game modes
 * @param totalStats Total stats from the data file
 * @returns Object containing calculated statistics
 */
export function calculateFilteredStats(
  filteredMappers: Mapper[]
) {
  return {
    mapperCount: filteredMappers.length,
    beatmapCount: filteredMappers.reduce((total, mapper) => total + (mapper.beatmaps?.length || 0), 0),
    beatmapsetCount: new Set(
      filteredMappers.flatMap(mapper => (mapper.beatmapsets || []).map(beatmapset => beatmapset.beatmapset_id))
    ).size
  }
}

/**
 * Common toggle function for mode selection
 * 
 * @param mode Mode to toggle
 * @param selectedModes Current set of selected modes
 * @returns New set of selected modes
 */
export function toggleMode(mode: string, selectedModes: Set<string>): Set<string> {
  const newModes = new Set(selectedModes)
  if (newModes.has(mode)) {
    newModes.delete(mode)
  } else {
    newModes.add(mode)
  }
  return newModes
}

/**
 * Common toggle function for status selection
 * 
 * @param status Status to toggle
 * @param selectedStatuses Current set of selected statuses
 * @returns New set of selected statuses
 */
export function toggleStatus(status: string, selectedStatuses: Set<string>): Set<string> {
  const newStatuses = new Set(selectedStatuses)
  if (newStatuses.has(status)) {
    newStatuses.delete(status)
  } else {
    newStatuses.add(status)
  }
  return newStatuses
}
