CREATE TABLE IF NOT EXISTS games(
    id SERIAL PRIMARY KEY,
    rawg_id INT UNIQUE NOT NULL,
    title TEXT,
    game_description TEXT,
    release_date DATE,
    rating FLOAT,
    background_image TEXT,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genres(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    rawg_id INT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tags(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    rawg_id INT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS game_genres(
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_tags(
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, tag_id)
);

CREATE INDEX idx_game_genres_game_id ON game_genres(game_id);
CREATE INDEX idx_game_genres_genre_id ON game_genres(genre_id);

CREATE INDEX idx_game_tags_game_id ON game_tags(game_id);
CREATE INDEX idx_game_tags_tag_id ON game_tags(tag_id);