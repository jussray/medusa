# Release configuration

The source-based build connection is established for this repository. This release configuration generator keeps the canonical HTML untouched and binds only the dedicated D1 database identified by MEDUSA_D1_DATABASE_ID, supplied through the authorized build environment. No account-specific identifiers or credentials belong in the public repository.

From web/ run node build.mjs and node --test worker.test.mjs workspace.test.mjs auth.test.mjs release-config.test.mjs. With the approved D1 ID supplied by the build environment, run node release-config.mjs. The generated wrangler.release.toml is ignored by Git and is created only if it does not already exist. Review the generated binding before using the authorized Wrangler deployment path with --config wrangler.release.toml. Public URLs, workspace activation, Google OAuth and AI remain disabled. A separate runtime verification is required for activation. The generator itself never contacts Cloudflare or deploys.

Build credentials must be dedicated to Medusa and configured privately in Cloudflare Workers Builds. Never reuse another application's credential. The production database has been provisioned and its schema read back; no live Worker deployment is claimed here.
