CREATE TABLE IF NOT EXISTS generations (
  id              TEXT        PRIMARY KEY,
  prompt_id       TEXT,
  prompt          TEXT        NOT NULL,
  negative_prompt TEXT,
  workflow        TEXT        NOT NULL,
  width           INTEGER     NOT NULL,
  height          INTEGER     NOT NULL,
  steps           INTEGER     NOT NULL,
  cfg_scale       REAL        NOT NULL,
  seed            BIGINT      NOT NULL DEFAULT -1,
  template_id     TEXT,
  image_url       TEXT,
  image_filename  TEXT,
  image_subfolder TEXT        NOT NULL DEFAULT '',
  execution_time  INTEGER,
  status          TEXT        NOT NULL CHECK (status IN ('success', 'error')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at  ON generations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_workflow     ON generations (workflow);
CREATE INDEX IF NOT EXISTS idx_generations_template_id  ON generations (template_id);
CREATE INDEX IF NOT EXISTS idx_generations_prompt_id    ON generations (prompt_id);
