// server/src/index.ts
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import authRouter from './auth';
import { User } from './models/User';
import itineraryRouter from './routes/itinerary'; // <-- ADD

const app = express();

// ---- CORS (Bearer token only; no cookies) ----
const corsConfig: cors.CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsConfig));

// Explicit preflight handler
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---- JSON parsing & routes ----
app.use(express.json());

// Health + root
app.get('/', (_req, res) => res.send('WanderOn API: OK'));     // <-- ADD
app.get('/healthz', (_req, res) => res.json({ ok: true }));    // <-- ADD
app.get('/ping', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/itinerary', itineraryRouter); // <-- ensure this line exists

// Debug endpoint (optional)
app.get('/debug/db', async (_req, res) => {
  try {
    const dbName = mongoose.connection.name;
    const coll = User.collection.collectionName;
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
