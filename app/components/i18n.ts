// Internationalization utilities and translations.

export type Language = 'ko' | 'en'

export interface Translations {
  title: string
  subtitle: string
  backToHome: string
  allBeatmaps: string
  browseAllBeatmaps: string
  searchPlaceholder: string
  noResults: string
  filterByMode: string
  filterByStatus: string
  ranked: string
  approved: string
  qualified: string
  loved: string
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
  beatmapsets: string
  beatmaps: string
  favorites: string
  playcount: string
  newMapper: string
  starRating: string
  length: string
  bpm: string
  approvedDate: string
  cardView: string
  thumbnailView: string
  minimalView: string
  totalMappers: string
  totalBeatmaps: string
  totalBeatmapsets: string
  language: string
  korean: string
  english: string
  osuStandard: string
  taiko: string
  catchTheBeat: string
  osuMania: string
  lastUpdated: string
  noMappersFound: string
  viewOnGitHub: string
  footerText: string
  description: string
  countriesIndexed: string
  switchCountriesHelp: string
  loadingMapperData: string
  loadingBeatmapData: string
  loadingMoreBeatmapsets: string
  country: string
  countrySearchPlaceholder: string
  selectedCountry: string
  mapperSignalMap: string
  mappersIndexed: string
  noMapperDataYet: string
  topCountriesByMappers: string
  mapZoomControls: string
  zoomIn: string
  zoomOut: string
  resetMap: string
  mappers: string
  alsoKnownAs: string
  recentlyRankedMap: string
  sortedBy: string
  showLess: string
  more: string
  byArtist: string
  mappedBy: string
  openOnOsu: string
  difficulty: string
  difficulties: string
  unknown: string
  noMapperDataGenerated: string
  generateCountryHint: string
  retry: string
  allMapsSubtitle: string
  showingBeatmapsets: string
  loadMore: string
  noBeatmapsetsFound: string
  endOfResults: string
  ascending: string
  descending: string
}

export const translations: Record<Language, Translations> = {
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
    approved: 'Approved',
    qualified: 'Qualified',
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
    sortByPlaycount: 'Play count',
    beatmapsets: 'Beatmapsets',
    beatmaps: 'Beatmaps',
    favorites: 'Favorites',
    playcount: 'Play count',
    newMapper: 'New',
    starRating: 'Star Rating',
    length: 'Length',
    bpm: 'BPM',
    approvedDate: 'Approved Date',
    cardView: 'Card View',
    thumbnailView: 'Thumbnail View',
    minimalView: 'Minimal View',
    totalMappers: 'Total Mappers',
    totalBeatmaps: 'Total Beatmaps',
    totalBeatmapsets: 'Total Beatmapsets',
    language: 'Language',
    korean: 'Korean',
    english: 'English',
    osuStandard: 'osu!',
    taiko: 'Taiko',
    catchTheBeat: 'Catch',
    osuMania: 'Mania',
    lastUpdated: 'Last updated',
    noMappersFound: 'No mappers found matching your search.',
    viewOnGitHub: 'View on GitHub',
    footerText: 'Data sourced from osu! API and refreshed by GitHub Actions',
    description: 'Discover osu! mappers and their ranked or loved beatmaps by country.',
    countriesIndexed: 'osu! countries indexed',
    switchCountriesHelp: 'Switch countries to browse every osu! country recognized by the current country rankings.',
    loadingMapperData: 'Loading mapper data...',
    loadingBeatmapData: 'Loading beatmap data...',
    loadingMoreBeatmapsets: 'Loading more beatmapsets...',
    country: 'Country',
    countrySearchPlaceholder: 'Search countries...',
    selectedCountry: 'Selected country',
    mapperSignalMap: 'Mapper signal map',
    mappersIndexed: 'mappers indexed',
    noMapperDataYet: 'No mapper data yet',
    topCountriesByMappers: 'Top countries by mappers',
    mapZoomControls: 'Map zoom controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetMap: 'Reset map',
    mappers: 'Mappers',
    alsoKnownAs: 'Also known as',
    recentlyRankedMap: 'Recently ranked map',
    sortedBy: 'Sorted by',
    showLess: 'Show less',
    more: 'more',
    byArtist: 'by',
    mappedBy: 'Mapped by',
    openOnOsu: 'Open on osu! website',
    difficulty: 'difficulty',
    difficulties: 'difficulties',
    unknown: 'Unknown',
    noMapperDataGenerated: 'No mapper data has been generated for this country.',
    generateCountryHint: 'Generate this country with the fetch-data command, then run init-countries.',
    retry: 'Retry',
    allMapsSubtitle: 'Browse ranked and loved beatmapsets from this country.',
    showingBeatmapsets: 'Showing {shown} of {total} beatmapsets',
    loadMore: 'Load More',
    noBeatmapsetsFound: 'No beatmapsets found matching your criteria.',
    endOfResults: "You've reached the end of the results.",
    ascending: 'Ascending',
    descending: 'Descending'
  },
  ko: {
    title: 'osu! \uB9E4\uD37C \uC544\uD2C0\uB77C\uC2A4',
    subtitle: '\uAD6D\uAC00\uBCC4 osu! \uB9E4\uD37C\uC640 \uB7AD\uD06C \uBC0F \uB7EC\uBE0C\uB4DC \uBE44\uD2B8\uB9F5',
    backToHome: '\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30',
    allBeatmaps: '\uBAA8\uB4E0 \uBE44\uD2B8\uB9F5',
    browseAllBeatmaps: '\uBAA8\uB4E0 \uBE44\uD2B8\uB9F5 \uBCF4\uAE30',
    searchPlaceholder: '\uBE44\uD2B8\uB9F5\uC14B, \uC544\uD2F0\uC2A4\uD2B8, \uB9E4\uD37C \uAC80\uC0C9...',
    noResults: '\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4',
    filterByMode: '\uBAA8\uB4DC \uD544\uD130',
    filterByStatus: '\uC0C1\uD0DC \uD544\uD130',
    ranked: '\uB7AD\uD06C',
    approved: '\uC2B9\uC778',
    qualified: '\uD004\uB9AC\uD30C\uC774\uB4DC',
    loved: '\uB7EC\uBE0C\uB4DC',
    sortBy: '\uC815\uB82C',
    sortMappers: '\uB9E4\uD37C \uC815\uB82C',
    sortBeatmaps: '\uBE44\uD2B8\uB9F5 \uC815\uB82C',
    sortByName: '\uC774\uB984',
    sortByBeatmapsets: '\uBE44\uD2B8\uB9F5\uC14B',
    sortByBeatmaps: '\uC804\uCCB4 \uBE44\uD2B8\uB9F5',
    sortByRecent: '\uCD5C\uADFC \uD65C\uB3D9',
    sortByDate: '\uB0A0\uC9DC',
    sortByArtist: '\uC544\uD2F0\uC2A4\uD2B8',
    sortByTitle: '\uC81C\uBAA9',
    sortByFavorites: '\uC990\uACA8\uCC3E\uAE30',
    sortByPlaycount: '\uD50C\uB808\uC774 \uC218',
    beatmapsets: '\uBE44\uD2B8\uB9F5\uC14B',
    beatmaps: '\uBE44\uD2B8\uB9F5',
    favorites: '\uC990\uACA8\uCC3E\uAE30',
    playcount: '\uD50C\uB808\uC774 \uC218',
    newMapper: '\uC2E0\uADDC',
    starRating: '\uC2A4\uD0C0 \uB808\uC774\uD305',
    length: '\uAE38\uC774',
    bpm: 'BPM',
    approvedDate: '\uC2B9\uC778\uC77C',
    cardView: '\uCE74\uB4DC \uBCF4\uAE30',
    thumbnailView: '\uC378\uB124\uC77C \uBCF4\uAE30',
    minimalView: '\uAC04\uB2E8\uD788 \uBCF4\uAE30',
    totalMappers: '\uC804\uCCB4 \uB9E4\uD37C',
    totalBeatmaps: '\uC804\uCCB4 \uBE44\uD2B8\uB9F5',
    totalBeatmapsets: '\uC804\uCCB4 \uBE44\uD2B8\uB9F5\uC14B',
    language: '\uC5B8\uC5B4',
    korean: '\uD55C\uAD6D\uC5B4',
    english: '\uC601\uC5B4',
    osuStandard: 'osu!',
    taiko: 'Taiko',
    catchTheBeat: 'Catch',
    osuMania: 'Mania',
    lastUpdated: '\uB9C8\uC9C0\uB9C9 \uC5C5\uB370\uC774\uD2B8',
    noMappersFound: '\uC870\uAC74\uC5D0 \uB9DE\uB294 \uB9E4\uD37C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
    viewOnGitHub: 'GitHub\uC5D0\uC11C \uBCF4\uAE30',
    footerText: 'osu! API \uB370\uC774\uD130\uB85C \uC0DD\uC131\uB418\uBA70 GitHub Actions\uB85C \uAC31\uC2E0\uB429\uB2C8\uB2E4',
    description: '\uAD6D\uAC00\uBCC4 osu! \uB9E4\uD37C\uC640 \uB7AD\uD06C \uBC0F \uB7EC\uBE0C\uB4DC \uBE44\uD2B8\uB9F5\uC744 \uCC3E\uC544\uBCF4\uC138\uC694.',
    countriesIndexed: 'osu! \uAD6D\uAC00 \uC778\uB371\uC2F1\uB428',
    switchCountriesHelp: '\uD604\uC7AC \uAD6D\uAC00 \uB7AD\uD0B9\uC5D0\uC11C \uC778\uC2DD\uB418\uB294 \uBAA8\uB4E0 osu! \uAD6D\uAC00\uB97C \uC120\uD0DD\uD574 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
    loadingMapperData: '\uB9E4\uD37C \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...',
    loadingBeatmapData: '\uBE44\uD2B8\uB9F5 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911...',
    loadingMoreBeatmapsets: '\uBE44\uD2B8\uB9F5\uC14B\uC744 \uB354 \uBD88\uB7EC\uC624\uB294 \uC911...',
    country: '\uAD6D\uAC00',
    countrySearchPlaceholder: '\uAD6D\uAC00 \uAC80\uC0C9...',
    selectedCountry: '\uC120\uD0DD\uD55C \uAD6D\uAC00',
    mapperSignalMap: '\uB9E4\uD37C \uC2E0\uD638 \uC9C0\uB3C4',
    mappersIndexed: '\uB9E4\uD37C \uC778\uB371\uC2F1\uB428',
    noMapperDataYet: '\uC544\uC9C1 \uB9E4\uD37C \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4',
    topCountriesByMappers: '\uB9E4\uD37C \uC218 \uC0C1\uC704 \uAD6D\uAC00',
    mapZoomControls: '\uC9C0\uB3C4 \uD655\uB300/\uCD95\uC18C \uCEE8\uD2B8\uB864',
    zoomIn: '\uD655\uB300',
    zoomOut: '\uCD95\uC18C',
    resetMap: '\uC9C0\uB3C4 \uCD08\uAE30\uD654',
    mappers: '\uB9E4\uD37C',
    alsoKnownAs: '\uB2E4\uB978 \uC774\uB984',
    recentlyRankedMap: '\uCD5C\uADFC \uB7AD\uD06C\uB41C \uB9F5',
    sortedBy: '\uC815\uB82C \uAE30\uC900',
    showLess: '\uC811\uAE30',
    more: '\uAC1C \uB354 \uBCF4\uAE30',
    byArtist: '\uC544\uD2F0\uC2A4\uD2B8',
    mappedBy: '\uB9E4\uD37C',
    openOnOsu: 'osu! \uC6F9\uC0AC\uC774\uD2B8\uC5D0\uC11C \uC5F4\uAE30',
    difficulty: '\uB09C\uC774\uB3C4',
    difficulties: '\uB09C\uC774\uB3C4',
    unknown: '\uC54C \uC218 \uC5C6\uC74C',
    noMapperDataGenerated: '\uC774 \uAD6D\uAC00\uC758 \uB9E4\uD37C \uB370\uC774\uD130\uAC00 \uC544\uC9C1 \uC0DD\uC131\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.',
    generateCountryHint: 'fetch-data \uBA85\uB839\uC73C\uB85C \uC774 \uAD6D\uAC00\uB97C \uC0DD\uC131\uD55C \uB4A4 init-countries\uB97C \uC2E4\uD589\uD558\uC138\uC694.',
    retry: '\uB2E4\uC2DC \uC2DC\uB3C4',
    allMapsSubtitle: '\uC774 \uAD6D\uAC00\uC758 \uB7AD\uD06C \uBC0F \uB7EC\uBE0C\uB4DC \uBE44\uD2B8\uB9F5\uC14B\uC744 \uBCF4\uC138\uC694.',
    showingBeatmapsets: '{total}\uAC1C \uC911 {shown}\uAC1C \uBE44\uD2B8\uB9F5\uC14B \uD45C\uC2DC \uC911',
    loadMore: '\uB354 \uBCF4\uAE30',
    noBeatmapsetsFound: '\uC870\uAC74\uC5D0 \uB9DE\uB294 \uBE44\uD2B8\uB9F5\uC14B\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
    endOfResults: '\uBAA8\uB4E0 \uACB0\uACFC\uB97C \uD45C\uC2DC\uD588\uC2B5\uB2C8\uB2E4.',
    ascending: '\uC624\uB984\uCC28\uC21C',
    descending: '\uB0B4\uB9BC\uCC28\uC21C'
  }
}

export const getModeName = (mode: string, language: Language = 'en'): string => {
  const t = translations[language]
  switch (mode) {
    case '0': return t.osuStandard
    case '1': return t.taiko
    case '2': return t.catchTheBeat
    case '3': return t.osuMania
    default: return t.osuStandard
  }
}

export const countryMapperSubtitle = (countryName: string, language: Language): string => {
  return language === 'ko'
    ? `${countryName} \uB9E4\uD37C\uC758 \uB7AD\uD06C \uBC0F \uB7EC\uBE0C\uB4DC \uBE44\uD2B8\uB9F5\uC744 \uBCF4\uC138\uC694.`
    : `Discover ranked and loved beatmaps from ${countryName} mappers.`
}

export const countryMappersLabel = (countryName: string, language: Language): string => {
  return language === 'ko' ? `${countryName} \uB9E4\uD37C` : `${countryName} Mappers`
}

export const formatTemplate = (
  template: string,
  values: Record<string, string | number>
): string => {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template
  )
}

export const useTranslations = (language: Language) => {
  return translations[language]
}
