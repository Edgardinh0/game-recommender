import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

export function checkJwt(req: Request, res: Response, next: NextFunction) {
    try {
        const header = req.headers.authorization
        const token = header?.split(' ')[1]

        if (!token) {
            return res.status(401).json({error: 'No token provided'})
        }

        const decodedValue = jwt.verify(token, process.env.JWT_SECRET as string)

        if (decodedValue) {
            (req as any).userId = (decodedValue as any).userId
            next()
        }

    } catch(error) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}
