'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchData } from './api-utils'

export interface CountryOption {
  code: string
  name: string
  demonym?: string
  nativeName?: string
  hasData?: boolean
  mapperCount?: number
  lastUpdated?: string | null
}

interface CountryListData {
  defaultCountry: string
  countries: CountryOption[]
}

interface CountryContextType {
  countries: CountryOption[]
  selectedCountry: CountryOption
  selectedCountryCode: string
  setSelectedCountryCode: (countryCode: string) => void
  isLoadingCountries: boolean
}

const fallbackCountry: CountryOption = {
  code: 'US',
  name: 'United States',
  demonym: 'American',
  nativeName: 'United States',
  hasData: true
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countries, setCountries] = useState<CountryOption[]>([fallbackCountry])
  const [selectedCountryCode, setSelectedCountryCodeState] = useState(fallbackCountry.code)
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)

  useEffect(() => {
    let isMounted = true

    fetchData('data/countries.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch country list')
        return res.json()
      })
      .then((data: CountryListData) => {
        if (!isMounted) return

        const nextCountries = data.countries?.length ? data.countries : [fallbackCountry]
        const savedCountry = localStorage.getItem('countryCode')
        const defaultCountry = data.defaultCountry || fallbackCountry.code
        const nextSelectedCountry = nextCountries.some(country => country.code === savedCountry)
          ? savedCountry
          : nextCountries.some(country => country.code === defaultCountry)
            ? defaultCountry
            : nextCountries[0].code

        setCountries(nextCountries)
        setSelectedCountryCodeState(nextSelectedCountry)
      })
      .catch(error => {
        console.error('Error loading country list:', error)
      })
      .finally(() => {
        if (isMounted) setIsLoadingCountries(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const setSelectedCountryCode = (countryCode: string) => {
    setSelectedCountryCodeState(countryCode)
    localStorage.setItem('countryCode', countryCode)
  }

  const selectedCountry = useMemo(() => {
    return countries.find(country => country.code === selectedCountryCode) || countries[0] || fallbackCountry
  }, [countries, selectedCountryCode])

  return (
    <CountryContext.Provider
      value={{
        countries,
        selectedCountry,
        selectedCountryCode,
        setSelectedCountryCode,
        isLoadingCountries
      }}
    >
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => {
  const context = useContext(CountryContext)
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return context
}
