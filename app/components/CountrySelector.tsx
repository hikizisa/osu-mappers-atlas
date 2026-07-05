'use client'

import React, { useState } from 'react'
import { Database, Globe2 } from 'lucide-react'
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
  const {
    countries,
    selectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    isLoadingCountries
  } = useCountry()

  return (
    <div className="atlas-card w-full max-w-3xl p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 font-mono text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
            <CountryFlag countryCode={selectedCountryCode} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              <Globe2 className="h-3.5 w-3.5" />
              {t.country}
            </span>
            <select
              value={selectedCountryCode}
              onChange={(event) => setSelectedCountryCode(event.target.value)}
              disabled={isLoadingCountries}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-950 outline-none transition focus:border-osu-pink focus:ring-2 focus:ring-osu-pink/30 disabled:cursor-wait disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="flex shrink-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Database className="h-4 w-4 text-osu-blue" />
          {selectedCountry.hasData
            ? `${selectedCountry.mapperCount || 0} ${t.mappersIndexed}`
            : t.noMapperDataYet}
        </div>
      </div>

      {!selectedCountry.hasData && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          {t.generateCountryHint}
        </p>
      )}
    </div>
  )
}
