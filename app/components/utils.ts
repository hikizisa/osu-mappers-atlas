// Shared utility functions for the osu! Mappers Atlas application.

export const getModeIcon = (mode: string) => {
  switch (mode) {
    case '0': return 'osu'
    case '1': return 'Ta'
    case '2': return 'Ct'
    case '3': return 'Mn'
    default: return 'osu'
  }
}

export const getModeName = (mode: string) => {
  switch (mode) {
    case '0': return 'osu!'
    case '1': return 'Taiko'
    case '2': return 'Catch'
    case '3': return 'Mania'
    default: return 'osu!'
  }
}

export const getApprovedStatus = (approved: string | undefined) => {
  const status = approved || '1'

  switch (status) {
    case '1': return { text: 'Ranked', code: 'R', color: 'text-yellow-600' }
    case '2': return { text: 'Approved', code: 'A', color: 'text-green-600' }
    case '3': return { text: 'Qualified', code: 'Q', color: 'text-blue-600' }
    case '4': return { text: 'Loved', code: 'L', color: 'text-pink-600' }
    default: return { text: 'Ranked', code: 'R', color: 'text-yellow-600' }
  }
}

export const formatNumber = (num: string | number) => {
  const numValue = typeof num === 'string' ? parseInt(num) || 0 : num
  return numValue.toLocaleString()
}

export const formatDate = (dateStr: string, fallback = 'Unknown') => {
  if (!dateStr) return fallback
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const searchInMapper = (mapper: any, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase()

  if (mapper.username.toLowerCase().includes(term)) return true

  if (mapper.aliases && mapper.aliases.some((alias: string) =>
    alias.toLowerCase().includes(term)
  )) return true

  if (mapper.beatmaps && mapper.beatmaps.some((beatmap: any) =>
    beatmap.title.toLowerCase().includes(term) ||
    beatmap.artist.toLowerCase().includes(term)
  )) return true

  return false
}
