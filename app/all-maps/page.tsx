'use client'

import React, { useState, useEffect } from 'react'
import { Search, Calendar, Trophy, ExternalLink, Github, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { Mapper, BeatmapsetGroup, SortOption, SortDirection } from '../components/types'
import { BeatmapsetCard } from '../components/BeatmapsetCard'
import { getModeIcon, formatNumber, formatDate } from '../components/utils'
import { sortBeatmapsets } from '../components/sorting'
import { fetchData } from '../components/api-utils'
import { getAllBeatmapsetsFromMappers, filterBeatmapsets } from '../components/page-utils'
import { useLanguage } from '../components/LanguageContext'
import { LanguageToggle } from '../components/LanguageToggle'
import { FloatingDisplayToggle } from '../components/FloatingDisplayToggle'
import { getModeName } from '../components/i18n'
import { AnimatedList } from '../components/AnimatedList'
import { useCountry } from '../components/CountryContext'
import { CountrySelector } from '../components/CountrySelector'
import Link from 'next/link'

export default function AllMapsPage() {
  const { language, t } = useLanguage()
  const { selectedCountry, selectedCountryCode } = useCountry()
  const [mappers, setMappers] = useState<Mapper[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set(['0', '1', '2', '3']))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['1', '4'])) // ranked and loved
  const [displayStyle, setDisplayStyle] = useState<'card' | 'thumbnail' | 'minimal'>('card')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Virtual scrolling state
  const [allFilteredBeatmapsets, setAllFilteredBeatmapsets] = useState<BeatmapsetGroup[]>([])
  const [displayedBeatmapsets, setDisplayedBeatmapsets] = useState<BeatmapsetGroup[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  const ITEMS_PER_PAGE = 50 // Load 50 items at a time

  useEffect(() => {
    const fetchMappers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchData(`data/mappers-${selectedCountryCode.toLowerCase()}.json`)
        if (!response.ok) {
          throw new Error(`No mapper data has been generated for ${selectedCountry.name}.`)
        }
        const data = await response.json()
        setMappers(data.mappers || data)
      } catch (err) {
        setMappers([])
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMappers()
  }, [selectedCountryCode, selectedCountry.name])

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case '0': return '🔴' // osu! (filled red circle - cooler)
      case '1': return '🥁' // Taiko
      case '2': return '🍎' // Catch the Beat
      case '3': return '🎹' // osu!mania
      default: return '🔴'
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleMode = (mode: string) => {
    const newSelectedModes = new Set(selectedModes)
    if (newSelectedModes.has(mode)) {
      newSelectedModes.delete(mode)
    } else {
      newSelectedModes.add(mode)
    }
    setSelectedModes(newSelectedModes)
  }

  // Process and filter all beatmapsets (but don't render all at once)
  const processAllBeatmapsets = React.useCallback(() => {
    if (mappers.length === 0) return []
    
    let beatmapsets = getAllBeatmapsetsFromMappers(mappers)
    
    // Filter beatmapsets using shared utility
    beatmapsets = filterBeatmapsets(beatmapsets, searchTerm, selectedModes, selectedStatuses)
    
    // Sort beatmapsets using shared sorting utility
    beatmapsets = sortBeatmapsets(beatmapsets, sortBy, sortDirection)
    
    return beatmapsets
  }, [mappers, searchTerm, selectedModes, selectedStatuses, sortBy, sortDirection])

  // Update filtered beatmapsets when filters change
  useEffect(() => {
    const filtered = processAllBeatmapsets()
    setAllFilteredBeatmapsets(filtered)
    setCurrentPage(0)
    setDisplayedBeatmapsets(filtered.slice(0, ITEMS_PER_PAGE))
    setHasMore(filtered.length > ITEMS_PER_PAGE)
  }, [processAllBeatmapsets])

  // Load more items
  const loadMore = React.useCallback(() => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    
    // Simulate async loading for smooth UX
    setTimeout(() => {
      const nextPage = currentPage + 1
      const startIndex = nextPage * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = allFilteredBeatmapsets.slice(startIndex, endIndex)
      
      setDisplayedBeatmapsets(prev => [...prev, ...newItems])
      setCurrentPage(nextPage)
      setHasMore(endIndex < allFilteredBeatmapsets.length)
      setIsLoadingMore(false)
    }, 100)
  }, [currentPage, allFilteredBeatmapsets, isLoadingMore, hasMore])

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-osu-pink mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading {selectedCountry.name} beatmaps...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="mx-auto w-full max-w-3xl px-4 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Run <code className="font-semibold">npm run fetch-data -- --country={selectedCountryCode}</code>, then <code className="font-semibold">npm run init-countries</code>.
          </p>
          <div className="mb-4 flex justify-center">
            <CountrySelector />
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-osu-pink text-white rounded-lg hover:bg-osu-purple transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-osu-pink hover:text-osu-purple transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{t.backToHome}</span>
            </Link>
            <div className="flex items-center gap-3">
              <Github className="h-6 w-6 text-osu-pink" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-osu-pink via-osu-purple to-osu-blue bg-clip-text text-transparent">
                {t.allBeatmaps}
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              Browse ranked and loved beatmapsets from {selectedCountry.name} mappers.
            </p>
            <CountrySelector />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Controls - Sticky */}
        <div className="sticky top-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-lg animate-slide-in">
          <div className="space-y-4">
            {/* First Row: Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osu-pink focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ease-in-out"
                />
              </div>
              
              {/* Sort */}
              <div className="flex items-center gap-2 min-w-fit">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.sortBy}:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'artist' | 'title' | 'favorite' | 'playcount')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osu-pink focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ease-in-out"
                >
                  <option value="date">{t.sortByDate}</option>
                  <option value="artist">{t.sortByArtist}</option>
                  <option value="title">{t.sortByTitle}</option>
                  <option value="favorite">{t.sortByFavorites}</option>
                  <option value="playcount">{t.sortByPlaycount}</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out"
                  title={sortDirection === 'asc' ? (language === 'ko' ? '오름차순' : 'Ascending') : (language === 'ko' ? '내림차순' : 'Descending')}
                >
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Second Row: Mode Filter and Status Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Mode Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.filterByMode}:</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { mode: '0', name: 'osu!', icon: '🔴' },
                    { mode: '1', name: 'Taiko', icon: '🥁' },
                    { mode: '2', name: 'Catch', icon: '🍎' },
                    { mode: '3', name: 'Mania', icon: '🎹' }
                  ].map(({ mode, name, icon }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        const newModes = new Set(selectedModes)
                        if (newModes.has(mode)) {
                          newModes.delete(mode)
                        } else {
                          newModes.add(mode)
                        }
                        setSelectedModes(newModes)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                        selectedModes.has(mode)
                          ? 'bg-osu-pink text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={getModeName(mode, language)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.filterByStatus}:</label>
                <div className="flex gap-3 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has('1')}
                      onChange={(e) => {
                        const newStatuses = new Set(selectedStatuses)
                        if (e.target.checked) {
                          newStatuses.add('1')
                        } else {
                          newStatuses.delete('1')
                        }
                        setSelectedStatuses(newStatuses)
                      }}
                      className="rounded border-gray-300 text-osu-pink focus:ring-osu-pink"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">🏆 {t.ranked}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has('4')}
                      onChange={(e) => {
                        const newStatuses = new Set(selectedStatuses)
                        if (e.target.checked) {
                          newStatuses.add('4')
                        } else {
                          newStatuses.delete('4')
                        }
                        setSelectedStatuses(newStatuses)
                      }}
                      className="rounded border-gray-300 text-osu-pink focus:ring-osu-pink"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">💖 {t.loved}</span>
                  </label>
                </div>
              </div>
            </div>


          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {language === 'ko' 
              ? `${displayedBeatmapsets.length}/${allFilteredBeatmapsets.length}개의 비트맵셋 표시 중` 
              : `Showing ${displayedBeatmapsets.length} of ${allFilteredBeatmapsets.length} beatmapsets`
            }
          </div>
        </div>

        {/* Beatmapsets Grid/List */}
        <AnimatedList
          items={displayedBeatmapsets}
          getKey={(beatmapset) => beatmapset.beatmapset_id}
          className={displayStyle === 'minimal' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}
          renderItem={(beatmapset, index) => (
            <BeatmapsetCard
              beatmapset={beatmapset}
              selectedModes={selectedModes}
              displayStyle={displayStyle}
              showMapperName={true}
            />
          )}
        />

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="text-center py-8 animate-fade-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-osu-pink mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">
              {language === 'ko' ? '더 많은 비트맵셋을 불러오는 중...' : 'Loading more beatmapsets...'}
            </p>
          </div>
        )}

        {/* Load more button (fallback for users who prefer clicking) */}
        {!isLoadingMore && hasMore && displayedBeatmapsets.length > 0 && (
          <div className="text-center py-8">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-osu-pink text-white rounded-lg hover:bg-osu-pink-dark transition-colors duration-200 font-medium"
            >
              {language === 'ko' ? '더 보기' : 'Load More'}
            </button>
          </div>
        )}

        {/* No results message */}
        {allFilteredBeatmapsets.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {language === 'ko' ? '검색 조건에 맞는 비트맵셋을 찾을 수 없습니다.' : 'No beatmapsets found matching your criteria.'}
            </p>
          </div>
        )}

        {/* End of results message */}
        {!hasMore && displayedBeatmapsets.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'ko' ? '모든 비트맵셋을 표시했습니다.' : 'You\'ve reached the end of the results.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Floating Display Toggle */}
      <FloatingDisplayToggle
        displayStyle={displayStyle}
        onDisplayStyleChange={setDisplayStyle}
      />
    </div>
  )
}
