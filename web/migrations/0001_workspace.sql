CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role = 'customer'),
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1))
);
CREATE TABLE IF NOT EXISTS customer_receipts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  hash_match INTEGER NOT NULL CHECK(hash_match IN (0,1)),
  quote_match INTEGER NOT NULL CHECK(quote_match IN (0,1)),
  checked_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_receipts_owner ON customer_receipts(customer_id, checked_at DESC, id DESC);
