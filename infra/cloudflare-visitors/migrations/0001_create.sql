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

-- Submitted ideas are held for manual moderation; they are never auto-posted.
CREATE TABLE IF NOT EXISTS ideas (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 created_at INTEGER NOT NULL,
 content TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS ideas_moderation_idx ON ideas(status,created_at);
-- Hashed rate limiter, raw visitor IP addresses are never persisted.
CREATE TABLE IF NOT EXISTS idea_limits (
 peer_hash TEXT PRIMARY KEY NOT NULL,
 window_start INTEGER NOT NULL,
 count INTEGER NOT NULL
);

-- Anonymous 20-in-1 Humor Park poll votes. Only hashes and selected option are persisted.
CREATE TABLE IF NOT EXISTS park_votes (
  poll_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  voted_at INTEGER NOT NULL,
  PRIMARY KEY (poll_id,voter_hash)
);
CREATE INDEX IF NOT EXISTS park_votes_by_option ON park_votes(poll_id,option_index);
CREATE TABLE IF NOT EXISTS park_vote_limits (
  peer_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
