import type { Document } from 'mongoose';

export interface UserDocument extends Document {
    _id: string;
    email: string;
    name: string;
}

declare global {
    namespace Express {
        export interface Request {
            user?: UserDocument | null;
            userId?: string;
        }
    }
}
