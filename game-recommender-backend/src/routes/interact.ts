import express, { Request, Response } from "express";
import { checkJwt } from "../middleware/jwtcheck.js";
import pool from "../db/database.js";

const router = express.Router()

function getResultVector(testVector: number[], behaviorVector: number[], alpha: number) {
    let finalVector = new Array(384).fill(0)
    for (let i = 0; i < 384; i++) {
        finalVector[i] = alpha * testVector[i] + (1 - alpha) * behaviorVector[i]
    }

    return finalVector
}

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
        console.log(error)
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
        console.log(error)
        return res.status(500).json({Message: 'Internal server error'})
    }
})

router.get('/api/games/recommended', checkJwt, async (req, res) => {
    try {
        const userId = (req as any).userId
        const userVectorQuery = `SELECT test_profile_vector::text FROM users WHERE id = $1`
        const userVectorResult = await pool.query(userVectorQuery, [userId])
        
        if (userVectorResult.rows.length === 0 || userVectorResult.rows[0].test_profile_vector === null) {
            return res.status(404).json({'Message': 'No test found'})
        }
        const testProfileVector = JSON.parse(userVectorResult.rows[0].test_profile_vector)

        const selectLikesCountQuery = `SELECT 
                    COUNT(*) as likes_count
                    FROM interactions i
                    JOIN games g ON i.game_id = g.id
                    WHERE i.user_id = $1 AND i.action_type = 'like'`
        
        const selectBehaviorVectorQuery = `SELECT 
            AVG(g.embedding)::text as behavior_vector
            FROM interactions i
            JOIN games g ON i.game_id = g.id
            WHERE i.user_id = $1 AND i.action_type = 'like'`

        const countResult = await pool.query(selectLikesCountQuery, [userId])

        const likes_count = Number(countResult.rows[0].likes_count)

        let recommendationVector

        if (likes_count === 0) {
            recommendationVector = testProfileVector
        } else {
            const bvectorResult = await pool.query(selectBehaviorVectorQuery, [userId])
            const behaviorVector = JSON.parse(bvectorResult.rows[0].behavior_vector)

            const alpha = 1 / (1 + likes_count / 15)

            recommendationVector = getResultVector(testProfileVector, behaviorVector, alpha)
        }

        const recommendationsQuery = `
        SELECT 
            g.id,
            g.title,
            g.description,
            g.release_date,
            g.rating,
            g.background_image,
            STRING_AGG(DISTINCT gen.name, ', ') AS genres,
            STRING_AGG(DISTINCT t.name, ', ') AS tags
            FROM games g
            LEFT JOIN game_genres gg ON g.id = gg.game_id
            LEFT JOIN genres gen ON gg.genre_id = gen.id
            LEFT JOIN game_tags gt ON g.id = gt.game_id
            LEFT JOIN tags t ON gt.tag_id = t.id
            WHERE g.embedding IS NOT NULL AND g.id NOT IN (SELECT game_id FROM interactions WHERE user_id = $2)
            GROUP BY g.id, g.title, g.description, g.release_date, g.rating, g.background_image
            ORDER BY g.embedding <=> $1
            LIMIT 10
        `
        const recommendationsResult = await pool.query(recommendationsQuery, [JSON.stringify(recommendationVector), userId])
        const recommendations = recommendationsResult.rows

        return res.status(200).json({'Recommendations': recommendations})
    } catch(error) {
        console.log(error)
        return res.status(500).json({'Error': 'Internal server error'})
    }
})

export default router