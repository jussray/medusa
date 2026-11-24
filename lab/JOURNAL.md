# Synthetic journal acceptance model

SQLite persists fictional fixture state and reservations. Test processes use newly created temporary databases. The model does not move, read, or quarantine actual target files. The process concurrency tests use two spawned workers; the restart tests terminate a child after a committed reservation and after a committed simulated metadata change. A fresh connection escalates unresolved intents instead of retrying them. This does not prove power-loss durability, real filesystem atomicity, signed authorization, or operational execution.

Local test receipt: 15 tests passed (10 existing + 5 new). Initial test invocation failed because the new module did not exist; the completed suite passed with ResourceWarning treated as an error. Prior registry receipt CI passed at f6eb21a6cb3448184c87d7fb8f60a1cb1c550573. No authority is conferred by these tests.
