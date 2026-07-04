// Shared utility functions for the osu! Mappers Atlas application

export const getModeIcon = (mode: string) => {
  switch (mode) {
    case '0': return '🔴' // osu! (filled red circle)
    case '1': return '🥁' // Taiko
    case '2': return '🍎' // Catch the Beat
    case '3': return '🎹' // osu!mania
    default: return '🔴'
  }
}

export const getModeName = (mode: string) => {
  switch (mode) {
    case '0': return 'osu!'
    case '1': return 'Taiko'
    case '2': return 'Catch the Beat'
    case '3': return 'osu!mania'
    default: return 'osu!'
  }
}

export const getApprovedStatus = (approved: string | undefined) => {
  // Default to ranked if no approved status is provided (common for older data)
  const status = approved || '1'
  
  switch (status) {
    case '1': return { text: 'Ranked', emoji: '🏆', color: 'text-yellow-600' }
    case '2': return { text: 'Approved', emoji: '✅', color: 'text-green-600' }
    case '3': return { text: 'Qualified', emoji: '⏳', color: 'text-blue-600' }
    case '4': return { text: 'Loved', emoji: '💖', color: 'text-pink-600' }
    default: return { text: 'Ranked', emoji: '🏆', color: 'text-yellow-600' }
  }
}

export const formatNumber = (num: string | number) => {
  const numValue = typeof num === 'string' ? parseInt(num) || 0 : num
  return numValue.toLocaleString()
}

export const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const searchInMapper = (mapper: any, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase()
  
  // Search in username
  if (mapper.username.toLowerCase().includes(term)) return true
  
  // Search in aliases if available
  if (mapper.aliases && mapper.aliases.some((alias: string) => 
    alias.toLowerCase().includes(term)
  )) return true
  
  // Search in beatmaps
  if (mapper.beatmaps && mapper.beatmaps.some((beatmap: any) =>
    beatmap.title.toLowerCase().includes(term) ||
    beatmap.artist.toLowerCase().includes(term)
  )) return true
  
  return false
}
