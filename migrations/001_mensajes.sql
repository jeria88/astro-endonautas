CREATE TABLE IF NOT EXISTS mensajes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  whatsapp    TEXT,
  mensaje     TEXT NOT NULL,
  leido       INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
