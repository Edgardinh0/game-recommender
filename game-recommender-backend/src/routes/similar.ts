import express from 'express'
import pool from '../db/database.js'

const router = express.Router()

router.get('/api/games/:id/similar', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10)
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Некорректный ID' })
        }

        const gameCheck = await pool.query(
            'SELECT id, embedding FROM games WHERE id = $1',
            [id]
        )
        
        if (gameCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Игра не найдена' })
        }
        
        if (!gameCheck.rows[0].embedding) {
            return res.status(400).json({ error: 'У игры нет эмбеддинга' })
        }

        const selectQuery = `
            SELECT id, title, background_image, rating,
                   ROUND((embedding <=> (SELECT embedding FROM games WHERE id = $1))::numeric, 4) as distance
            FROM games 
            WHERE id != $1 
              AND embedding IS NOT NULL
            ORDER BY embedding <=> (SELECT embedding FROM games WHERE id = $1)
            LIMIT 10
        `
        const result = await pool.query(selectQuery, [id])
        
        res.json(result.rows)
    } catch (error) {
        console.error('Ошибка при поиске похожих игр:', error)
        res.status(500).json({ error: 'Ошибка сервера' })
    }
})

export default router