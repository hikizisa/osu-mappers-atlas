'use client'

import React from 'react'
import { Database, Globe2 } from 'lucide-react'
import { useCountry } from './CountryContext'

function flagEmoji(countryCode: string): string {
  if (!/^[A-Z]{2}$/.test(countryCode)) return '??'
  return countryCode
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

export const CountrySelector: React.FC = () => {
  const {
    countries,
    selectedCountry,
    selectedCountryCode,
    setSelectedCountryCode,
    isLoadingCountries
  } = useCountry()

  return (
    <div className="w-full max-w-3xl rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800/95">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-900 text-lg text-white dark:bg-white dark:text-gray-900">
            {flagEmoji(selectedCountryCode)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              <Globe2 className="h-3.5 w-3.5" />
              Country
            </span>
            <select
              value={selectedCountryCode}
              onChange={(event) => setSelectedCountryCode(event.target.value)}
              disabled={isLoadingCountries}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-semibold text-gray-900 outline-none transition focus:border-osu-pink focus:ring-2 focus:ring-osu-pink/30 disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code}){country.hasData ? ` - ${country.mapperCount || 0} mappers` : ''}
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="flex shrink-0 items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          <Database className="h-4 w-4 text-osu-blue" />
          {selectedCountry.hasData
            ? `${selectedCountry.mapperCount || 0} mappers indexed`
            : 'No mapper data yet'}
        </div>
      </div>

      {!selectedCountry.hasData && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          Generate this country with <code className="font-semibold">npm run fetch-data -- --country={selectedCountryCode}</code>, then run <code className="font-semibold">npm run init-countries</code>.
        </p>
      )}
    </div>
  )
}
