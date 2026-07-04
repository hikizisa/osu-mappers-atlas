const { spawnSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const OSU_API_KEY = process.env.OSU_API_KEY;
const BASE_URL = 'https://osu.ppy.sh/api';
const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const COUNTRY_CONFIG_FILE = path.join(DATA_DIR, 'countries.json');
const PUBLIC_COUNTRY_FILE = path.join(PUBLIC_DATA_DIR, 'countries.json');
const FETCH_SCRIPT = path.join(__dirname, 'fetch-mappers.js');
const MAX_BEATMAPS_PER_REQUEST = 500;
const RATE_LIMIT_DELAY = 100;
const MAX_RETRIES = 3;

function getArg(name, fallback = null) {
  const inline = process.argv.find(arg => arg.startsWith(`--${name}=`));
  if (inline) return inline.split('=').slice(1).join('=');

  const index = process.argv.findIndex(arg => arg === `--${name}`);
  if (index !== -1) return process.argv[index + 1] || fallback;

  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`) || getArg(name) === 'true';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeCountryCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeIdList(ids) {
  return Array.from(new Set(
    ids
      .map(id => parseInt(id, 10))
      .filter(Number.isFinite)
  ));
}

function loadCountryConfig() {
  const config = readJsonIfExists(COUNTRY_CONFIG_FILE, null);
  if (config?.countries) {
    return config;
  }

  const publicData = readJsonIfExists(PUBLIC_COUNTRY_FILE, null);
  if (publicData?.countries) {
    return {
      defaultFetchStartDate: '2020-01-01',
      countries: Object.fromEntries(publicData.countries.map(country => [country.code, country]))
    };
  }

  throw new Error('No country list found. Run npm run init-countries first.');
}

function hasMapperData(countryCode) {
  return fs.existsSync(path.join(PUBLIC_DATA_DIR, `mappers-${countryCode.toLowerCase()}.json`));
}

function selectCountries(allCountries) {
  const explicitCountries = getArg('countries');
  let selected = explicitCountries
    ? explicitCountries.split(',').map(normalizeCountryCode).filter(Boolean)
    : allCountries;

  const onlyMissing = hasFlag('only-missing') || getArg('mode') === 'missing';
  const onlyExisting = hasFlag('only-existing') || getArg('mode') === 'existing';
  if (onlyMissing && onlyExisting) {
    throw new Error('--only-missing and --only-existing cannot be used together.');
  }

  if (onlyMissing) {
    selected = selected.filter(countryCode => !hasMapperData(countryCode));
  }
  if (onlyExisting) {
    selected = selected.filter(countryCode => hasMapperData(countryCode));
  }

  const shardCount = parseInt(getArg('shard-count', '1'), 10);
  const shardIndex = parseInt(getArg('shard-index', '0'), 10);
  if (!Number.isInteger(shardCount) || shardCount < 1) {
    throw new Error('--shard-count must be a positive integer.');
  }
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
    throw new Error('--shard-index must be between 0 and shard-count - 1.');
  }

  selected = selected.filter((_, index) => index % shardCount === shardIndex);

  const limit = parseInt(getArg('limit', `${selected.length}`), 10);
  if (Number.isInteger(limit) && limit >= 0) {
    selected = selected.slice(0, limit);
  }

  return selected;
}

async function makeApiRequest(url, params = {}, retries = MAX_RETRIES) {
  try {
    const response = await axios.get(url, { params, timeout: 30000 });
    return response.data;
  } catch (error) {
    if (retries > 0 && (error.response?.status === 429 || error.response?.status >= 500)) {
      await delay(RATE_LIMIT_DELAY * 5);
      return makeApiRequest(url, params, retries - 1);
    }
    throw error;
  }
}

async function discoverMappersByCountry(countryCodes, sinceDate, maxRequests) {
  if (!OSU_API_KEY) {
    throw new Error('OSU_API_KEY environment variable is required.');
  }

  const countrySet = new Set(countryCodes);
  const checkedUsers = new Set();
  const discovered = Object.fromEntries(countryCodes.map(countryCode => [countryCode, []]));
  let since = sinceDate;
  let requestCount = 0;

  while (requestCount < maxRequests) {
    console.log(`Discovery request ${requestCount + 1}/${maxRequests}: beatmaps since ${since}`);
    const beatmaps = await makeApiRequest(`${BASE_URL}/get_beatmaps`, {
      k: OSU_API_KEY,
      since,
      limit: MAX_BEATMAPS_PER_REQUEST
    });

    if (!Array.isArray(beatmaps) || beatmaps.length === 0) {
      break;
    }

    for (const beatmap of beatmaps) {
      const creatorId = parseInt(beatmap.creator_id, 10);
      if (!Number.isFinite(creatorId) || checkedUsers.has(creatorId)) {
        continue;
      }

      checkedUsers.add(creatorId);
      try {
        const userData = await makeApiRequest(`${BASE_URL}/get_user`, {
          k: OSU_API_KEY,
          u: creatorId,
          type: 'id'
        });

        const user = Array.isArray(userData) ? userData[0] : null;
        const countryCode = normalizeCountryCode(user?.country);
        if (countrySet.has(countryCode)) {
          discovered[countryCode].push(creatorId);
        }
      } catch (error) {
        console.error(`Failed to check user ${creatorId}: ${error.message}`);
      }

      await delay(RATE_LIMIT_DELAY);
    }

    const lastBeatmap = beatmaps[beatmaps.length - 1];
    const nextSince = lastBeatmap.approved_date || lastBeatmap.last_update || since;
    if (nextSince === since) {
      requestCount += 1;
    } else {
      since = nextSince;
      requestCount += 1;
    }

    await delay(RATE_LIMIT_DELAY);
  }

  for (const countryCode of countryCodes) {
    discovered[countryCode] = normalizeIdList(discovered[countryCode]);
  }

  return {
    generatedAt: new Date().toISOString(),
    source: `${BASE_URL}/get_beatmaps`,
    since: sinceDate,
    maxRequests,
    checkedUserCount: checkedUsers.size,
    countries: discovered
  };
}

function writeDiscoveryFile(filePath, discovery) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(discovery, null, 2));
}

function loadOrCreateDiscovery(countryCodes, sinceDate, maxRequests) {
  const discoveryFile = getArg('discovery-file');
  const refreshDiscovery = hasFlag('refresh-discovery');

  if (discoveryFile && fs.existsSync(discoveryFile) && !refreshDiscovery) {
    console.log(`Loading discovery from ${discoveryFile}`);
    return Promise.resolve(readJsonIfExists(discoveryFile, { countries: {} }));
  }

  return discoverMappersByCountry(countryCodes, sinceDate, maxRequests).then(discovery => {
    if (discoveryFile) {
      writeDiscoveryFile(discoveryFile, discovery);
      console.log(`Discovery saved to ${discoveryFile}`);
    }
    return discovery;
  });
}

function writeEmptyCountryData(countryCode, country) {
  const currentTime = new Date().toISOString();
  const outputFile = path.join(PUBLIC_DATA_DIR, `mappers-${countryCode.toLowerCase()}.json`);
  const outputData = {
    country: {
      code: countryCode,
      name: country?.name || countryCode,
      demonym: country?.demonym || country?.name || countryCode,
      nativeName: country?.nativeName || country?.name || countryCode
    },
    lastUpdated: currentTime,
    totalMappers: 0,
    totalBeatmaps: 0,
    totalBeatmapsets: 0,
    totalOwnBeatmapsets: 0,
    totalGuestBeatmapsets: 0,
    totalGuestDiffs: 0,
    totalOwnDifficulties: 0,
    scanType: 'shared-discovery-empty',
    mappers: []
  };

  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
  console.log(`Wrote empty mapper data for ${countryCode}`);
}

function runCountryFetch(countryCode, mapperIds) {
  console.log(`\n=== Fetching ${countryCode} from ${mapperIds.length} discovered mapper IDs ===`);

  const result = spawnSync(process.execPath, [FETCH_SCRIPT, '--country', countryCode, '--skip-discovery'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      MAPPER_COUNTRY: countryCode,
      EXTRA_MAPPER_IDS: mapperIds.join(','),
      SKIP_COUNTRY_DISCOVERY: 'true'
    }
  });

  return result.status || 0;
}

async function main() {
  const config = loadCountryConfig();
  const allCountries = Object.values(config.countries)
    .map(country => normalizeCountryCode(country.code))
    .filter(Boolean)
    .sort();
  const selectedCountries = selectCountries(allCountries);
  const sinceDate = getArg('since', config.defaultFetchStartDate || '2020-01-01');
  const maxRequests = parseInt(getArg('max-discovery-requests', '200'), 10);
  const dryRun = hasFlag('dry-run');
  const discoverOnly = hasFlag('discover-only');
  const writeEmpty = hasFlag('write-empty');
  const continueOnError = hasFlag('continue-on-error') || getArg('continue-on-error') === 'true';

  if (!Number.isInteger(maxRequests) || maxRequests < 1) {
    throw new Error('--max-discovery-requests must be a positive integer.');
  }

  console.log(`Loaded ${allCountries.length} countries.`);
  console.log(`Selected ${selectedCountries.length} countries: ${selectedCountries.join(', ') || '(none)'}`);
  console.log(`Discovery window starts at ${sinceDate}; max requests: ${maxRequests}.`);

  if (selectedCountries.length === 0 && !discoverOnly) {
    console.log('No selected countries require fetching; skipping discovery.');
    return;
  }

  const discovery = await loadOrCreateDiscovery(allCountries, sinceDate, maxRequests);
  const discoveredCounts = Object.fromEntries(
    selectedCountries.map(countryCode => [
      countryCode,
      normalizeIdList(discovery.countries?.[countryCode] || []).length
    ])
  );

  console.log(`Checked ${discovery.checkedUserCount || 0} users during discovery.`);
  console.log(`Selected-country discovered mapper counts: ${JSON.stringify(discoveredCounts)}`);

  if (dryRun || discoverOnly || selectedCountries.length === 0) {
    return;
  }

  const failures = [];
  for (const countryCode of selectedCountries) {
    const mapperIds = normalizeIdList(discovery.countries?.[countryCode] || []);
    if (mapperIds.length === 0) {
      if (writeEmpty) {
        writeEmptyCountryData(countryCode, config.countries[countryCode]);
      } else {
        console.log(`Skipping ${countryCode}; no discovered mapper IDs.`);
      }
      continue;
    }

    const status = runCountryFetch(countryCode, mapperIds);
    if (status !== 0) {
      failures.push({ countryCode, status });
      if (!continueOnError) break;
    }
  }

  if (failures.length > 0) {
    console.error(`Failed countries: ${failures.map(failure => `${failure.countryCode}(${failure.status})`).join(', ')}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
