'use client'

import React, { useMemo, useState } from 'react'
import { Check, ChevronDown, Database, Globe2, Search } from 'lucide-react'
import { useCountry } from './CountryContext'
import { useLanguage } from './LanguageContext'

function canUseFlagImage(countryCode: string): boolean {
  return /^[A-Z]{2}$/.test(countryCode) && countryCode !== 'AP'
}

function flagImageUrl(countryCode: string): string {
  return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`
}

const CountryFlag: React.FC<{ countryCode: string }> = ({ countryCode }) => {
  const [hasImageError, setHasImageError] = useState(false)

  if (!canUseFlagImage(countryCode) || hasImageError) {
    return <>{countryCode}</>
  }

  return (
    <img
      src={flagImageUrl(countryCode)}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setHasImageError(true)}
    />
  )
}

export const CountrySelector: React.FC = () => {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const {
    countries,
    selectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    isLoadingCountries
  } = useCountry()
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredCountries = useMemo(() => {
    if (!normalizedSearch) return countries

    return countries.filter(country => {
      const searchable = [
        country.code,
        country.name,
        country.demonym,
        country.nativeName
      ].filter(Boolean).join(' ').toLowerCase()

      return searchable.includes(normalizedSearch)
    })
  }, [countries, normalizedSearch])

  const selectCountry = (countryCode: string) => {
    setSelectedCountryCode(countryCode)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="atlas-card relative w-full max-w-3xl p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 font-mono text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
            <CountryFlag countryCode={selectedCountryCode} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              <Globe2 className="h-3.5 w-3.5" />
              {t.country}
            </span>
            <button
              type="button"
              disabled={isLoadingCountries}
              onClick={() => setIsOpen(open => !open)}
              className="mt-1 flex w-full items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-base font-semibold text-slate-950 outline-none transition focus:border-osu-pink focus:ring-2 focus:ring-osu-pink/30 disabled:cursor-wait disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <span className="truncate">{selectedCountry.name} ({selectedCountryCode})</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Database className="h-4 w-4 text-osu-blue" />
          {selectedCountry.hasData
            ? `${selectedCountry.mapperCount || 0} ${t.mappersIndexed}`
            : t.noMapperDataYet}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-3 right-3 top-[calc(100%-0.5rem)] z-30 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/40">
          <label className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-slate-300">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false)
              }}
              autoFocus
              placeholder={t.countrySearchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="max-h-72 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? filteredCountries.map(country => (
              <button
                key={country.code}
                type="button"
                onClick={() => selectCountry(country.code)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
              >
                <span className="flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-slate-800 font-mono text-[10px] font-semibold">
                  <CountryFlag countryCode={country.code} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{country.name}</span>
                  <span className="block truncate font-mono text-xs text-slate-400">{country.code}</span>
                </span>
                {country.hasData && (
                  <span className="rounded-sm bg-osu-blue/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-osu-blue">
                    {country.mapperCount || 0}
                  </span>
                )}
                {country.code === selectedCountryCode && <Check className="h-4 w-4 shrink-0 text-osu-pink" />}
              </button>
            )) : (
              <div className="px-3 py-6 text-center text-sm text-slate-400">{t.noResults}</div>
            )}
          </div>
        </div>
      )}

      {!selectedCountry.hasData && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          {t.generateCountryHint}
        </p>
      )}
    </div>
  )
}
