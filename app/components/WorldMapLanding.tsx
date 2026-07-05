'use client'

import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Graticule, Sphere, ZoomableGroup } from 'react-simple-maps'
import * as isoCountries from 'i18n-iso-countries'
import worldCountries from 'world-atlas/countries-110m.json'
import { Database, Globe2, LocateFixed, MapPinned, Minus, Plus, RotateCcw } from 'lucide-react'
import { CountryOption, useCountry } from './CountryContext'
import { CountrySelector } from './CountrySelector'
import { useLanguage } from './LanguageContext'
import { formatNumber } from './utils'

type GeographyDatum = {
  id?: string | number
  properties?: {
    name?: string
  }
  rsmKey?: string
}

const DEFAULT_CENTER: [number, number] = [4, 10]
const MIN_ZOOM = 1
const MAX_ZOOM = 6

function getCountryCode(geography: GeographyDatum): string | null {
  if (geography.properties?.name === 'Kosovo') return 'XK'

  const numericId = geography.id ? String(geography.id).padStart(3, '0') : ''
  return isoCountries.numericToAlpha2(numericId) || null
}

function mapperTone(mapperCount = 0): string {
  if (mapperCount >= 250) return '#ff66aa'
  if (mapperCount >= 100) return '#8866ee'
  if (mapperCount >= 40) return '#0066cc'
  if (mapperCount >= 10) return '#1f9fd6'
  if (mapperCount > 0) return '#6bbf8f'
  return '#d9e2ef'
}

function countryLabel(country: CountryOption): string {
  return `${country.name} (${country.code})`
}

export const WorldMapLanding: React.FC = () => {
  const { t } = useLanguage()
  const { countries, selectedCountry, selectedCountryCode, setSelectedCountryCode, isLoadingCountries } = useCountry()
  const [hoveredCountry, setHoveredCountry] = useState<CountryOption | null>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)

  const countryByCode = useMemo(() => {
    return new Map(countries.map(country => [country.code, country]))
  }, [countries])

  const rankedCountries = useMemo(() => {
    return countries
      .filter(country => country.hasData && (country.mapperCount || 0) > 0)
      .sort((a, b) => (b.mapperCount || 0) - (a.mapperCount || 0))
      .slice(0, 5)
  }, [countries])

  const focusedCountry = hoveredCountry || selectedCountry
  const selectedTone = mapperTone(selectedCountry.mapperCount || 0)
  const setBoundedZoom = (nextZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2)))))
  }

  const resetMapView = () => {
    setCenter(DEFAULT_CENTER)
    setZoom(1)
  }

  return (
    <section className="atlas-map-landing relative z-30 mx-auto mb-8 w-full max-w-6xl" aria-label="World mapper atlas">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch">
        <div className="atlas-map-stage">
          <div className="atlas-map-stage-header">
            <div>
              <p className="atlas-kicker mb-1">{t.mapperSignalMap}</p>
              <h2 className="text-xl font-bold text-slate-950 md:text-2xl">
                {countryLabel(selectedCountry)}
              </h2>
            </div>
            <div className="atlas-map-status" style={{ borderColor: selectedTone }}>
              <LocateFixed className="h-4 w-4" />
              {formatNumber(selectedCountry.mapperCount || 0)} {t.mappersIndexed}
            </div>
          </div>

          <div className="atlas-world-map" aria-busy={isLoadingCountries}>
            <div className="atlas-map-zoom-controls" aria-label={t.mapZoomControls}>
              <button
                type="button"
                onClick={() => setBoundedZoom(zoom + 0.65)}
                disabled={zoom >= MAX_ZOOM}
                aria-label={t.zoomIn}
                title={t.zoomIn}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setBoundedZoom(zoom - 0.65)}
                disabled={zoom <= MIN_ZOOM}
                aria-label={t.zoomOut}
                title={t.zoomOut}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetMapView}
                aria-label={t.resetMap}
                title={t.resetMap}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 158, center: DEFAULT_CENTER }}
              className="h-full w-full"
            >
              <defs>
                <filter id="atlas-country-glow" x="-35%" y="-35%" width="170%" height="170%">
                  <feGaussianBlur stdDeviation="2.4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ZoomableGroup
                center={center}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onMoveEnd={({ coordinates, zoom: nextZoom }) => {
                  setCenter(coordinates as [number, number])
                  setBoundedZoom(nextZoom)
                }}
              >
                <Sphere id="atlas-map-sphere" stroke="rgba(100,116,139,0.28)" strokeWidth={0.45} fill="transparent" />
                <Graticule id="atlas-map-graticule" stroke="rgba(100,116,139,0.18)" strokeWidth={0.45} />
                <Geographies geography={worldCountries}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const code = getCountryCode(geo as GeographyDatum)
                      const country = code ? countryByCode.get(code) : undefined
                      const isSelected = code === selectedCountryCode
                      const canSelect = Boolean(country)
                      const fill = country ? mapperTone(country.mapperCount || 0) : '#d9e2ef'

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          role={canSelect ? 'button' : 'img'}
                          tabIndex={canSelect ? 0 : -1}
                          aria-label={country ? `${countryLabel(country)}, ${country.mapperCount || 0} ${t.mappersIndexed}` : geo.properties?.name}
                          onClick={() => {
                            if (country) setSelectedCountryCode(country.code)
                          }}
                          onKeyDown={(event) => {
                            if (!country) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedCountryCode(country.code)
                            }
                          }}
                          onMouseEnter={() => setHoveredCountry(country || null)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          fill={fill}
                          stroke={isSelected ? '#334155' : 'rgba(255,255,255,0.74)'}
                          strokeWidth={isSelected ? 0.85 : 0.35}
                          filter={isSelected ? 'url(#atlas-country-glow)' : undefined}
                          className={canSelect ? 'atlas-map-country atlas-map-country--selectable' : 'atlas-map-country'}
                          style={{
                            default: {
                              outline: 'none',
                              opacity: country?.hasData === false ? 0.42 : 1,
                            },
                            hover: {
                              fill: canSelect ? '#334155' : fill,
                              outline: 'none',
                              cursor: canSelect ? 'pointer' : 'default',
                            },
                            pressed: {
                              fill: canSelect ? '#ff66aa' : fill,
                              outline: 'none',
                            },
                          }}
                        />
                      )
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        <aside className="atlas-map-sidebar" aria-live="polite">
          <div className="atlas-map-sidebar-head">
            <span className="atlas-map-sidebar-icon">
              <MapPinned className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="atlas-kicker mb-1">{t.selectedCountry}</p>
              <h3 className="truncate text-2xl font-bold text-white">
                {focusedCountry.name}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="atlas-map-metric">
              <Database className="h-4 w-4 text-osu-blue" />
              <span>{formatNumber(focusedCountry.mapperCount || 0)}</span>
              <small>{t.mappers}</small>
            </div>
            <div className="atlas-map-metric">
              <Globe2 className="h-4 w-4 text-osu-pink" />
              <span>{focusedCountry.code}</span>
              <small>{t.country}</small>
            </div>
          </div>

          <CountrySelector />

          <div className="atlas-map-rank">
            <p className="atlas-kicker mb-3">{t.topCountriesByMappers}</p>
            <div className="space-y-2">
              {rankedCountries.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(country.code)}
                  className={`atlas-map-rank-item ${country.code === selectedCountryCode ? 'atlas-map-rank-item--active' : ''}`}
                >
                  <span>{country.code}</span>
                  <strong>{country.name}</strong>
                  <em>{formatNumber(country.mapperCount || 0)}</em>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
