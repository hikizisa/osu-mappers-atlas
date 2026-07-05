const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const COUNTRY_CONFIG_FILE = path.join(DATA_DIR, 'countries.json');

function getArg(name, fallback = null) {
  const inline = process.argv.find(arg => arg.startsWith(`--${name}=`));
  if (inline) return inline.split('=').slice(1).join('=');

  const index = process.argv.findIndex(arg => arg === `--${name}`);
  if (index !== -1) return process.argv[index + 1] || fallback;

  return fallback;
}

function normalizeCountryCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeIds(value) {
  return String(value || '')
    .split(/[\s,]+/)
    .map(id => parseInt(id, 10))
    .filter(Number.isFinite);
}

function uniqueIds(ids) {
  return Array.from(new Set(ids));
}

function usage() {
  console.error('Usage: node scripts/update-manual-mappers.js --country=KR --ids=123,456 [--mode=add|remove|replace]');
}

function main() {
  const countryCode = normalizeCountryCode(getArg('country') || getArg('country-code'));
  const ids = uniqueIds(normalizeIds(getArg('ids') || getArg('mapper-ids')));
  const mode = String(getArg('mode', 'add')).trim().toLowerCase();

  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    usage();
    throw new Error('--country must be a two-letter country code.');
  }
  if (ids.length === 0) {
    usage();
    throw new Error('--ids must contain at least one numeric mapper ID.');
  }
  if (!['add', 'remove', 'replace'].includes(mode)) {
    usage();
    throw new Error('--mode must be add, remove, or replace.');
  }
  if (!fs.existsSync(COUNTRY_CONFIG_FILE)) {
    throw new Error('data/countries.json not found. Run npm run init-countries first.');
  }

  const config = JSON.parse(fs.readFileSync(COUNTRY_CONFIG_FILE, 'utf8'));
  const country = config.countries?.[countryCode];
  if (!country) {
    throw new Error(`${countryCode} is not in data/countries.json. Run npm run init-countries and check osu! country availability.`);
  }

  const previous = uniqueIds(Array.isArray(country.manualMapperIds) ? country.manualMapperIds : []);
  const requested = new Set(ids);
  let next;

  if (mode === 'replace') {
    next = ids;
  } else if (mode === 'remove') {
    next = previous.filter(id => !requested.has(id));
  } else {
    next = uniqueIds([...previous, ...ids]);
  }

  country.manualMapperIds = next;
  fs.writeFileSync(COUNTRY_CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`${mode} manual mapper IDs for ${countryCode}`);
  console.log(`Previous count: ${previous.length}`);
  console.log(`Requested IDs: ${ids.join(', ')}`);
  console.log(`Current count: ${next.length}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
