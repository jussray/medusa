# Production acceptance

Public anonymous verification: from web/ run node smoke.mjs https://medusa-public-review.mcgill-raylene.workers.dev. It checks nine public and restricted routes, does not use an account, and exits nonzero on failure, including network errors. This is not authenticated browser proof.

Google: register a dedicated web OAuth client in Google Auth Platform. Register the exact callback https://medusa-public-review.mcgill-raylene.workers.dev/auth/google/callback. Configure the customer client ID and secret through Cloudflare private settings, never Git. Set MEDUSA_PUBLIC_ORIGIN to the actual HTTPS origin. Enable workspace and Google flags only after provider configuration, and confirm actual signup, session expiry, logout, and account isolation. Founder enrollment remains separate.

Official Google guide: https://developers.google.com/identity/protocols/oauth2/web-server

Sign in with ChatGPT for websites requires partner eligibility and an issued client. Do not conflate website identity with permission to use a ChatGPT plan. See https://developers.openai.com/siwc/website and https://developers.openai.com/siwc/request-client-id.

Production AI activation remains disabled. No provider calls or credentials are needed for the anonymous smoke suite. Search indexing and real browser acceptance are separate gates.
