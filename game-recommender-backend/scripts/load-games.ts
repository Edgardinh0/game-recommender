import pool from "../src/db/database.js";
import axios from "axios";

export const RAWG_API = 'https://api.rawg.io/api' 

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

export async function loadGames() {
    const rawgGames = await fetchGames()

    for (const rawgGame of rawgGames) {
        const genreIds = []
        for (const genre of rawgGame.genres) {
            const id = await getOrCreateGenre(genre.name, genre.id)
            genreIds.push(id)
        }
        console.log(`Обработана ${rawgGame.name} жанры: ${genreIds}`)
    }

}
