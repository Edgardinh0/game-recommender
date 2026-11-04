ALTER TABLE motivators DROP COLUMN IF EXISTS player_type;

ALTER TABLE motivators ADD COLUMN IF NOT EXISTS target_motivator VARCHAR(50);

ALTER TABLE motivators ADD CONSTRAINT motivators_q_text_unique UNIQUE (q_text);

CREATE TABLE IF NOT EXISTS motivator_profiles(
    id SERIAL PRIMARY KEY,
    motivator_name TEXT,
    motivator_desc TEXT,
    motivator_vector vector(384)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS motivator_scores jsonb