# Public discovery and account boundary

The original Living Scene canon is retained byte-for-byte. The build emits a separate public marketing template and atmosphere-only JavaScript. The Worker exposes only allowlisted public pages and discovery manifests. It requires a valid customer session to serve /app, /app.js and /api/integrity; workspace persistence retains its own server-side session and owner checks. Direct asset aliases are denied. Private responses carry noindex and no-store; robots.txt is not used as authentication.

Public feature descriptions and FAQ explain the actual integrity-check semantics, not unverified live threat detection, provider connectivity or independent truth. Public URLs have canonical metadata and visible answer content, and the sitemap includes only public explanatory pages. Training crawler directives are advisory, not access control. Ranking, indexing and rich results are not guaranteed.

Run from web/: node build.mjs && node --check public/app.js && node --check public/public-ui.js && node --test worker.test.mjs workspace.test.mjs auth.test.mjs release-config.test.mjs atmosphere.test.mjs access.test.mjs

Optional local Chromium audit: install Playwright for Python and Chromium in an authorized development environment, then run python offline-audit.py (expects /usr/bin/chromium). This renders actual Worker-generated HTML with its external public script inserted inline for offline verification; it is not a network navigation or live deployment test. The fixture uses fictional credentials and no provider calls. Production auth, D1 session checks and browser playback must be verified separately. The public entrance stays available, but access to real tools fails closed until configured customer authentication is active.
