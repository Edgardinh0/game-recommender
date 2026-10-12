import express, { Request, Response } from "express";
import { checkJwt } from "../middleware/jwtcheck.js";
import pool from "../db/database.js";

const router = express.Router()

async function addToImpressions(gameId: number, userId: number) {
    const insertQuery = `INSERT INTO impressions (game_id, user_id) VALUES ($1, $2) ON CONFLICT (game_id, user_id) DO NOTHING`
    await pool.query(insertQuery, [gameId, userId])
}

router.post('/api/games/:gameId/interact', checkJwt, async (req, res) => {
    try {
        const gameId = parseInt(req.params.gameId as string, 10)
        const actionType = req.body.action_type
        if (actionType !== 'like' && actionType !== 'dislike') {
            return res.status(400).json({error: 'Incorrect interaction'})
        }

        const userId = (req as any).userId

        const insertQuery = `INSERT INTO interactions (user_id, game_id, action_type) VALUES ($1, $2, $3) ON CONFLICT (user_id, game_id) DO UPDATE SET action_type = EXCLUDED.action_type RETURNING *`
        const result = await pool.query(insertQuery, [userId, gameId, actionType])

        return res.status(200).json({Message: result.rows[0]})
    } catch (error) {
        return res.status(500).json({error: 'internal server error'})
    }
})

router.get('/api/games/swipe', checkJwt, async (req, res) => {
    try {
        const userId = (req as any).userId
        const checkQuery = `SELECT COUNT(*) FROM interactions WHERE user_id = $1 AND action_type = 'like'`
        const checkResult = await pool.query(checkQuery, [userId])
        let game
        if (checkResult.rows[0].count === '0') {
            const selectQuery = `SELECT id, title, background_image, rating FROM games ORDER BY RANDOM() LIMIT 1`
            const result = await pool.query(selectQuery)
            if (result.rows.length === 0) {
                return res.status(404).json({Message: 'No more games('})
            }
            game = result.rows[0]
        } else {
            const selectQuery = `SELECT * FROM (SELECT id, title, background_image, rating from games WHERE id NOT IN (SELECT game_id FROM impressions WHERE user_id = $1) AND id NOT IN (SELECT game_id FROM interactions WHERE user_id = $1) ORDER BY embedding <=> (SELECT AVG(games.embedding) FROM interactions LEFT JOIN games ON interactions.game_id = games.id WHERE user_id = $1 AND action_type = 'like') LIMIT 20) as top_games ORDER BY RANDOM () LIMIT 1`
            const result = await pool.query(selectQuery, [userId])
            if (result.rows.length === 0) {
                return res.status(404).json({Message: 'No more games('})
            }
            game = result.rows[0]
        }
        await addToImpressions(game.id, userId)
        return res.status(200).json(game)
    } catch(error) {
        return res.status(500).json({Message: 'Internal server error'})
    }
})

export default router