import pool from "../src/db/database.js"
import { pipeline } from '@xenova/transformers'
import motivator_profiles from "../src/utils/motivator_profiles.js"

export async function generateMPEmbeddings() {
    let pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    
    for (let motivator of motivator_profiles) {
        
        const stringToEmbed = `[Motivator_desc]: ${motivator.motivator_desc}`

        const embedding = await pipe(stringToEmbed, {pooling: 'mean', normalize: true})

        const embedString = `[${embedding.tolist().join(',')}]`

        const insertQuery = `INSERT INTO motivator_profiles (motivator_name, motivator_desc, motivator_vector) VALUES ($1, $2, $3) ON CONFLICT (motivator_name) DO UPDATE SET motivator_name = EXCLUDED.motivator_name, motivator_desc = EXCLUDED.motivator_desc, motivator_vector = EXCLUDED.motivator_vector`

        await pool.query(insertQuery, [motivator.motivator_name, motivator.motivator_desc, embedString])
    }
}