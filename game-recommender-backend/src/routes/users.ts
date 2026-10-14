import express from 'express'
import pool from '../db/database.js'
import { checkJwt } from '../middleware/jwtcheck.js'

const router = express.Router()

router.get('/api/users/me/likes', checkJwt, async (req, res) => {
    try {
        const userId = (req as any).userId
        const selectQuery = `
        SELECT games.id, games.background_image, games.rating, games.title, games.description, games.release_date,
            ARRAY_AGG(DISTINCT tags.name) as all_tags,
            ARRAY_AGG(DISTINCT genres.name) as all_genres,
            interactions.created_at
        
        FROM interactions
        LEFT JOIN games ON interactions.game_id = games.id
        LEFT JOIN game_genres ON games.id = game_genres.game_id
        LEFT JOIN genres ON game_genres.genre_id = genres.id
        LEFT JOIN game_tags ON games.id = game_tags.game_id
        LEFT JOIN tags ON game_tags.tag_id = tags.id
        
        WHERE user_id = $1 AND action_type = 'like'
        
        GROUP BY games.id, background_image, rating, title, description, release_date, interactions.created_at
        ORDER BY interactions.created_at DESC
        `        
        const result = await pool.query(selectQuery, [userId])

        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(500).json({Error: 'internal server error'})
    }
})

export default router