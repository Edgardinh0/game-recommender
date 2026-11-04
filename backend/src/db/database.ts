import { Pool } from "../../node_modules/@types/pg/index.js";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

export default pool