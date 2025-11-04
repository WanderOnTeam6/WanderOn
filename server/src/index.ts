// server/src/index.ts
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import authRouter from './auth';
import { User } from './models/User';
import itineraryRouter from './routes/itinerary';
import shareItineraryRouter from './routes/shareItinerary';
import usersRouter from './routes/users';

const app = express();

// ---- CORS (Bearer token only; no cookies) ----
const corsConfig: cors.CorsOptions = {
  origin: '*', // dev: allow everything
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsConfig));

// Explicit preflight handler (no app.options pattern needed in Express 5)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---- JSON parsing & routes ----
app.use(express.json());
app.get('/ping', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);

// Quick debug: confirm DB/collection + how many users
app.get('/debug/db', async (_req, res) => {
  try {
    const dbName = mongoose.connection.name;              // should be "users_db"
    const coll = User.collection.collectionName;          // should be "users"
    const count = await User.countDocuments({});
    res.json({ dbName, coll, count });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'debug failed' });
  }
});


// ---- DB & listen ----
const PORT = Number(process.env.PORT || 4000);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Mongo connect error:', err);
    process.exit(1);
  });

app.use('/itinerary', itineraryRouter);
app.use('/share-itinerary', shareItineraryRouter);
app.use('/users', usersRouter);

