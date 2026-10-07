CREATE TABLE IF NOT EXISTS interactions(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    action_type VARCHAR(10) CHECK (action_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS impressions(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    is_swiped BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, game_id)
);

CREATE INDEX idx_user_impressions ON impressions(user_id);
CREATE INDEX idx_unswiped_impressions ON impressions(user_id) WHERE is_swiped = false;