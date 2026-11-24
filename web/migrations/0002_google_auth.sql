CREATE TABLE IF NOT EXISTS customer_oauth_transactions (
 state TEXT PRIMARY KEY,
 nonce TEXT NOT NULL,
 verifier TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_oauth_expiry ON customer_oauth_transactions(expires_at);
