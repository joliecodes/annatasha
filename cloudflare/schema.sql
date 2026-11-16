-- Run once in Cloudflare → D1 → annatasha-comments → Console
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post TEXT NOT NULL,
  post_title TEXT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reply TEXT,
  reply_at TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post, status);
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments (ip_hash, created_at);
