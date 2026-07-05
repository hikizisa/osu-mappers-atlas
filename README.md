# osu! Mappers Atlas

Static site for browsing osu! mappers by country.

Live site:

https://hikizisa.github.io/osu-mappers-atlas/

The site reads generated JSON files from `public/data`. The browser does not call osu! directly.

## Running Locally

```bash
npm install
npm run dev
```

For a GitHub Pages-style export:

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/osu-mappers-atlas'
npm run export
```

The exported site is written to `out/`.

## Data

The fetch scripts use osu! API v1 through `OSU_API_KEY`.

Create or refresh country metadata:

```bash
npm run init-countries
```

Fetch one country:

```bash
npm run fetch-data -- --country=US
npm run init-countries
```

Fetch a few countries:

```bash
node scripts/fetch-country-batch.js --countries=US,GB,KR --continue-on-error=true
npm run init-countries
```

Fetch missing countries:

```bash
npm run fetch-all-missing
npm run init-countries
```

Generated files are:

- `public/data/countries.json`
- `public/data/mappers-{country}.json`
- `data/fetch-state-{country}.json`
- `data/creator-mappings-{country}.json`

## GitHub Actions

- `Deploy osu! Mappers Atlas`: builds and deploys the current site data. If manually run with `country_code`, it refreshes that country first.
- `Daily Data Refresh`: rolling refresh for existing generated countries. Can also refresh one country manually.
- `Monthly Data Refresh`: wider rolling refresh for existing generated countries. Can also refresh one country manually.
- `All-Country Data Refresh`: manual initializer for missing/all/selected countries. It splits countries into shards, merges the results, commits changed data, then deploys.

Actions page:

https://github.com/hikizisa/osu-mappers-atlas/actions

## Checking Indexing Progress

Open the `All-Country Data Refresh` run.

What to look for:

- `prepare`: initializes countries and discovery data.
- `fetch`: shard jobs run in parallel. Logs show `Selected ... countries` and `=== Fetching XX ===`.
- `merge`: downloads shard artifacts, updates metadata, commits `Refresh country mapper data` if anything changed, then deploys.

If there is no active `All-Country Data Refresh` run, full indexing is not currently running. A normal deploy run only builds and publishes the site.

For a first historical pass, use `since=2007-01-01` and a high `max_discovery_requests` value. The workflow default is `2000`.

## Country Shards

A shard is a slice of the selected country list. With `shard_count=24`, the workflow creates 24 shard jobs. Each job handles its slice of countries, while `max-parallel: 3` limits how many shards hit the API at once.

## Adding Manual Mapper IDs

Manual IDs should be country-specific in `data/countries.json`:

```json
{
  "countries": {
    "JP": {
      "manualMapperIds": [12345],
      "ignoreMapperIds": []
    }
  }
}
```

The old built-in KR seed list in `scripts/fetch-mappers.js` is kept only as a compatibility fallback.

## Repository Notes

- Do not commit `.env` or API keys.
- `README.md` and `DEPLOYMENT.md` should not include local paths.
- The GitHub Pages base path is `/osu-mappers-atlas`.
