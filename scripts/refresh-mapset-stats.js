const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const OSU_API_KEY = process.env.OSU_API_KEY;
const BASE_URL = 'https://osu.ppy.sh/api';
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
const STATE_FILE = path.join(DATA_DIR, 'mapset-stats-refresh-state.json');
const RATE_LIMIT_DELAY = 120;
const RECENT_WINDOW_DAYS = 31;
const RECENT_REFRESH_DAYS = 7;
const OLD_REFRESH_DAYS = 30;

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

function normalizeCountryCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeCountries(value) {
  return String(value || '')
    .split(',')
    .map(normalizeCountryCode)
    .filter(Boolean);
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function daysBetween(now, dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function listCountryFiles(selectedCountries) {
  const selected = new Set(selectedCountries);
  return fs.readdirSync(PUBLIC_DATA_DIR)
    .map(fileName => {
      const match = fileName.match(/^mappers-([a-z]{2})\.json$/);
      if (!match) return null;
      const countryCode = match[1].toUpperCase();
      if (selected.size > 0 && !selected.has(countryCode)) return null;
      return {
        countryCode,
        filePath: path.join(PUBLIC_DATA_DIR, fileName)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode));
}

function collectMapsets(countryFiles, state, now) {
  const mapsets = new Map();

  for (const countryFile of countryFiles) {
    const data = readJsonIfExists(countryFile.filePath, null);
    if (!data?.mappers) continue;

    for (const mapper of data.mappers) {
      for (const beatmap of mapper.beatmaps || []) {
        const beatmapsetId = String(beatmap.beatmapset_id || '').trim();
        if (!beatmapsetId) continue;

        const approvedDate = beatmap.approved_date;
        const ageDays = daysBetween(now, approvedDate);
        const intervalDays = ageDays <= RECENT_WINDOW_DAYS ? RECENT_REFRESH_DAYS : OLD_REFRESH_DAYS;
        const lastChecked = state.mapsets?.[beatmapsetId]?.lastChecked;
        const staleDays = lastChecked ? daysBetween(now, lastChecked) : Number.POSITIVE_INFINITY;
        if (staleDays < intervalDays) continue;

        if (!mapsets.has(beatmapsetId)) {
          mapsets.set(beatmapsetId, {
            beatmapsetId,
            approvedDate,
            intervalDays,
            countries: new Set()
          });
        }
        mapsets.get(beatmapsetId).countries.add(countryFile.countryCode);
      }
    }
  }

  return Array.from(mapsets.values())
    .sort((a, b) => {
      const intervalDiff = a.intervalDays - b.intervalDays;
      if (intervalDiff !== 0) return intervalDiff;
      return new Date(b.approvedDate || 0).getTime() - new Date(a.approvedDate || 0).getTime();
    });
}

async function fetchBeatmapsetStats(beatmapsetId) {
  const response = await axios.get(`${BASE_URL}/get_beatmaps`, {
    params: {
      k: OSU_API_KEY,
      s: beatmapsetId
    }
  });
  return Array.isArray(response.data) ? response.data : [];
}

function updateCountryData(data, statsByBeatmapId) {
  let changed = false;

  for (const mapper of data.mappers || []) {
    for (const beatmap of mapper.beatmaps || []) {
      const next = statsByBeatmapId.get(String(beatmap.beatmap_id));
      if (!next) continue;

      for (const field of ['playcount', 'favourite_count']) {
        if (next[field] !== undefined && beatmap[field] !== next[field]) {
          beatmap[field] = next[field];
          changed = true;
        }
      }
    }

    for (const beatmapset of mapper.beatmapsets || []) {
      const matchingStats = Array.from(statsByBeatmapId.values())
        .filter(stats => String(stats.beatmapset_id) === String(beatmapset.beatmapset_id));
      if (matchingStats.length === 0) continue;

      const nextFavourite = matchingStats[0].favourite_count;
      const nextPlaycount = matchingStats
        .reduce((total, stats) => total + (parseInt(stats.playcount || '0', 10) || 0), 0)
        .toString();

      if (nextFavourite !== undefined && beatmapset.favourite_count !== nextFavourite) {
        beatmapset.favourite_count = nextFavourite;
        changed = true;
      }
      if (beatmapset.playcount !== nextPlaycount) {
        beatmapset.playcount = nextPlaycount;
        changed = true;
      }
    }
  }

  return changed;
}

function updateLegacyKrFile(changedCountries) {
  if (!changedCountries.has('KR')) return;

  const krFile = path.join(PUBLIC_DATA_DIR, 'mappers-kr.json');
  const legacyFile = path.join(PUBLIC_DATA_DIR, 'mappers.json');
  if (fs.existsSync(krFile)) {
    fs.copyFileSync(krFile, legacyFile);
  }
}

async function main() {
  const selectedCountries = normalizeCountries(getArg('countries'));
  const maxRequests = Math.max(0, parseInt(getArg('max-requests', process.env.MAX_STATS_REFRESH_REQUESTS || '500'), 10) || 0);
  const dryRun = hasFlag('dry-run');
  const now = new Date();

  if (!dryRun && !OSU_API_KEY) {
    throw new Error('OSU_API_KEY environment variable is required.');
  }

  const countryFiles = listCountryFiles(selectedCountries);
  const state = readJsonIfExists(STATE_FILE, { mapsets: {} });
  state.mapsets = state.mapsets || {};

  const dueMapsets = collectMapsets(countryFiles, state, now).slice(0, maxRequests);

  console.log(`Loaded ${countryFiles.length} mapper data files.`);
  console.log(`Mapset stat refresh window: recent <= ${RECENT_WINDOW_DAYS} days, intervals ${RECENT_REFRESH_DAYS}/${OLD_REFRESH_DAYS} days.`);
  console.log(`Selected ${dueMapsets.length} due mapsets; max requests: ${maxRequests}.`);

  if (dryRun || dueMapsets.length === 0) {
    dueMapsets.slice(0, 20).forEach(entry => {
      console.log(`${entry.beatmapsetId}: ${Array.from(entry.countries).join(',')} interval=${entry.intervalDays}d`);
    });
    return;
  }

  const countryData = new Map(countryFiles.map(countryFile => [
    countryFile.countryCode,
    {
      filePath: countryFile.filePath,
      data: readJsonIfExists(countryFile.filePath, null),
      changed: false
    }
  ]));
  const changedCountries = new Set();
  let requestCount = 0;

  for (const entry of dueMapsets) {
    const stats = await fetchBeatmapsetStats(entry.beatmapsetId);
    requestCount += 1;

    const statsByBeatmapId = new Map(stats.map(beatmap => [String(beatmap.beatmap_id), beatmap]));

    for (const countryCode of entry.countries) {
      const country = countryData.get(countryCode);
      if (!country?.data) continue;

      if (updateCountryData(country.data, statsByBeatmapId)) {
        country.changed = true;
        changedCountries.add(countryCode);
      }
    }

    state.mapsets[entry.beatmapsetId] = {
      lastChecked: now.toISOString(),
      approvedDate: entry.approvedDate || null
    };

    if (requestCount % 25 === 0) {
      console.log(`Refreshed ${requestCount}/${dueMapsets.length} mapsets...`);
    }

    await delay(RATE_LIMIT_DELAY);
  }

  for (const country of countryData.values()) {
    if (country.changed) {
      writeJson(country.filePath, country.data);
    }
  }

  state.lastRun = now.toISOString();
  state.lastRequestCount = requestCount;
  writeJson(STATE_FILE, state);
  updateLegacyKrFile(changedCountries);

  console.log(`Updated stats for ${requestCount} mapsets.`);
  console.log(`Changed countries: ${Array.from(changedCountries).sort().join(', ') || '(none)'}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to refresh mapset stats:', error.message);
    process.exit(1);
  });
}
