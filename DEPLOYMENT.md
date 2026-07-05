# Deployment

This repo deploys a static Next.js export to GitHub Pages.

Current production URL:

https://hikizisa.github.io/osu-mappers-atlas/

## Required Secret

Add this repository secret in GitHub:

- `OSU_API_KEY`: osu! API v1 key

Path:

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

## GitHub Pages

In repository settings:

1. Open `Settings` -> `Pages`.
2. Set `Source` to `GitHub Actions`.
3. Save.

The workflow publishes the static export from `out/`.

## Normal Deploy

Push to `main`.

The `Deploy osu! Mappers Atlas` workflow will:

1. Install dependencies.
2. Run `npm run init-countries`.
3. Build the site with `npm run export`.
4. Publish `out/` to GitHub Pages.

On push, this workflow does not do all-country indexing.

## Manual Deploy With One Country Refresh

Use this when you want to refresh one country and deploy immediately.

1. Open `Actions`.
2. Select `Deploy osu! Mappers Atlas`.
3. Click `Run workflow`.
4. Enter a country code, for example `JP`.
5. Run it.

The workflow refreshes that country, rebuilds, and deploys.

## Full Or Missing-Country Indexing

Use `All-Country Data Refresh`.

Inputs:

- `mode=missing`: fetch countries that do not have `public/data/mappers-{country}.json` yet.
- `mode=all`: fetch all countries.
- `mode=selected`: fetch only the comma-separated `countries` list.
- `countries`: used only with `mode=selected`, for example `US,GB,JP`.
- `shard_count`: number of country shards. Default is `24`.
- `continue_on_error`: usually keep this `true`.
- `max_discovery_requests`: cap for discovery requests against osu! API. Default is `2000`.
- `since`: discovery start date. Default is `2007-01-01`.

Typical first pass:

- `mode=missing`
- `shard_count=24`
- `since=2007-01-01`
- `continue_on_error=true`
- `max_discovery_requests=2000`

The workflow commits data changes as `Refresh country mapper data` if anything changed.

## How To Check Progress

Open:

https://github.com/hikizisa/osu-mappers-atlas/actions

Then open the active `All-Country Data Refresh` run.

Useful places:

- `prepare`: country setup and discovery.
- `fetch`: shard jobs. Open a shard log and look for `Selected ... countries` and `=== Fetching XX ===`.
- `merge`: artifact merge, metadata refresh, commit, and deploy.

If the workflow is not running, indexing is not progressing. Completed deploy runs only mean the site was published.

## Scheduled Refreshes

`Daily Data Refresh`:

- Runs daily.
- Refreshes one rolling shard of countries that already have data.
- Can be manually run for one country.

`Monthly Data Refresh`:

- Runs monthly.
- Refreshes a wider rolling shard of existing countries.
- Can be manually run for one country.

`Update Manual Mapper IDs`:

- Updates `manualMapperIds` in `data/countries.json` for one country.
- Accepts `add`, `remove`, or `replace`.
- Can optionally refresh and deploy that country after the list changes.

## Local Build Check

PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/osu-mappers-atlas'
npm run export
```

The build should complete without TypeScript errors.

## Local Data Fetch

PowerShell:

```powershell
npm run fetch-data -- --country=US
npm run init-countries
```

Set `OSU_API_KEY` in your shell or `.env` before running the fetch. Do not commit `.env` or API keys.

To update manual IDs locally:

```powershell
npm run update-manual-mappers -- --country=JP --ids=12345,67890 --mode=add
```

## Files That Usually Change After Fetching

- `public/data/mappers-{country}.json`
- `public/data/countries.json`
- `data/fetch-state-{country}.json`
- `data/creator-mappings-{country}.json`

Commit generated data only when it is intentional.
