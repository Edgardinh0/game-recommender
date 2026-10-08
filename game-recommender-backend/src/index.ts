import express, { Express, Request, Response } from "express";
import 'dotenv/config'
import cors from 'cors'
import pool from "./db/database.js";
import { runMigrations } from "../scripts/migrate.js";
import { loadGames } from "../scripts/load-games.js";
import similarRoutes from '../src/routes/similar.js'


const app: Express = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(similarRoutes)

app.get('/', (req, res) => {
    res.json('csac')
})

await runMigrations()


app.listen(port, () => {
    console.log('server is running')
})