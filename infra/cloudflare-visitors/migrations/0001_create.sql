-- Anonymous visitor hashes. IP addresses and raw UUIDs are not persisted.
CREATE TABLE IF NOT EXISTS visitors (
  id_hash TEXT PRIMARY KEY NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS visitor_last_seen_idx ON visitors(last_seen);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value INTEGER NOT NULL
);
INSERT OR IGNORE INTO meta(key,value) VALUES('tracked_since',unixepoch());
