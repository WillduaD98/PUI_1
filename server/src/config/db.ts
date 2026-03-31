import mongoose from 'mongoose';
import {env} from './env.js';

export async function connectDB() {
    if (!env.MONGODB_URI) throw new Error('Missing env var: MONGODB_URI');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB Successfully!');
}
