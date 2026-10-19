import questions from '../src/utils/questions.js'
import pool from "../src/db/database.js";

type Question = {
    q_text: string,
    target_motivator: string
}

export async function addQuestions() {
    for (let q of questions) {
        const insertQuery = `INSERT INTO motivators (q_text, target_motivator) VALUES ($1, $2) ON CONFLICT (q_text) DO NOTHING`

        await pool.query(insertQuery, [q.q_text, q.target_motivator])
    }
}
