import express, { Express, Request, Response } from "express";
import 'dotenv/config'
import cors from 'cors'
import { runMigrations } from "../scripts/migrate.js";
import similarRoutes from '../src/routes/similar.js'
import authRoutes from '../src/routes/auth.js'


const app: Express = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(similarRoutes)
app.use(authRoutes)

app.get('/', (req, res) => {
    res.json('csac')
})

await runMigrations()


app.listen(port, () => {
    console.log('server is running')
})