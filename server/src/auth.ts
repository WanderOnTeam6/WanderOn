import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from './middleware/requireAuth';
import { User } from './models/User';


const router = express.Router();

/**
 * POST /auth/login
 * Logs in a user and returns a JWT if email/password match.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN] inbound', { email, passwordLen: password?.length });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[LOGIN] user not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.password !== password) {
      console.log('[LOGIN] wrong password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'dev', {
      expiresIn: '1h',
    });

    console.log('[LOGIN] success');
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error('[LOGIN] error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

/**
 * POST /auth/register
 * Registers a new user (DEV: plaintext password).
 */
router.post('/register', async (req, res) => {
  try {
    const firstName = (req.body?.firstName ?? '').trim();
    const lastName = (req.body?.lastName ?? '').trim();
    const email = (req.body?.email ?? '').trim().toLowerCase();
    const password = (req.body?.password ?? '').toString();

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password, // NOTE: plaintext for development
      name: `${firstName} ${lastName}`,
    });

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'dev', {
      expiresIn: '1h',
    });

    console.log('[REGISTER] success', email);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    console.error('[REGISTER] error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json(req.user); // { _id, email, name }
});

export default router;
