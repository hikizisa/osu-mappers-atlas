'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User, Calendar, Trophy, ExternalLink, Github, ChevronDown, ChevronUp, Compass } from 'lucide-react'
import { Mapper, MapperSortOption, SortOption, BeatmapsetGroup } from './components/types'
import { MapperCard } from './components/MapperCard'
import { processMapperData } from './components/beatmapset-utils'
import { getModeIcon, formatNumber, formatDate } from './components/utils'
import { sortMappers, calculateMostRecentRankedDate } from './components/sorting'
import { fetchData } from './components/api-utils'
import { filterMappers, calculateFilteredStats, toggleMode as toggleModeUtil } from './components/page-utils'
import { useLanguage } from './components/LanguageContext'
import { LanguageToggle } from './components/LanguageToggle'
import { FloatingDisplayToggle } from './components/FloatingDisplayToggle'
import { AnimatedList } from './components/AnimatedList'
import { getModeName } from './components/i18n'
import { useCountry } from './components/CountryContext'
import { CountrySelector } from './components/CountrySelector'

// Interfaces moved to shared components/types.ts

export default function Home() {
  const { language, t } = useLanguage()
  const { countries, selectedCountry, selectedCountryCode } = useCountry()
  const [mappers, setMappers] = useState<Mapper[]>([])
  const [filteredMappers, setFilteredMappers] = useState<Mapper[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [totalStats, setTotalStats] = useState<any>({})
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set(['0', '1', '2', '3']))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['1', '4'])) // ranked and loved
  const [displayStyle, setDisplayStyle] = useState<'card' | 'thumbnail' | 'minimal'>('card')

  const [beatmapSortBy, setBeatmapSortBy] = useState<SortOption>('date')
  const [beatmapSortDirection, setBeatmapSortDirection] = useState<'asc' | 'desc'>('desc')

  const [mapperSortBy, setMapperSortBy] = useState<MapperSortOption>('name')
  const [mapperSortDirection, setMapperSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedMappers, setExpandedMappers] = useState<Set<string>>(new Set())

  useEffect(() => {
    let isCurrent = true

    setLoading(true)
    setDataError(null)
    setMappers([])
    setFilteredMappers([])

    fetchData(`data/mappers-${selectedCountryCode.toLowerCase()}.json`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`No mapper data found for ${selectedCountryCode}`)
        }
        return res.json()
      })
      .then(data => {
        if (!isCurrent) return
        // Process mappers using shared utility function
        const processedMappers = (data.mappers || []).map(processMapperData)
        
        setMappers(processedMappers)
        setFilteredMappers(processedMappers)
        setLastUpdated(data.lastUpdated || '')
        setTotalStats({
          totalMappers: data.totalMappers || 0,
          totalBeatmaps: data.totalBeatmaps || 0,
          totalBeatmapsets: data.totalBeatmapsets || 0,
          totalOwnBeatmapsets: data.totalOwnBeatmapsets || 0,
          totalGuestBeatmapsets: data.totalGuestBeatmapsets || 0,
          totalGuestDiffs: data.totalGuestDiffs || 0,
          totalOwnDifficulties: data.totalOwnDifficulties || 0
        })
        setLoading(false)
      })
      .catch(err => {
        if (!isCurrent) return
        console.error('Error loading mapper data:', err)
        setDataError(`No mapper data has been generated for ${selectedCountry.name}.`)
        setLastUpdated('')
        setTotalStats({})
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [selectedCountryCode, selectedCountry.name])

  useEffect(() => {
    // Filter mappers using shared utility
    let filtered = filterMappers(mappers, searchTerm, selectedModes, selectedStatuses)
    
    // Sort mappers using shared sorting utility (considering current filters)
    filtered = sortMappers(filtered, mapperSortBy, mapperSortDirection, selectedModes, selectedStatuses)
    
    setFilteredMappers(filtered)
  }, [searchTerm, mappers, mapperSortBy, mapperSortDirection, selectedModes, selectedStatuses])

  const toggleMapper = (mapperId: string) => {
    const newExpanded = new Set(expandedMappers)
    if (newExpanded.has(mapperId)) {
      newExpanded.delete(mapperId)
    } else {
      newExpanded.add(mapperId)
    }
    setExpandedMappers(newExpanded)
  }

  const toggleMode = (mode: string) => {
    const newModes = new Set(selectedModes)
    if (newModes.has(mode)) {
      newModes.delete(mode)
    } else {
      newModes.add(mode)
    }
    setSelectedModes(newModes)
  }

  if (loading) {
    return (
      <div className="atlas-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-osu-pink mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading {selectedCountry.name} mappers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="atlas-shell">
      {/* Header */}
      <header className="atlas-header">
        <div className="container relative mx-auto px-4 py-8 md:py-10">
          <div className="flex justify-end mb-6">
            <LanguageToggle />
          </div>
          <div className="text-center mb-8">
            <p className="atlas-kicker mb-3">{countries.length} osu! countries indexed</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Compass className="h-9 w-9 text-osu-pink" />
              <h1 className="atlas-title">
                osu! Mappers Atlas
              </h1>
            </div>
            <p className="atlas-subtitle mb-8">
              Discover ranked and loved beatmaps from {selectedCountry.name} mappers.
            </p>
            <div className="mb-8 flex justify-center">
              <CountrySelector />
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <Link
                href="/all-maps"
                className="atlas-primary-action"
              >
                <Calendar className="h-5 w-5" />
                {t.browseAllBeatmaps}
              </Link>
            </div>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Switch countries to browse every osu! country recognized by the current country rankings.
            </p>
            {lastUpdated && (
              <p className="mt-2 font-mono text-xs text-slate-500">
{t.lastUpdated}: {formatDate(lastUpdated)}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="atlas-search-input pl-10"
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="atlas-stat-card">
            <User className="h-6 w-6 text-osu-pink mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {calculateFilteredStats(filteredMappers, selectedModes, totalStats).mapperCount}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCountry.name} Mappers</p>
          </div>
          <div className="atlas-stat-card">
            <Trophy className="h-6 w-6 text-osu-blue mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {calculateFilteredStats(filteredMappers, selectedModes, totalStats).beatmapCount}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Beatmaps</p>
          </div>
          <div className="atlas-stat-card">
            <div className="h-6 w-6 text-emerald-600 mx-auto mb-2 flex items-center justify-center font-bold text-lg">#</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {calculateFilteredStats(filteredMappers, selectedModes, totalStats).beatmapsetCount}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalBeatmapsets}</p>
          </div>
        </div>

        {/* Controls - Sticky */}
        <div className="atlas-panel sticky top-4 z-10 p-6 mb-8">
          <div className="space-y-4">


            {/* Second Row: Status Filter and Game Modes */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

              {/* Game Mode Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.filterByMode}:</label>
                <div className="flex gap-1 flex-wrap">
                  {['0', '1', '2', '3'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => toggleMode(mode)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ease-in-out hover:scale-105 ${
                        selectedModes.has(mode)
                          ? 'bg-osu-pink text-white shadow-md'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                       title={getModeName(mode, language)}
                    >
                      {getModeIcon(mode)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Third Row: Sorting Options */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
              {/* Mapper Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.sortMappers}:</label>
                <div className="flex items-center gap-1">
                  <select
                    value={mapperSortBy}
                    onChange={(e) => {
                      const newSortBy = e.target.value as MapperSortOption
                      setMapperSortBy(newSortBy)
                      // Set default direction for Recent Activity to show most recent first
                      if (newSortBy === 'recent') {
                        setMapperSortDirection('desc')
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-l-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all duration-200 ease-in-out appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="name">{t.sortByName}</option>
                    <option value="mapsets">{t.sortByBeatmapsets}</option>
                    {/* <option value="beatmaps">Total Beatmaps</option> */}
                    <option value="recent">{t.sortByRecent}</option>
                  </select>
                  <button
                    onClick={() => setMapperSortDirection(mapperSortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 border border-l-0 border-gray-300 rounded-r-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all duration-200 ease-in-out"
                    title={mapperSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {mapperSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Beatmap Sort */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.sortBeatmaps}:</label>
                <div className="flex items-center gap-1">
                  <select
                    value={beatmapSortBy}
                    onChange={(e) => setBeatmapSortBy(e.target.value as SortOption)}
                    className="px-3 py-1 border border-gray-300 rounded-l-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all duration-200 ease-in-out appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="date">{t.sortByDate}</option>
                    <option value="artist">{t.sortByArtist}</option>
                    <option value="title">{t.sortByTitle}</option>
                    <option value="favorite">{t.sortByFavorites}</option>
                    <option value="playcount">{t.sortByPlaycount}</option>
                  </select>
                  <button
                    onClick={() => setBeatmapSortDirection(beatmapSortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 border border-l-0 border-gray-300 rounded-r-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-osu-pink focus:border-transparent transition-all duration-200 ease-in-out"
                    title={beatmapSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {beatmapSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mappers List */}
        <AnimatedList
          items={filteredMappers}
          getKey={(mapper) => mapper.user_id}
          className="space-y-8"
          renderItem={(mapper, index) => (
            <MapperCard
              mapper={mapper}
              selectedModes={selectedModes}
              selectedStatuses={selectedStatuses}
              displayStyle={displayStyle}
              isExpanded={expandedMappers.has(mapper.user_id)}
              onToggle={toggleMapper}
              beatmapSortBy={beatmapSortBy}
              beatmapSortDirection={beatmapSortDirection}
            />
          )}
        />

        {dataError && !loading && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center shadow-sm dark:border-amber-700 dark:bg-amber-900/30">
            <p className="text-lg font-semibold text-amber-950 dark:text-amber-50">{dataError}</p>
            <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
              Run <code className="font-semibold">npm run fetch-data -- --country={selectedCountryCode}</code>, then <code className="font-semibold">npm run init-countries</code>.
            </p>
          </div>
        )}

        {filteredMappers.length === 0 && !loading && !dataError && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t.noMappersFound}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Github className="h-5 w-5 text-gray-600" />
            <a
              href="https://github.com/hikizisa/osu-mappers-atlas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-osu-pink transition-colors"
            >
              {t.viewOnGitHub}
            </a>
          </div>
          <p className="text-sm text-gray-500">
            {t.footerText}
          </p>
        </div>
      </footer>
      
      {/* Floating Display Toggle */}
      <FloatingDisplayToggle
        displayStyle={displayStyle}
        onDisplayStyleChange={setDisplayStyle}
      />
    </div>
  )
}
