import pool from "../src/db/database.js";
import axios from "axios";

export const RAWG_API = 'https://api.rawg.io/api' 

type rawgGame = {
    id: number,
    name: string,
    released: string,
    rating: number,
    background_image: string
}

async function fetchGames() {
    try {
        const response = await axios.get(`${RAWG_API}/games`, {
            params: {
                key: process.env.RAWG_API_KEY,
                page_size: 5
            }
        })

        return response.data.results
    } catch(error) {
        console.log(error)
    }
}

async function getOrCreateGenre(genre: string, rawg_id: number) {
    const insertQuery = `INSERT INTO genres (name, rawg_id) VALUES ($1, $2) ON CONFLICT (rawg_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`

    const result = await pool.query(insertQuery, [genre, rawg_id])
    return result.rows[0].id
}

async function addGametoDB(game: rawgGame) {
    const insertQuery = `INSERT INTO games (rawg_id, title, release_date
        rating, background_image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (rawg_id) DO NOTHING
    )`
    await pool.query(insertQuery, [game.id, game.name, game.released, game.rating, game.background_image])
}

async function addGameGenre(game: rawgGame, genreId: number) {
    const selectQuery = `SELECT id FROM games WHERE rawg_id = $1`
    const result = (await pool.query(selectQuery, [game.id])).rows[0].id
    const insertQuery = `INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT (game_id, genre_id) DO NOTHING`
    await pool.query(insertQuery, [result, genreId])
}

export async function loadGames() {
    const rawgGames = await fetchGames()

    for (const rawgGame of rawgGames) {
        await addGametoDB(rawgGame)
        const genreIds = []
        for (const genre of rawgGame.genres) {
            const id = await getOrCreateGenre(genre.name, genre.id)
            genreIds.push(id)

        }
        console.log(`Обработана ${rawgGame.name} жанры: ${genreIds}`)
    }

}
