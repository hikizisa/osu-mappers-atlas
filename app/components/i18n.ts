// Internationalization utilities and translations

export type Language = 'ko' | 'en'

export interface Translations {
  // Header and Navigation
  title: string
  subtitle: string
  backToHome: string
  allBeatmaps: string
  browseAllBeatmaps: string

  // Search and Filters
  searchPlaceholder: string
  noResults: string
  filterByMode: string
  filterByStatus: string
  ranked: string
  loved: string

  // Sorting
  sortBy: string
  sortMappers: string
  sortBeatmaps: string
  sortByName: string
  sortByBeatmapsets: string
  sortByBeatmaps: string
  sortByRecent: string
  sortByDate: string
  sortByArtist: string
  sortByTitle: string
  sortByFavorites: string
  sortByPlaycount: string

  // Mapper Info
  beatmapsets: string
  beatmaps: string
  favorites: string
  playcount: string
  newMapper: string

  // Beatmap Info
  starRating: string
  length: string
  bpm: string
  approvedDate: string

  // Display Options
  cardView: string
  thumbnailView: string
  minimalView: string

  // Stats
  totalMappers: string
  totalBeatmapsets: string

  // Language Toggle
  language: string
  korean: string
  english: string

  // Modes
  osuStandard: string
  taiko: string
  catchTheBeat: string
  osuMania: string

  // Footer
  lastUpdated: string
  noMappersFound: string
  viewOnGitHub: string
  footerText: string

  // Footer/Description
  description: string
}

export const translations: Record<Language, Translations> = {
  ko: {
    title: 'osu! 매퍼 아틀라스',
    subtitle: '국가별 osu! 매퍼와 랭크 및 러브드 비트맵을 둘러보세요',
    backToHome: '홈으로 돌아가기',
    allBeatmaps: '모든 비트맵',
    browseAllBeatmaps: '모든 비트맵 보기',

    searchPlaceholder: '비트맵셋, 아티스트, 매퍼 검색...',
    noResults: '검색 결과가 없습니다',
    filterByMode: '모드 필터',
    filterByStatus: '상태 필터',
    ranked: '랭크',
    loved: '러브드',

    sortBy: '정렬',
    sortMappers: '매퍼 정렬',
    sortBeatmaps: '비트맵 정렬',
    sortByName: '이름',
    sortByBeatmapsets: '비트맵셋',
    sortByBeatmaps: '전체 비트맵',
    sortByRecent: '최근 활동',
    sortByDate: '날짜',
    sortByArtist: '아티스트',
    sortByTitle: '제목',
    sortByFavorites: '즐겨찾기',
    sortByPlaycount: '플레이 수',

    beatmapsets: '비트맵셋',
    beatmaps: '비트맵',
    favorites: '즐겨찾기',
    playcount: '플레이 수',
    newMapper: '신규',

    starRating: '스타 레이팅',
    length: '길이',
    bpm: 'BPM',
    approvedDate: '승인일',

    cardView: '카드 보기',
    thumbnailView: '썸네일 보기',
    minimalView: '간단히 보기',

    totalMappers: '전체 매퍼',
    totalBeatmapsets: '전체 비트맵셋',

    language: '언어',
    korean: '한국어',
    english: 'English',

    osuStandard: 'osu!',
    taiko: 'Taiko',
    catchTheBeat: 'Catch',
    osuMania: 'Mania',

    lastUpdated: '마지막 업데이트',
    noMappersFound: '검색 조건에 맞는 매퍼가 없습니다.',
    viewOnGitHub: 'GitHub에서 보기',
    footerText: 'osu! API 데이터로 생성되며 GitHub Actions로 갱신됩니다',

    description: '국가별 osu! 매퍼와 그들의 랭크 및 러브드 비트맵을 찾아보세요.'
  },

  en: {
    title: 'osu! Mappers Atlas',
    subtitle: 'Discover osu! mappers and ranked or loved beatmaps by country',
    backToHome: 'Back to Home',
    allBeatmaps: 'All Beatmaps',
    browseAllBeatmaps: 'Browse All Beatmaps',

    searchPlaceholder: 'Search beatmapsets, artists, or mappers...',
    noResults: 'No results found',
    filterByMode: 'Filter by Mode',
    filterByStatus: 'Filter by Status',
    ranked: 'Ranked',
    loved: 'Loved',

    sortBy: 'Sort by',
    sortMappers: 'Sort mappers',
    sortBeatmaps: 'Sort beatmaps',
    sortByName: 'Name',
    sortByBeatmapsets: 'Beatmapsets',
    sortByBeatmaps: 'Total Beatmaps',
    sortByRecent: 'Recent Activity',
    sortByDate: 'Date',
    sortByArtist: 'Artist',
    sortByTitle: 'Title',
    sortByFavorites: 'Favorites',
    sortByPlaycount: 'Playcount',

    beatmapsets: 'beatmapsets',
    beatmaps: 'beatmaps',
    favorites: 'favorites',
    playcount: 'playcount',
    newMapper: 'New',

    starRating: 'Star Rating',
    length: 'Length',
    bpm: 'BPM',
    approvedDate: 'Approved Date',

    cardView: 'Card View',
    thumbnailView: 'Thumbnail View',
    minimalView: 'Minimal View',

    totalMappers: 'Total Mappers',
    totalBeatmapsets: 'Total Beatmapsets',

    language: 'Language',
    korean: '한국어',
    english: 'English',

    osuStandard: 'osu!',
    taiko: 'Taiko',
    catchTheBeat: 'Catch',
    osuMania: 'Mania',

    lastUpdated: 'Last updated',
    noMappersFound: 'No mappers found matching your search.',
    viewOnGitHub: 'View on GitHub',
    footerText: 'Data sourced from osu! API and refreshed by GitHub Actions',

    description: 'Discover osu! mappers and their ranked or loved beatmaps by country.'
  }
}

export const getModeName = (mode: string, language: Language = 'ko'): string => {
  const t = translations[language]
  switch (mode) {
    case '0': return t.osuStandard
    case '1': return t.taiko
    case '2': return t.catchTheBeat
    case '3': return t.osuMania
    default: return t.osuStandard
  }
}

export const useTranslations = (language: Language) => {
  return translations[language]
}
