const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const COUNTRY_CONFIG_FILE = path.join(DATA_DIR, 'countries.json');
const PUBLIC_COUNTRY_FILE = path.join(PUBLIC_DATA_DIR, 'countries.json');
const LEGACY_MAPPERS_FILE = path.join(PUBLIC_DATA_DIR, 'mappers.json');
const DEFAULT_COUNTRY = (process.env.DEFAULT_COUNTRY || 'KR').trim().toUpperCase();
const SOURCE_URL = 'https://osu.ppy.sh/rankings/osu/country';

function countryDisplayName(countryCode) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode;
  } catch (error) {
    return countryCode;
  }
}

function readJsonIfExists(filePath, fallback) {
  if (!fsSync.existsSync(filePath)) return fallback;
  return JSON.parse(fsSync.readFileSync(filePath, 'utf8'));
}

function getMapperSummary(countryCode) {
  const countryFile = path.join(PUBLIC_DATA_DIR, `mappers-${countryCode.toLowerCase()}.json`);
  const fallbackFile = countryCode === DEFAULT_COUNTRY ? LEGACY_MAPPERS_FILE : null;
  const sourceFile = fsSync.existsSync(countryFile)
    ? countryFile
    : fallbackFile && fsSync.existsSync(fallbackFile)
      ? fallbackFile
      : null;

  if (!sourceFile) {
    return { hasData: false, mapperCount: 0, lastUpdated: null };
  }

  const data = readJsonIfExists(sourceFile, {});
  return {
    hasData: true,
    mapperCount: data.totalMappers || (Array.isArray(data.mappers) ? data.mappers.length : 0),
    lastUpdated: data.lastUpdated || null
  };
}

async function fetchCountryPage(page) {
  const url = page === 1 ? SOURCE_URL : `${SOURCE_URL}?page=${page}`;
  const { data } = await axios.get(url);
  return data;
}

function parseCountries(html) {
  const countries = [];
  const regex = /href="https:\/\/osu\.ppy\.sh\/rankings\/osu\/global\?country=([A-Z]{2})"[\s\S]*?<span class="u-ellipsis-overflow">\s*([^<]+?)\s*<\/span>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    countries.push({
      code: match[1],
      name: match[2].trim()
    });
  }

  return countries;
}

async function fetchOsuCountries() {
  const countryMap = new Map();

  for (let page = 1; page <= 20; page += 1) {
    const html = await fetchCountryPage(page);
    const countries = parseCountries(html);

    if (countries.length === 0) break;

    for (const country of countries) {
      countryMap.set(country.code, country);
    }

    if (!html.includes(`>${page + 1}<`) && !html.includes(`page=${page + 1}`)) break;
  }

  return Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function ensureDefaultMapperAlias() {
  const defaultMappersFile = path.join(PUBLIC_DATA_DIR, `mappers-${DEFAULT_COUNTRY.toLowerCase()}.json`);
  if (!fsSync.existsSync(defaultMappersFile) && fsSync.existsSync(LEGACY_MAPPERS_FILE)) {
    await fs.copyFile(LEGACY_MAPPERS_FILE, defaultMappersFile);
  }
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });
  await ensureDefaultMapperAlias();

  const existingConfig = readJsonIfExists(COUNTRY_CONFIG_FILE, {});
  const osuCountries = await fetchOsuCountries();
  const countriesByCode = {};

  for (const country of osuCountries) {
    const existingCountry = existingConfig.countries?.[country.code] || {};
    countriesByCode[country.code] = {
      ...existingCountry,
      code: country.code,
      name: country.name || existingCountry.name || countryDisplayName(country.code),
      demonym: existingCountry.demonym || country.name || countryDisplayName(country.code),
      nativeName: existingCountry.nativeName || country.name || countryDisplayName(country.code)
    };
  }

  if (!countriesByCode[DEFAULT_COUNTRY]) {
    countriesByCode[DEFAULT_COUNTRY] = {
      ...(existingConfig.countries?.[DEFAULT_COUNTRY] || {}),
      code: DEFAULT_COUNTRY,
      name: countryDisplayName(DEFAULT_COUNTRY),
      demonym: countryDisplayName(DEFAULT_COUNTRY),
      nativeName: countryDisplayName(DEFAULT_COUNTRY)
    };
  }

  const config = {
    defaultCountry: existingConfig.defaultCountry || DEFAULT_COUNTRY,
    defaultFetchStartDate: existingConfig.defaultFetchStartDate || '2020-01-01',
    generatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    countries: countriesByCode
  };

  const publicCountries = Object.values(countriesByCode)
    .map((country) => ({
      code: country.code,
      name: country.name,
      demonym: country.demonym,
      nativeName: country.nativeName,
      ...getMapperSummary(country.code)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const publicData = {
    defaultCountry: config.defaultCountry,
    generatedAt: config.generatedAt,
    source: config.source,
    countries: publicCountries
  };

  await fs.writeFile(COUNTRY_CONFIG_FILE, JSON.stringify(config, null, 2));
  await fs.writeFile(PUBLIC_COUNTRY_FILE, JSON.stringify(publicData, null, 2));

  console.log(`Initialized ${publicCountries.length} osu! countries from ${SOURCE_URL}`);
  console.log(`Country config saved to ${COUNTRY_CONFIG_FILE}`);
  console.log(`Public country list saved to ${PUBLIC_COUNTRY_FILE}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to initialize countries:', error);
    process.exit(1);
  });
}
