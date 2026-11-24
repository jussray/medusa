# Google customer identity candidate

Disabled by default. Customer-only authorization code flow with state, nonce, S256 PKCE, signature and claim validation, single-use transaction consumption, hashed opaque sessions and same-origin logout. No Gmail scopes or email collection. Do not configure the same OAuth client for founder and customer accounts.

Apply the two workspace/auth migrations to an authorized dedicated D1 database, configure WORKSPACE_DB, MEDUSA_PUBLIC_ORIGIN (HTTPS), and a registered customer Google OAuth client and secret. Register the exact /auth/google/callback URL at Google. Establish quotas, privacy and retention policy and verify production D1 and browser login/logout before enabling MEDUSA_WORKSPACE_ENABLED and MEDUSA_GOOGLE_ENABLED. Do not put secrets in Git. No real provider calls, database creation or production changes were made. Google configuration is not proof of provider connectivity. ChatGPT and founder OAuth remain pending.

Tests: signed fictional JWTs and SQLite-backed fixtures. Canon HTML remains byte-identical.

Official reference: https://developers.google.com/identity/openid-connect/openid-connect
