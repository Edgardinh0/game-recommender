import pool from "../db/database.js"
import express from "express"
import { checkJwt } from "../middleware/jwtcheck.js"
import { groupAnswersByMotivator, calculateMotivatorScores, calculateResultVector } from "../utils/testCalculator.js"

const router = express.Router()

type Question = {
    q_text: string
    id: number
}

async function getQuestions() {
    const selectQuery = `SELECT id, q_text FROM motivators`
    const result = await pool.query(selectQuery)
    return result.rows
}

router.get('/api/test/questions', checkJwt, async (req, res) => {
    try {
        const questions: Question[] = await getQuestions()
        
        if (questions.length === 0) {
            return res.status(404).json({ Message: 'No questions' })
        }
        
        return res.status(200).json({ questions, total: questions.length })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ Message: 'Internal server error' })
    }
})

router.post('/api/test/submit', checkJwt, async (req, res) => {
    try {
        const questions = await getQuestions()
        const { answers } = req.body
        const user = (req as any).userId
        const questionsId = answers.map((q: any) => q.question_id)
        
        // Валидация количества ответов
        if (answers.length !== questions.length) {
            return res.status(400).json({ Message: 'Not enough answers' })
        }
        
        // Валидация scores
        for (const ans of answers) {
            if (!Number.isInteger(ans.score) || ans.score < 1 || ans.score > 5) {
                return res.status(400).json({ Message: 'Incorrect score' })
            }
        }
        
        // Получаем мотиваторы для вопросов
        const selectQuery = `SELECT id, target_motivator FROM motivators WHERE id = ANY($1)`
        const result = await pool.query(selectQuery, [questionsId])
        
        if (result.rows.length !== answers.length) {
            return res.status(400).json({ error: 'Incorrect number of questions' })
        }
        
        const motivators = result.rows
        
        // Группируем ответы по мотиваторам
        const motivMap = groupAnswersByMotivator(answers, motivators)
        
        // Вычисляем проценты
        const motivatorScores = calculateMotivatorScores(motivMap)
        
        console.log('Motivator scores:', motivatorScores)
        
        // TODO: Получить векторы мотиваторов из БД
        const motivatorVectorsQuery = await pool.query(`SELECT motivator_name, motivator_vector::text FROM motivator_profiles`)
        let motivatorVectors = motivatorVectorsQuery.rows

        for (let motivator of motivatorVectors) {
            motivator.motivator_vector = JSON.parse(motivator.motivator_vector)
        }

        // TODO: Вычислить итоговый вектор
        const testVector = calculateResultVector(motivatorScores, motivatorVectors)
         
        // TODO: Сохранить в users
        const testVectorPG = `[${testVector.join(',')}]`

        const updateQuery = `UPDATE users SET test_profile_vector = $1, motivator_scores = $2 WHERE id = $3`
        await pool.query(updateQuery, [testVectorPG, JSON.stringify(motivatorScores), user])

        return res.status(200).json({ 
            message: 'Test submitted successfully',
            motivatorScores 
        })
        
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

export default router