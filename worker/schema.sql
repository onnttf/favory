CREATE TABLE IF NOT EXISTS collection (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id        TEXT NOT NULL,
    parent_collection_id TEXT,
    name                 TEXT NOT NULL,
    color                TEXT NOT NULL DEFAULT '#ffffff',
    sort                 INTEGER NOT NULL DEFAULT 1,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at           TEXT,
    UNIQUE (collection_id)
);

CREATE TABLE IF NOT EXISTS bookmark (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id   TEXT NOT NULL,
    collection_id TEXT,
    url           TEXT NOT NULL,
    url_hash      TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    favicon       TEXT,
    sort          INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT,
    UNIQUE (bookmark_id),
    UNIQUE (url_hash)
);

CREATE TABLE IF NOT EXISTS tag (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id     TEXT NOT NULL,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    UNIQUE (tag_id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS bookmark_tag (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id TEXT NOT NULL,
    tag_id      TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT,
    UNIQUE (bookmark_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmark_collection ON bookmark(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_sort ON bookmark(sort);
CREATE INDEX IF NOT EXISTS idx_bookmark_created ON bookmark(created_at);
CREATE INDEX IF NOT EXISTS idx_collection_sort ON collection(sort);
CREATE INDEX IF NOT EXISTS idx_bookmark_tag_bm ON bookmark_tag(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tag_tag ON bookmark_tag(tag_id);
