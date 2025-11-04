import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/* ---------- Find user by email ---------- */
router.get('/by-email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email address is required' });
        }

        console.log('🔍 Looking for user with email:', email);
        
        // Find user by email (case insensitive)
        const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        }).select('_id email name').lean();

        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(404).json({ error: 'User not found with this email address' });
        }

        console.log('✅ Found user:', user);
        res.json(user);
    } catch (error: any) {
        console.error('Error finding user by email:', error);
        res.status(500).json({ error: 'Failed to find user' });
    }
});

/* ---------- Get current user profile ---------- */
router.get('/me', async (req, res) => {
    try {
        const userId = req.user?._id;
        
        const user = await User.findById(userId).select('_id email name').lean();
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

export default router;