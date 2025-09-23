// server/src/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from './models/User';

const router = Router();

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev', { expiresIn: '1h' });
}

// POST /auth/login  (DEV: plaintext password)
router.post('/login', async (req, res) => {
  try {
    const rawEmail = (req.body?.email ?? '').toString();
    const rawPassword = (req.body?.password ?? '').toString();

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    console.log('[LOGIN] inbound', { email, passwordLen: password.length });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Ensure emails in DB are stored lowercase for exact match
    function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    const user = await User.findOne({
      email: { $regex: `^${escapeRe(email)}$`, $options: 'i' }
    });
    console.log('[LOGIN] user found =', !!user);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // DEV ONLY: plaintext compare
    const ok = (user as any).password === password;
    console.log('[LOGIN] password ok =', ok);

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id);
    return res.json({
      token,
      user: { id: user.id, email: (user as any).email, name: (user as any).name },
    });
  } catch (e: any) {
    console.error('[LOGIN] error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// GET /auth/me  (Bearer token in Authorization header)
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as any;
    const user = await User.findById(payload.sub).select('email name');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (e) {
    console.warn('[ME] invalid token:', e);
    return res.status(401).json({ error: 'Invalid/expired token' });
  }
});

export default router;
