import express from 'express'
import pool from '../db/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const router = express.Router()

router.post('/api/auth/register', async (req, res) => {
    try {
        const {username, password} = req.body
        // Check that username and password are provided
        if (!username || !password) {
            return res.status(400).json({error: 'Must include username AND password'})
        }
        
        // Username checks
        if (username.length < 3) {
            return res.status(400).json({error: 'Username must be at least 3 characters long'})
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({error: 'Username must consist of only letters, numbers and _'})
        }

        // Password checks
        if (password.length < 6) {
            return res.status(400).json({error: 'Password must be at least 6 characters long'})
        }

        // Hashing password
        const saltRound = 10
        const hash = await bcrypt.hash(password, saltRound)

        // Insert into BD
        const insertQuery = `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`

        const result = await pool.query(insertQuery, [username, hash])

        res.status(201).json({
            message: 'User was created',
            user: result.rows[0]
        })
    } catch(error: any) {
        if (error.code === '23505') {
            return res.status(409).json({error: 'Username already exists'})
        }
        console.log('Registration error')
        res.status(500).json({error: 'Server error'})
    }
})

router.post('/api/auth/login', async(req, res) => {
    try {
        const {username, password} = req.body
        
        //Check if username and password are inputted
        if (!username || !password) {
            return res.status(400).json({error: 'Input username and password'})
        }

        const selectQuery = 'SELECT password_hash, id FROM users WHERE username = $1'
        const result = await pool.query(selectQuery, [username])
        
        // Check if username exists
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'User doesnt exist'})
        }

        // Check that passwords match
        if (await bcrypt.compare(password, result.rows[0].password_hash)) {
            const token = jwt.sign({userId: result.rows[0].id, username: username}, process.env.JWT_SECRET as string)
            return res.json({token: token, user: {username: username, userId: result.rows[0].id}})
        } else {
            return res.status(401).json({error: 'Invalid password'})
        }
    } catch(error: any) {
        res.status(500).json({error: 'internal server error'})
    }
})

export default router