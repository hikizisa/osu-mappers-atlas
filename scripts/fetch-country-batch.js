const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const COUNTRY_CONFIG_FILE = path.join(DATA_DIR, 'countries.json');
const PUBLIC_COUNTRY_FILE = path.join(PUBLIC_DATA_DIR, 'countries.json');
const FETCH_SCRIPT = path.join(__dirname, 'fetch-mappers.js');

function getArg(name, fallback = null) {
  const inline = process.argv.find(arg => arg.startsWith(`--${name}=`));
  if (inline) return inline.split('=').slice(1).join('=');

  const index = process.argv.findIndex(arg => arg === `--${name}`);
  if (index !== -1) return process.argv[index + 1] || fallback;

  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeCountryCode(code) {
  return String(code || '').trim().toUpperCase();
}

function loadCountries() {
  const config = readJsonIfExists(COUNTRY_CONFIG_FILE, null);
  if (config?.countries) {
    return Object.values(config.countries)
      .map(country => normalizeCountryCode(country.code))
      .filter(Boolean)
      .sort();
  }

  const publicData = readJsonIfExists(PUBLIC_COUNTRY_FILE, null);
  if (publicData?.countries) {
    return publicData.countries
      .map(country => normalizeCountryCode(country.code))
      .filter(Boolean)
      .sort();
  }

  throw new Error('No country list found. Run npm run init-countries first.');
}

function hasMapperData(countryCode) {
  const filePath = path.join(PUBLIC_DATA_DIR, `mappers-${countryCode.toLowerCase()}.json`);
  if (!fs.existsSync(filePath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data && typeof data.totalMappers === 'number' && data.totalMappers > 0;
  } catch (error) {
    return false;
  }
}

function selectCountries(allCountries) {
  const explicitCountries = getArg('countries');
  let selected = explicitCountries
    ? explicitCountries.split(',').map(normalizeCountryCode).filter(Boolean)
    : allCountries;

  const onlyMissing = hasFlag('only-missing') || getArg('only-missing') === 'true';
  const onlyExisting = hasFlag('only-existing') || getArg('only-existing') === 'true';
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

function runFetch(countryCode) {
  console.log(`\n=== Fetching ${countryCode} ===`);

  const result = spawnSync(process.execPath, [FETCH_SCRIPT, '--country', countryCode], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      MAPPER_COUNTRY: countryCode
    }
  });

  return result.status || 0;
}

function main() {
  const allCountries = loadCountries();
  const selectedCountries = selectCountries(allCountries);
  const continueOnError = hasFlag('continue-on-error') || getArg('continue-on-error') === 'true';
  const dryRun = hasFlag('dry-run') || getArg('dry-run') === 'true';

  console.log(`Loaded ${allCountries.length} countries.`);
  console.log(`Selected ${selectedCountries.length} countries: ${selectedCountries.join(', ') || '(none)'}`);

  if (dryRun || selectedCountries.length === 0) {
    return;
  }

  const failures = [];

  for (const countryCode of selectedCountries) {
    const status = runFetch(countryCode);
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
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
