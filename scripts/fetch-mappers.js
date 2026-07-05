const axios = require('axios');
const fsSync = require('fs');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const OSU_API_KEY = process.env.OSU_API_KEY;
const BASE_URL = 'https://osu.ppy.sh/api';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const DATA_DIR = path.join(__dirname, '..', 'data');
const COUNTRY_CONFIG_FILE = path.join(DATA_DIR, 'countries.json');
const DEFAULT_FETCH_START_DATE = '2007-01-01';

function getCliArg(name) {
    const inlineArg = process.argv.find(arg => arg.startsWith(`--${name}=`));
    if (inlineArg) {
        return inlineArg.split('=').slice(1).join('=');
    }

    const argIndex = process.argv.findIndex(arg => arg === `--${name}`);
    if (argIndex !== -1) {
        return process.argv[argIndex + 1];
    }

    return null;
}

function getCliCountryCode() {
    return getCliArg('country');
}

function hasCliFlag(name) {
    return process.argv.includes(`--${name}`) || getCliArg(name) === 'true';
}

const ACTIVE_COUNTRY_CODE = (
    getCliCountryCode() ||
    process.env.MAPPER_COUNTRY ||
    process.env.TARGET_COUNTRY_CODE ||
    process.env.COUNTRY_CODE ||
    'KR'
).trim().toUpperCase();
const OUTPUT_FILE = path.join(OUTPUT_DIR, `mappers-${ACTIVE_COUNTRY_CODE.toLowerCase()}.json`);
const COMPAT_OUTPUT_FILE = path.join(OUTPUT_DIR, 'mappers.json');
const STATE_FILE = path.join(DATA_DIR, `fetch-state-${ACTIVE_COUNTRY_CODE.toLowerCase()}.json`);
const LEGACY_STATE_FILE = path.join(DATA_DIR, 'fetch-state.json');
const CREATOR_MAPPING_FILE = path.join(DATA_DIR, `creator-mappings-${ACTIVE_COUNTRY_CODE.toLowerCase()}.json`);
const LEGACY_CREATOR_MAPPING_FILE = path.join(DATA_DIR, 'creator-mappings.json');

// API Configuration
const MAX_BEATMAPS_PER_REQUEST = 500; // osu! API limit
const RATE_LIMIT_DELAY = 100; // ms between requests
const MAX_RETRIES = 3;

function countryDisplayName(countryCode) {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode;
    } catch (error) {
        return countryCode;
    }
}

function normalizeIdList(ids) {
    if (!Array.isArray(ids)) return [];
    return Array.from(new Set(
        ids
            .map(id => parseInt(id, 10))
            .filter(Number.isFinite)
    ));
}

function loadCountrySettings() {
    let config = {};
    if (fsSync.existsSync(COUNTRY_CONFIG_FILE)) {
        config = JSON.parse(fsSync.readFileSync(COUNTRY_CONFIG_FILE, 'utf8'));
    }

    const configuredCountries = config.countries || {};
    const configured = configuredCountries[ACTIVE_COUNTRY_CODE] || {};

    const name = process.env.TARGET_COUNTRY_NAME || configured.name || countryDisplayName(ACTIVE_COUNTRY_CODE);
    const demonym = process.env.TARGET_COUNTRY_DEMONYM || configured.demonym || name;
    const nativeName = process.env.TARGET_COUNTRY_NATIVE_NAME || configured.nativeName || name;

    return {
        code: ACTIVE_COUNTRY_CODE,
        name,
        demonym,
        nativeName,
        manualMapperIds: normalizeIdList(configured.manualMapperIds),
        ignoreMapperIds: normalizeIdList(configured.ignoreMapperIds),
        fetchStartDate: process.env.FETCH_START_DATE || configured.fetchStartDate || config.defaultFetchStartDate || DEFAULT_FETCH_START_DATE
    };
}

const COUNTRY_SETTINGS = loadCountrySettings();
const MANUAL_MAPPER_IDS = COUNTRY_SETTINGS.manualMapperIds;
const IGNORE_MAPPER_IDS = COUNTRY_SETTINGS.ignoreMapperIds;
const EXTRA_MAPPER_IDS = normalizeIdList([
    ...(process.env.EXTRA_MAPPER_IDS || '').split(','),
    ...(getCliArg('mapper-ids') || '').split(',')
]);
const SEEDED_MAPPER_IDS = normalizeIdList([...MANUAL_MAPPER_IDS, ...EXTRA_MAPPER_IDS]);
const SKIP_COUNTRY_DISCOVERY = process.env.SKIP_COUNTRY_DISCOVERY === 'true' || hasCliFlag('skip-discovery');

// Helper function to make API requests with retry logic
async function makeApiRequest(url, params = {}, retries = MAX_RETRIES) {
    try {
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        if (retries > 0 && (error.response?.status === 429 || error.response?.status >= 500)) {
            console.log(`API request failed, retrying... (${retries} retries left)`);
            await delay(RATE_LIMIT_DELAY * 2);
            return makeApiRequest(url, params, retries - 1);
        }
        throw error;
    }
}

// Rate limiting helper
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Load previous fetch state
async function loadFetchState() {
    try {
        const stateData = await fs.readFile(STATE_FILE, 'utf8');
        return JSON.parse(stateData);
    } catch (error) {
        if (COUNTRY_SETTINGS.code === 'KR') {
            try {
                const legacyStateData = await fs.readFile(LEGACY_STATE_FILE, 'utf8');
                return JSON.parse(legacyStateData);
            } catch (legacyError) {
                // Return default state below.
            }
        }
        // Return default state if file doesn't exist
        return {
            lastChecked: null,
            mapperStates: {}, // userId -> { lastBeatmapCheck: timestamp }
            totalBeatmaps: 0,
            lastFullScan: null
        };
    }
}

// Save fetch state
async function saveFetchState(state) {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    if (COUNTRY_SETTINGS.code === 'KR') {
        await fs.writeFile(LEGACY_STATE_FILE, JSON.stringify(state, null, 2));
    }
}

// Load creator name mappings (creator_name -> user_id)
async function loadCreatorMappings() {
    try {
        const data = await fs.readFile(CREATOR_MAPPING_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (COUNTRY_SETTINGS.code === 'KR') {
            try {
                const legacyData = await fs.readFile(LEGACY_CREATOR_MAPPING_FILE, 'utf8');
                return JSON.parse(legacyData);
            } catch (legacyError) {
                // Return empty mapping below.
            }
        }
        // Return empty mapping if file doesn't exist
        return {};
    }
}

// Save creator name mappings
async function saveCreatorMappings(mappings) {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(CREATOR_MAPPING_FILE), { recursive: true });
    await fs.writeFile(CREATOR_MAPPING_FILE, JSON.stringify(mappings, null, 2));
    if (COUNTRY_SETTINGS.code === 'KR') {
        await fs.writeFile(LEGACY_CREATOR_MAPPING_FILE, JSON.stringify(mappings, null, 2));
    }
}

// Load existing mapper data
async function loadExistingData() {
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (COUNTRY_SETTINGS.code === 'KR') {
            try {
                const legacyData = await fs.readFile(COMPAT_OUTPUT_FILE, 'utf8');
                return JSON.parse(legacyData);
            } catch (legacyError) {
                // Return empty data below.
            }
        }
        return {
            lastUpdated: new Date().toISOString(),
            totalMappers: 0,
            totalBeatmaps: 0,
            totalBeatmapsets: 0,
            totalGuestDiffs: 0,
            mappers: []
        };
    }
}

// Helper function to categorize beatmaps into mapsets and guest difficulties
// NOTE: Guest difficulty detection is disabled due to API limitations
// The osu! API doesn't provide per-difficulty creator info, so accurate detection is impossible
function categorizeBeatmaps(beatmaps, mapperUsername) {
    const beatmapsets = new Map(); // beatmapset_id -> beatmapset info
    const guestDifficulties = []; // Placeholder - currently empty due to API limitations
    const ownBeatmaps = [];
    
    beatmaps.forEach(beatmap => {
        const beatmapsetId = beatmap.beatmapset_id;
        const creator = beatmap.creator;
        // DISABLED: Guest difficulty detection due to API limitations
        // const isGuestDiff = creator !== mapperUsername;
        const isGuestDiff = false; // All beatmaps treated as own beatmaps for now
        
        if (isGuestDiff) {
            guestDifficulties.push({
                ...beatmap,
                isGuestDiff: true,
                hostMapper: creator
            });
        } else {
            ownBeatmaps.push(beatmap);
        }
        
        // Track beatmapsets
        if (!beatmapsets.has(beatmapsetId)) {
            beatmapsets.set(beatmapsetId, {
                beatmapset_id: beatmapsetId,
                title: beatmap.title,
                artist: beatmap.artist,
                creator: creator,
                approved_date: beatmap.approved_date,
                difficulties: [],
                isOwnMapset: !isGuestDiff
            });
        }
        
        // Add difficulty to beatmapset
        const mapset = beatmapsets.get(beatmapsetId);
        mapset.difficulties.push({
            beatmap_id: beatmap.beatmap_id,
            version: beatmap.version,
            difficultyrating: beatmap.difficultyrating,
            mode: beatmap.mode,
            isGuestDiff: isGuestDiff
        });
    });
    
    return {
        beatmapsets: Array.from(beatmapsets.values()),
        guestDifficulties,
        ownBeatmaps,
        stats: {
            totalBeatmaps: beatmaps.length,
            totalBeatmapsets: beatmapsets.size,
            ownBeatmapsets: Array.from(beatmapsets.values()).filter(ms => ms.isOwnMapset).length,
            guestBeatmapsets: Array.from(beatmapsets.values()).filter(ms => !ms.isOwnMapset).length,
            totalGuestDiffs: guestDifficulties.length,
            ownDifficulties: ownBeatmaps.length
        }
    };
}

// Fetch all beatmaps for a specific user with pagination
async function fetchAllBeatmapsForUser(userId, sinceDate = null) {
    const beatmaps = [];
    const allBeatmapIds = new Set(); // Track unique beatmap IDs to avoid duplicates
    let requestCount = 0;
    const MAX_REQUESTS_PER_USER = 50; // Safety limit to prevent infinite loops
    
    console.log(`Fetching beatmaps for user ${userId}${sinceDate ? ` since ${sinceDate}` : ''}...`);
    
    // The osu! API doesn't support traditional pagination for get_beatmaps by user
    // Instead, we need to fetch all beatmaps and filter them
    // We'll use a different approach: fetch user's beatmaps in batches
    
    try {
        // First, get all beatmaps by this user (not filtered by approval status)
        const params = {
            k: OSU_API_KEY,
            u: userId,
            type: 'id',
            limit: 500 // Maximum allowed by API
        };
        
        if (sinceDate) {
            params.since = sinceDate;
        }
        
        console.log(`Making API request for user ${userId} beatmaps...`);
        const allUserBeatmaps = await makeApiRequest(`${BASE_URL}/get_beatmaps`, params);
        
        if (!allUserBeatmaps || allUserBeatmaps.length === 0) {
            console.log(`No beatmaps found for user ${userId}`);
            return [];
        }
        
        console.log(`Found ${allUserBeatmaps.length} total beatmaps for user ${userId}`);
        
        // Filter for ranked, approved, and loved beatmaps (approved = 1 for ranked, 2 for approved, 4 for loved)
        const rankedBeatmaps = allUserBeatmaps.filter(beatmap => {
            const isRankedOrLoved = beatmap.approved === '1' || beatmap.approved === '2' || beatmap.approved === '4';
            const isUnique = !allBeatmapIds.has(beatmap.beatmap_id);
            const hasValidCreator = beatmap.creator && beatmap.creator.trim() !== '';
            
            // For banned/deleted accounts, creator_id might not match, but if the beatmap was returned
            // by the API when querying this user ID, we should include it
            const creatorIdMatches = beatmap.creator_id === userId.toString() || beatmap.creator_id === userId;
            
            // Log when creator_id doesn't match (common for banned accounts)
            if (isRankedOrLoved && hasValidCreator && !creatorIdMatches) {
                console.log(`   ℹ️  Including beatmap ${beatmap.beatmap_id} "${beatmap.title}" by ${beatmap.creator} (creator_id mismatch: ${beatmap.creator_id} vs ${userId})`);
            }
            
            // Include beatmap if it's ranked/loved, unique, and has a valid creator name
            // Don't require creator_id to match for banned/deleted accounts
            if (isRankedOrLoved && isUnique && hasValidCreator) {
                allBeatmapIds.add(beatmap.beatmap_id);
                return true;
            }
            return false;
        });
        
        beatmaps.push(...rankedBeatmaps);
        
        console.log(`Found ${rankedBeatmaps.length} ranked beatmaps for user ${userId}`);
        
        await delay(RATE_LIMIT_DELAY);
        
    } catch (error) {
        console.error(`Error fetching beatmaps for user ${userId}:`, error.message);
        
        // If there's an error, try to continue with other users
        if (error.response?.status === 429) {
            console.log(`Rate limited for user ${userId}, waiting longer...`);
            await delay(RATE_LIMIT_DELAY * 5);
        }
    }
    
    console.log(`Found ${beatmaps.length} ranked beatmaps for user ${userId}`);
    return beatmaps;
}

// Discover mappers by fetching ranked beatmaps over a period and checking mapper countries.
async function fetchCountryMappersFromAPI(isFullScan = false) {
    const countryMappers = new Set();
    const checkedUsers = new Set();
    
    console.log(`Discovering ${COUNTRY_SETTINGS.name} mappers from ranked beatmaps...`);
    
    // Determine date range based on scan type:
    // - Full scan (monthly): Check from the configured start date to catch all mappers
    // - Incremental scan (daily): Check from a week ago to catch recent activity
    let sinceDate;
    let maxRequests;
    
    if (isFullScan) {
        // Monthly reset: Check from the configured start date to be comprehensive
        sinceDate = COUNTRY_SETTINGS.fetchStartDate;
        maxRequests = 200; // More requests for comprehensive scan
        console.log(`Full scan mode: Checking beatmaps since ${sinceDate} for comprehensive ${COUNTRY_SETTINGS.name} mapper discovery`);
    } else {
        // Daily update: Check from a week ago for recent activity
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        sinceDate = weekAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
        maxRequests = 20; // Fewer requests for incremental scan
        console.log(`Daily update mode: Checking beatmaps from the last week for new ${COUNTRY_SETTINGS.name} mappers`);
    }
    
    try {
        // Fetch recent ranked beatmaps
        let hasMore = true;
        let since = sinceDate;
        let requestCount = 0;
        
        while (hasMore && requestCount < maxRequests) {
            console.log(`Checking ${MAX_BEATMAPS_PER_REQUEST} beatmaps since ${since}...`)
            const beatmaps = await makeApiRequest(`${BASE_URL}/get_beatmaps`, {
                k: OSU_API_KEY,
                since: since,
                limit: MAX_BEATMAPS_PER_REQUEST
            });
            
            if (!beatmaps || beatmaps.length === 0) {
                hasMore = false;
                break;
            }
            
            console.log(`Checking ${beatmaps.length} recent beatmaps for ${COUNTRY_SETTINGS.name} mappers...`);
            
            // Check each unique creator
            for (const beatmap of beatmaps) {
                const creatorId = beatmap.creator_id;
                
                if (!checkedUsers.has(creatorId)) {
                    checkedUsers.add(creatorId);
                    
                    try {
                        // Get user data to check country
                        const userData = await makeApiRequest(`${BASE_URL}/get_user`, {
                            k: OSU_API_KEY,
                            u: creatorId,
                            type: 'id'
                        });
                        
                        if (userData && userData.length > 0) {
                            const user = userData[0];
                            if (user.country === COUNTRY_SETTINGS.code) {
                                countryMappers.add(creatorId);
                                console.log(`Found ${COUNTRY_SETTINGS.name} mapper: ${user.username} (${creatorId})`);
                            }
                        }
                        
                        await delay(RATE_LIMIT_DELAY);
                    } catch (error) {
                        console.error(`Error checking user ${creatorId}:`, error.message);
                    }
                }
            }
            
            // Update since date to the last beatmap's date for pagination
            if (beatmaps.length > 0) {
                const lastBeatmap = beatmaps[beatmaps.length - 1];
                since = lastBeatmap.approved_date || lastBeatmap.last_update;
            }
            
            requestCount++;
            await delay(RATE_LIMIT_DELAY);
        }
        
    } catch (error) {
        console.error(`Error discovering ${COUNTRY_SETTINGS.name} mappers:`, error.message);
    }
    
    console.log(`Discovered ${countryMappers.size} ${COUNTRY_SETTINGS.name} mappers from recent beatmaps`);
    return Array.from(countryMappers);
}

async function fetchCountryMappers() {
    if (!OSU_API_KEY) {
        throw new Error('OSU_API_KEY environment variable is required');
    }

    console.log(`Starting ${COUNTRY_SETTINGS.name} mappers fetch with incremental updates...`);
    
    // Load previous fetch state, existing data, and creator mappings
    const fetchState = await loadFetchState();
    const existingData = await loadExistingData();
    const creatorMappings = await loadCreatorMappings();
    
    const mappers = new Map();
    const processedUsers = new Set();
    
    // Convert existing mappers to Map for easier updates
    existingData.mappers.forEach(mapper => {
        mappers.set(mapper.user_id, mapper);
    });
    
    console.log(`Loaded ${existingData.mappers.length} existing mappers from previous run`);
    
    // Remove mappers that are in the ignore list
    let removedCount = 0;
    const mappersToRemove = [];
    
    for (const [userId, mapper] of mappers.entries()) {
        if (IGNORE_MAPPER_IDS.includes(parseInt(userId))) {
            mappersToRemove.push({ userId, username: mapper.username });
            mappers.delete(userId);
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        console.log(`🗑️  Removed ${removedCount} mappers from database (in ignore list):`);
        mappersToRemove.forEach(({ userId, username }) => {
            console.log(`   - ${username} (ID: ${userId})`);
        });
        
        // Also remove from fetch state
        mappersToRemove.forEach(({ userId }) => {
            if (fetchState.mapperStates[userId]) {
                delete fetchState.mapperStates[userId];
            }
        });
    }
    
    const currentTime = new Date().toISOString();
    
    // Check if force refresh is requested via environment variable
    const forceRefresh = process.env.FORCE_REFRESH === 'true';
    const isFullScan = forceRefresh || !fetchState.lastFullScan || 
        (Date.now() - new Date(fetchState.lastFullScan).getTime()) > 7 * 24 * 60 * 60 * 1000; // Weekly full scan
    
    // Force start date for data collection
    const FORCE_START_DATE = COUNTRY_SETTINGS.fetchStartDate;
    console.log(`Forcing data collection from ${FORCE_START_DATE}...`);
    
    console.log(`Running ${isFullScan ? 'FULL' : 'INCREMENTAL'} scan${forceRefresh ? ' (FORCE REFRESH REQUESTED)' : ''}`);

    // Function to process a single user with incremental updates
    async function processUser(userId) {
        if (processedUsers.has(userId)) return;
        processedUsers.add(userId);

        // Add timeout to prevent getting stuck on problematic users
        const USER_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout per user
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout processing user ${userId}`)), USER_TIMEOUT);
        });

        try {
            console.log(`Processing user ID: ${userId}`);
            
            // Check if user is in ignore list
            if (IGNORE_MAPPER_IDS.includes(parseInt(userId))) {
                console.log(`User ID ${userId} is in ignore list, skipping`);
                return;
            }

            // Wrap the processing in a timeout
            await Promise.race([processUserInternal(userId), timeoutPromise]);
            
        } catch (error) {
            if (error.message.includes('Timeout')) {
                console.error(`⚠️  User ${userId} timed out after 5 minutes, skipping...`);
            } else {
                console.error(`Error processing user ${userId}:`, error.message);
            }
        }
    }

    // Internal function to process user without timeout wrapper
    async function processUserInternal(userId) {
        try {
            let user = null;
            let userFromBeatmaps = false;

            // Try to get user data first
            try {
                const userData = await makeApiRequest(`${BASE_URL}/get_user`, {
                    k: OSU_API_KEY,
                    u: userId,
                    type: 'id'
                });

                if (userData && userData.length > 0) {
                    user = userData[0];
                    console.log(`✅ User API: ${user.username} (${user.country})`);
                } else {
                    console.log(`⚠️  User API returned empty for ID: ${userId}`);
                }
            } catch (error) {
                console.log(`⚠️  User API failed for ID: ${userId}: ${error.message}`);
            }

            // If user API failed but this is in manual list, try to get info from beatmaps
            if (!user && MANUAL_MAPPER_IDS.includes(parseInt(userId))) {
                console.log(`🔄 User in manual list but API failed, trying beatmap fallback...`);
                
                try {
                    // Try to get beatmaps to see if user exists and get creator name
                    const sampleBeatmaps = await makeApiRequest(`${BASE_URL}/get_beatmaps`, {
                        k: OSU_API_KEY,
                        u: userId,
                        type: 'id',
                        limit: 50 // Get more beatmaps to find the most recent creator name
                    });
                    
                    if (sampleBeatmaps && sampleBeatmaps.length > 0) {
                        // Filter beatmaps with valid creator names (non-empty)
                        const beatmapsWithCreator = sampleBeatmaps.filter(b => 
                            b.creator && b.creator.trim() !== ''
                        );
                        
                        if (beatmapsWithCreator.length > 0) {
                            // Sort by last_update or approved_date to get the most recent creator name
                            const sortedBeatmaps = beatmapsWithCreator.sort((a, b) => {
                                const dateA = new Date(a.last_update || a.approved_date || '1970-01-01');
                                const dateB = new Date(b.last_update || b.approved_date || '1970-01-01');
                                return dateB - dateA; // Most recent first
                            });
                            
                            const mostRecentBeatmap = sortedBeatmaps[0];
                            
                            // Create a minimal user object from beatmap data
                            user = {
                                user_id: userId,
                                username: mostRecentBeatmap.creator,
                                country: COUNTRY_SETTINGS.code, // Assume selected country since in manual list
                                join_date: null,
                                playcount: 0,
                                pp_rank: null
                            };
                            userFromBeatmaps = true;
                            console.log(`✅ Beatmap fallback: Found user as "${user.username}" (most recent name from ${beatmapsWithCreator.length} beatmaps, banned/deleted account)`);
                            
                            // Log if creator_id mismatches are common (for debugging)
                            const mismatchCount = beatmapsWithCreator.filter(b => b.creator_id !== userId.toString()).length;
                            if (mismatchCount > 0) {
                                console.log(`   ℹ️  Note: ${mismatchCount}/${beatmapsWithCreator.length} beatmaps have creator_id mismatch (expected for banned accounts)`);
                            }
                        } else {
                            console.log(`❌ No beatmaps with valid creator names found for user ${userId}`);
                            return;
                        }
                    } else {
                        console.log(`❌ No beatmaps found for user ${userId}`);
                        return;
                    }
                } catch (error) {
                    console.log(`❌ Beatmap fallback failed for user ${userId}: ${error.message}`);
                    return;
                }
            } else if (!user) {
                console.log(`❌ No user data found for ID: ${userId} and not in manual list`);
                return;
            }
            
            // Check if user is from the selected country or in manual list (skip country check for beatmap fallback)
            if (!userFromBeatmaps && user.country !== COUNTRY_SETTINGS.code && !MANUAL_MAPPER_IDS.includes(parseInt(userId))) {
                console.log(`User ${user.username} is not from ${COUNTRY_SETTINGS.name} (${user.country}), skipping`);
                return;
            }
            
            // Determine if we need to fetch new beatmaps for this user
            const userState = fetchState.mapperStates[userId] || {};
            const lastBeatmapCheck = userState.lastBeatmapCheck;
            // Use forced start date instead of null for full scans
            const sinceDate = isFullScan ? FORCE_START_DATE : lastBeatmapCheck;
            
            // Fetch all beatmaps for this user with pagination
            const beatmaps = await fetchAllBeatmapsForUser(userId, sinceDate);
            
            if (beatmaps.length > 0) {
                // Categorize beatmaps into mapsets and guest difficulties
                const categorizedData = categorizeBeatmaps(beatmaps, user.username);
                
                // Update or create mapper entry
                const existingMapper = mappers.get(userId);
                
                if (existingMapper) {
                    // Merge new beatmaps with existing ones
                    const existingBeatmapIds = new Set(existingMapper.beatmaps.map(b => b.beatmap_id));
                    const newBeatmaps = beatmaps.filter(b => !existingBeatmapIds.has(b.beatmap_id));
                    
                    // Merge and recategorize all beatmaps
                    const allBeatmaps = [...existingMapper.beatmaps, ...newBeatmaps];
                    const updatedCategorizedData = categorizeBeatmaps(allBeatmaps, user.username);
                    
                    // Update aliases - collect all unique creator names from beatmaps
                    const allCreatorNames = new Set();
                    allBeatmaps.forEach(beatmap => {
                        if (beatmap.creator && beatmap.creator.trim()) {
                            const creatorName = beatmap.creator.trim();
                            allCreatorNames.add(creatorName);
                            // Update creator mapping for future reference
                            creatorMappings[creatorName] = userId;
                        }
                    });
                    // Add current username
                    allCreatorNames.add(user.username);
                    creatorMappings[user.username] = userId;
                    // Remove current username from aliases and convert to array
                    const aliases = Array.from(allCreatorNames).filter(name => name !== user.username).sort();
                    
                    existingMapper.username = user.username; // Update to current username
                    existingMapper.aliases = aliases;
                    existingMapper.beatmaps = allBeatmaps.sort((a, b) => new Date(b.approved_date) - new Date(a.approved_date));
                    existingMapper.beatmapsets = updatedCategorizedData.beatmapsets;
                    existingMapper.guestDifficulties = updatedCategorizedData.guestDifficulties;
                    existingMapper.stats = updatedCategorizedData.stats;
                    existingMapper.rankedBeatmaps = updatedCategorizedData.stats.totalBeatmaps;
                    existingMapper.rankedBeatmapsets = updatedCategorizedData.stats.totalBeatmapsets;
                    existingMapper.ownBeatmapsets = updatedCategorizedData.stats.ownBeatmapsets;
                    existingMapper.guestBeatmapsets = updatedCategorizedData.stats.guestBeatmapsets;
                    existingMapper.totalGuestDiffs = updatedCategorizedData.stats.totalGuestDiffs;
                    existingMapper.lastUpdated = currentTime;
                    
                    console.log(`Updated mapper ${user.username}: +${newBeatmaps.length} new beatmaps (total: ${existingMapper.rankedBeatmaps}, ${existingMapper.rankedBeatmapsets} mapsets, ${existingMapper.totalGuestDiffs} guest diffs)`);
                } else {
                    // Create new mapper entry
                    // Collect aliases - all unique creator names from beatmaps
                    const allCreatorNames = new Set();
                    beatmaps.forEach(beatmap => {
                        if (beatmap.creator && beatmap.creator.trim()) {
                            const creatorName = beatmap.creator.trim();
                            allCreatorNames.add(creatorName);
                            // Update creator mapping for future reference
                            creatorMappings[creatorName] = userId;
                        }
                    });
                    // Add current username
                    allCreatorNames.add(user.username);
                    creatorMappings[user.username] = userId;
                    // Remove current username from aliases and convert to array
                    const aliases = Array.from(allCreatorNames).filter(name => name !== user.username).sort();
                    
                    const mapper = {
                        user_id: userId,
                        username: user.username,
                        aliases: aliases,
                        country: user.country,
                        rankedBeatmaps: categorizedData.stats.totalBeatmaps,
                        rankedBeatmapsets: categorizedData.stats.totalBeatmapsets,
                        ownBeatmapsets: categorizedData.stats.ownBeatmapsets,
                        guestBeatmapsets: categorizedData.stats.guestBeatmapsets,
                        totalGuestDiffs: categorizedData.stats.totalGuestDiffs,
                        ownDifficulties: categorizedData.stats.ownDifficulties,
                        beatmaps: categorizedData.ownBeatmaps.concat(categorizedData.guestDifficulties).sort((a, b) => new Date(b.approved_date) - new Date(a.approved_date)),
                        beatmapsets: categorizedData.beatmapsets,
                        guestDifficulties: categorizedData.guestDifficulties,
                        stats: categorizedData.stats,
                        lastUpdated: currentTime
                    };
                    
                    mappers.set(userId, mapper);
                    console.log(`Added new mapper ${user.username}: ${mapper.rankedBeatmaps} beatmaps, ${mapper.rankedBeatmapsets} mapsets (${mapper.ownBeatmapsets} own, ${mapper.guestBeatmapsets} guest), ${mapper.totalGuestDiffs} guest diffs`);
                }
                
                // Update user state
                fetchState.mapperStates[userId] = {
                    lastBeatmapCheck: currentTime
                };
            } else if (!mappers.has(userId)) {
                console.log(`User ${user.username} has no ranked beatmaps, skipping`);
            }
            
        } catch (error) {
            console.error(`Error processing user ${userId}:`, error.message);
        }
    }

    // Process configured and externally discovered mapper IDs
    console.log(`Processing ${SEEDED_MAPPER_IDS.length} seeded mapper IDs...`);
    for (const userId of SEEDED_MAPPER_IDS) {
        await processUser(userId.toString());
    }

    if (SKIP_COUNTRY_DISCOVERY) {
        console.log(`Skipping ${COUNTRY_SETTINGS.name} discovery scan; using seeded mapper IDs only.`);
    } else if (isFullScan) {
        // If it's a full scan, also fetch selected-country mappers from API
        try {
            const apiCountryMappers = await fetchCountryMappersFromAPI(true); // Pass true for full scan
            console.log(`Processing ${apiCountryMappers.length} ${COUNTRY_SETTINGS.name} mappers from API...`);
            
            for (const userId of apiCountryMappers) {
                await processUser(userId.toString());
            }
        } catch (error) {
            console.error(`Error fetching ${COUNTRY_SETTINGS.name} mappers from API:`, error.message);
        }
    } else {
        // For daily updates, still check for new selected-country mappers but with limited scope
        try {
            const apiCountryMappers = await fetchCountryMappersFromAPI(false); // Pass false for incremental scan
            console.log(`Processing ${apiCountryMappers.length} ${COUNTRY_SETTINGS.name} mappers from recent activity...`);
            
            for (const userId of apiCountryMappers) {
                await processUser(userId.toString());
            }
        } catch (error) {
            console.error(`Error fetching ${COUNTRY_SETTINGS.name} mappers from API:`, error.message);
        }
    }

    // Convert Map back to array and sort by ranked beatmaps
    const mappersArray = Array.from(mappers.values())
        .filter(mapper => mapper.rankedBeatmaps > 0)
        .sort((a, b) => b.rankedBeatmaps - a.rankedBeatmaps);

    // Update fetch state
    fetchState.lastChecked = currentTime;
    fetchState.totalBeatmaps = mappersArray.reduce((sum, mapper) => sum + mapper.rankedBeatmaps, 0);
    if (isFullScan) {
        fetchState.lastFullScan = currentTime;
    }

    // Save updated state and creator mappings
    await saveFetchState(fetchState);
    await saveCreatorMappings(creatorMappings);
    
    console.log(`💾 Saved creator mappings: ${Object.keys(creatorMappings).length} creator names tracked`);

    // Calculate aggregate statistics
    const totalBeatmapsets = mappersArray.reduce((sum, mapper) => sum + (mapper.rankedBeatmapsets || 0), 0);
    const totalOwnBeatmapsets = mappersArray.reduce((sum, mapper) => sum + (mapper.ownBeatmapsets || 0), 0);
    const totalGuestBeatmapsets = mappersArray.reduce((sum, mapper) => sum + (mapper.guestBeatmapsets || 0), 0);
    const totalGuestDiffs = mappersArray.reduce((sum, mapper) => sum + (mapper.totalGuestDiffs || 0), 0);
    const totalOwnDifficulties = mappersArray.reduce((sum, mapper) => sum + (mapper.ownDifficulties || 0), 0);

    // Prepare output data
    const outputData = {
        country: {
            code: COUNTRY_SETTINGS.code,
            name: COUNTRY_SETTINGS.name,
            demonym: COUNTRY_SETTINGS.demonym,
            nativeName: COUNTRY_SETTINGS.nativeName
        },
        lastUpdated: currentTime,
        totalMappers: mappersArray.length,
        totalBeatmaps: fetchState.totalBeatmaps,
        totalBeatmapsets: totalBeatmapsets,
        totalOwnBeatmapsets: totalOwnBeatmapsets,
        totalGuestBeatmapsets: totalGuestBeatmapsets,
        totalGuestDiffs: totalGuestDiffs,
        totalOwnDifficulties: totalOwnDifficulties,
        scanType: isFullScan ? 'full' : 'incremental',
        mappers: mappersArray
    };

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Write the data to file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    if (COUNTRY_SETTINGS.code === 'KR') {
        await fs.writeFile(COMPAT_OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    }

    console.log(`\n✅ Fetch completed successfully!`);
    console.log(`📊 Total mappers: ${outputData.totalMappers}`);
    console.log(`🎵 Total ranked beatmaps: ${outputData.totalBeatmaps}`);
    console.log(`📦 Total beatmapsets: ${outputData.totalBeatmapsets}`);
    console.log(`   ├─ Own mapsets: ${outputData.totalOwnBeatmapsets}`);
    console.log(`   └─ Guest mapsets: ${outputData.totalGuestBeatmapsets}`);
    console.log(`🎯 Total guest difficulties: ${outputData.totalGuestDiffs}`);
    console.log(`🔧 Total own difficulties: ${outputData.totalOwnDifficulties}`);
    console.log(`📁 Data saved to: ${OUTPUT_FILE}`);
    console.log(`💾 State saved to: ${STATE_FILE}`);

    return mappersArray;
}

// Main execution
if (require.main === module) {
    fetchCountryMappers()
        .then(() => {
            console.log(`${COUNTRY_SETTINGS.name} mappers data fetch completed successfully!`);
            process.exit(0);
        })
        .catch(error => {
            console.error(`Error fetching ${COUNTRY_SETTINGS.name} mappers:`, error);
            process.exit(1);
        });
}

module.exports = {
    fetchCountryMappers
};
