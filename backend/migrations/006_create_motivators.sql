CREATE TABLE IF NOT EXISTS motivators(
    id SERIAL PRIMARY KEY,
    q_text TEXT NOT NULL,
    player_type VARCHAR(50) NOT NULL CHECK (player_type in ('achiever', 'explorer', 'socializer', 'killer', 'acrobat', 'gardener', 'slayer', 'skirmisher', 'gladiator', 'ninja', 'bounty hunter', 'architect', 'bard')),
    test_type VARCHAR(50) NOT NULL CHECK (test_type in ('bartle', 'quantic'))
)