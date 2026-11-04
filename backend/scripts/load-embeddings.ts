import 'dotenv/config'
import { pipeline } from "@xenova/transformers";
import pool from "../src/db/database.js";


async function getGamesWithoutEmbeddings() {
    const selectQuery = `SELECT 
                            g.title, 
                            g.id,
                            STRING_AGG(DISTINCT gen.name, ', ') AS genres,
                            STRING_AGG(DISTINCT t.name, ', ') AS tags
                        FROM games g
                        LEFT JOIN game_genres gg ON g.id = gg.game_id
                        LEFT JOIN genres gen ON gg.genre_id = gen.id
                        LEFT JOIN game_tags tg ON g.id = tg.game_id
                        LEFT JOIN tags t ON tg.tag_id = t.id
                        WHERE g.embedding IS NULL
                        GROUP BY g.title, g.id
    `

    const result = await pool.query(selectQuery)
    return result.rows
}

async function generateEmbeddings() {
    let pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    
    const games = await getGamesWithoutEmbeddings()

    for (let game of games) {
        const genres = game.genres ?? ''
        const tags = game.tags ?? ''
        
        const stringToEmbed = `[Title]: ${game.title} [Genres]: ${genres.toString()} [Tags]: ${tags.toString()}`

        const embedding = await pipe(stringToEmbed, {pooling: 'mean', normalize: true})

        const embedString = `[${embedding.tolist().join(',')}]`

        const updateQuery = `UPDATE games SET embedding = $1 WHERE id = $2`

        await pool.query(updateQuery, [embedString, game.id])

        console.log(`Эмбеддинг для ${game.title} создан` )
    }
}

generateEmbeddings()