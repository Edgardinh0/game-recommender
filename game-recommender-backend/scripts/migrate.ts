import fs from 'node:fs'
import pool from '../src/db/database.js'
import path from 'node:path'

function getMigrationFiles(migrationsDir: string): string[] {
    const files = fs.readdirSync(migrationsDir)
    return files.filter(file => file.endsWith('.sql')).sort()
}

async function getAppliedMigrations(): Promise<string[]> {
    try {
        const selectQuery = `SELECT name FROM migrations`

        const result = await pool.query(selectQuery)
        return result.rows.map(file => file.name)
    } catch(err) {
        
        if ((err as any).code === '42P01') {
            return []
        }
        console.log(err)
        process.exit(1)
    }
}

async function applyMigration(files: string[], fileDir: string) {
    let transactionStarted = false
    try {
        for (const file of files) {
            
            const filePath = path.join(fileDir, file)
            console.log(filePath)
            await pool.query(`BEGIN`)
            const sql = fs.readFileSync(filePath, 'utf8')
            console.log(sql)
            transactionStarted = true
            await pool.query(sql)
            await pool.query(`INSERT INTO migrations (name) VALUES ($1)`, [file])
            await pool.query(`COMMIT`)
            transactionStarted = false
        }
    } catch(error) {
        if (!transactionStarted) {
            process.exit(1)
        }
        await pool.query(`ROLLBACK`)
        console.log('error')
        process.exit(1)
    }
}

export async function runMigrations() {
    const migrationsDir = path.join(import.meta.dirname, '..', 'migrations')
    
    try {
        const allFiles: string[] = await getMigrationFiles(migrationsDir)
        const appliedFiles: string[] = await getAppliedMigrations()
        const unappliedFiles: string[] = allFiles.filter(file => !appliedFiles.includes(file))
        await applyMigration(unappliedFiles, migrationsDir)
    } catch (err) {
        console.log(err)
        process.exit(1)
    }

}
