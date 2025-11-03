import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

type JwtPayload = { sub: string };

export async function requireAuth(
    req: Request & { userId?: string; user?: any },
    res: Response,
    next: NextFunction
) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as JwtPayload;

        req.userId = payload.sub;
        req.user = await User.findById(payload.sub).select('_id email name').lean();
        if (!req.user) return res.status(401).json({ error: 'User not found' });

        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
