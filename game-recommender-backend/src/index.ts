import express, { Express, Request, Response } from "express";
import 'dotenv/config'
import cors from 'cors'
import pool from "./db/database.js";
import { runMigrations } from "../scripts/migrate.js";


const app: Express = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.json('csac')
})

// async function connectDB() {
//     try {
//         await pool.query('SELECT NOW() as current_time')
//         console.log('db conencted')
//     } catch (error) {
//         console.log('error', error)
//         process.exit(1)
//     }
// }

// await connectDB()

await runMigrations()

app.listen(port, () => {
    console.log('server is running')
})