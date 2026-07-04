# osu! API v2 Upgrade Plan

Source checked: https://osu.ppy.sh/docs/index.html, last updated June 30, 2026.

## Current State

- The data fetcher still uses osu! API v1 through `https://osu.ppy.sh/api` and `OSU_API_KEY`.
- v1 is marked legacy in the osu! docs and "will be deprecated soon"; v2 is the current API.
- The website itself is static and reads generated JSON from `public/data/*.json`, so it can stay hosted on GitHub Pages.
- A local v2 probe with the configured client credentials succeeded:
  - token type: `Bearer`
  - token lifetime: `86400`
  - `GET /api/v2/rankings/osu/global?country=KR` returned 50 rows, with the first row country `KR`

## Static Hosting Constraint

Do not call v2 client-credentials OAuth directly from the browser. The token request requires `client_secret`, and exposing that in GitHub Pages would compromise the osu! application secret.

The safe static architecture is:

1. GitHub Actions stores `CLIENT_ID` and `CLIENT_SECRET` as repository secrets.
2. Fetch scripts request short-lived v2 bearer tokens during action runs.
3. Scripts write static JSON into `public/data/*.json`.
4. The Next.js static export reads only generated JSON at runtime.

Direct browser v2 access would need a backend, serverless token broker, or another auth flow that does not expose a client secret. The osu! docs currently document authorization-code and client-credentials flows; the documented token exchanges both include `client_secret`.

## Endpoint Mapping

| Current v1 use | v2 replacement | Notes |
| --- | --- | --- |
| `get_user` | `GET /api/v2/users/{user}/{mode?}` | Use bearer token; preserves country checks. |
| `get_beatmaps?u=<id>&type=id` | `GET /api/v2/users/{user}/beatmapsets/{type}` if available in generated OpenAPI/client, otherwise use beatmapset search plus user lookup | Verify response shape before replacing mapper stats logic. |
| `get_beatmaps?since=<date>` discovery | `GET /api/v2/beatmapsets/search` with `cursor_string`, then filter creator users by country | Docs mark search as public/OAuth but sparse; empirical probe needed for query/status/date parameters. |
| Country validation | `GET /api/v2/rankings/{mode}/global?country=XX` or current country-rankings HTML source | Rankings proves valid country filters, but player rankings are not a complete mapper-discovery source. |

## Implementation Plan

1. Add an `OsuV2Client` wrapper in `scripts/` that:
   - reads `CLIENT_ID` and `CLIENT_SECRET`
   - requests a client-credentials token with `scope=public`
   - caches the token in memory until near expiry
   - sends `Authorization: Bearer <token>` on v2 requests
   - rate-limits to at most 60 requests per minute with retry/backoff for 429/5xx
2. Port user-country checks from `get_user` first.
3. Port per-user beatmap fetching and compare generated KR output against the current v1 output.
4. Port country mapper discovery once beatmapset-search parameters are validated empirically.
5. Update GitHub Actions secrets from `OSU_API_KEY` to `CLIENT_ID` and `CLIENT_SECRET`, keeping generated JSON paths unchanged.
6. Remove v1-only compatibility after KR and at least one non-KR country produce stable output.

## Risks

- v2 beatmapset search documentation is sparse, so discovery may need empirical query testing.
- Rankings country filters find players, not all mappers; they cannot replace mapper discovery alone.
- Large all-country backfills should stay sharded and cached to respect osu!'s usage guidance.
