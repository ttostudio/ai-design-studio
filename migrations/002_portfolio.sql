-- #887 ポートフォリオギャラリー強化

-- FR-02-3: タグ機能
ALTER TABLE generations ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- FR-04-2: お気に入り
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_generations_is_favorite ON generations (is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_generations_tags        ON generations USING GIN (tags);
