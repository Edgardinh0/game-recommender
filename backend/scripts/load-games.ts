import 'dotenv/config'
import pool from "../src/db/database.js";
import axios from "axios";
import { blacklist } from "../src/utils/blacklist.js";


export const RAWG_API = 'https://api.rawg.io/api' 


type rawgGame = {
    id: number,
    name: string,
    released: string,
    rating: number,
    background_image: string,
    genres: Array<{id: number, name: string}>,
    tags: Array<{id: number, name: string}>
}

async function fetchGames(page: number, page_size: number) {
    try {
        const response = await axios.get(`${RAWG_API}/games`, {
            params: {
                key: process.env.RAWG_API_KEY,
                page_size: page_size,
                page: page
            }
        })

        return response.data.results
    } catch(error) {
        console.log(error)
        return []
    }
}

async function getOrCreateGenre(genre: string, rawg_id: number) {
    const insertQuery = `INSERT INTO genres (name, rawg_id) VALUES ($1, $2) ON CONFLICT (rawg_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`

    const result = await pool.query(insertQuery, [genre, rawg_id])
    return result.rows[0].id
}

async function getOrCreateTag(tag: string, rawg_id: number) {
    const insertQuery = `INSERT INTO tags (name, rawg_id) VALUES ($1, $2) ON CONFLICT (rawg_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`

    const result = await pool.query(insertQuery, [tag, rawg_id])
    return result.rows[0].id
}

async function addGametoDB(game: rawgGame) {
    const insertQuery = `INSERT INTO games (rawg_id, title, release_date, rating, background_image) 
                        VALUES ($1, $2, $3, $4, $5) 
                        ON CONFLICT (rawg_id) 
                        DO UPDATE SET 
                            title = EXCLUDED.title,
                            release_date = EXCLUDED.release_date,
                            rating = EXCLUDED.rating,
                            background_image = EXCLUDED.background_image
                        RETURNING id`
    const result = await pool.query(insertQuery, [game.id, game.name, game.released,game.rating, game.background_image])
    return result.rows[0].id
}

async function addGameGenre(gameId: number, genreId: number) {
    const insertQuery = `INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT (game_id, genre_id) DO NOTHING`
    await pool.query(insertQuery, [gameId, genreId])
}

async function addGameTag(gameId: number, tagId: number) {
    const insertQuery = `INSERT INTO game_tags (game_id, tag_id) VALUES ($1, $2) ON CONFLICT (game_id, tag_id) DO NOTHING`
    await pool.query(insertQuery, [gameId, tagId])
}

export async function loadGames() {
    const totalPages = 40
    const pageSize = 50
    
    for (let i = 20; i <= totalPages; i++) {
        const rawgGames = await fetchGames(i, pageSize)

        for (const rawgGame of rawgGames) {
            const gameId = await addGametoDB(rawgGame)
            const genreIds = []
            const tagIds = []
            for (const genre of rawgGame.genres) {
                const id = await getOrCreateGenre(genre.name, genre.id)
                genreIds.push(id)
                await addGameGenre(gameId, id)
            }
            for (const tag of rawgGame.tags) {
                if (!blacklist.includes(tag.name.toLowerCase())) {
                    const id = await getOrCreateTag(tag.name, tag.id)
                    tagIds.push(id)
                    await addGameTag(gameId, id)
                }
            }
            console.log(rawgGame.name)
        }
        console.log('Страница ', i, ' загружена')
    }
}

await loadGames()