# Identity and advisory runtime candidate

Server-only library, not a hosted application or completed OAuth implementation. No real account identifiers, API keys, credentials or private evidence are included. Runtime disabled by default. Tests use fictional claims and mock HTTP only.

## Identity boundary
Use separate registered OAuth/OIDC clients and callbacks for each lane. A trusted server must verify signature, issuer, audience, expiry, nonce, state, PKCE and one-time transaction consumption before calling resolveIdentity. Configure clients as separate founder and customer maps by issuer. Founder email and issuer/client/subject must both match a privately enrolled identity; public registration never elevates privileges. Keep sessions separate and validate workspace ownership server-side. Do not accept role, claims, consent or membership from an untrusted browser as authoritative. No OAuth routes, account provisioning or session store are included.

## Advisory runtime boundary
The caller must enforce authenticated membership, CSRF, request limits, budget limits, evidence redaction and explicit per-provider consent. No tools or operational authority. OpenAI store:false does not guarantee zero retention. No production route or live provider calls are included. Verify provider configuration and account eligibility before activation.

## Local verification
Node 22.16.0: node --test runtime.test.mjs lane.test.mjs (9 passed). Initial lane test failed before separate client maps were implemented. This evidence is local; CI is separate.

Docs: https://developers.openai.com/siwc/website and https://developers.google.com/identity/openid-connect/reference
