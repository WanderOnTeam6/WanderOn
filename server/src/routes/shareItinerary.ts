import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { ShareItinerary } from '../models/ShareItinerary';
import { User } from '../models/User';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

/* ---------- Helper function to populate user data ---------- */
async function populateGroupWithUserData(group: any) {
    // Populate members with user data
    const memberIds = group.members.map((m: any) => m.userId);
    const users = await User.find({ _id: { $in: memberIds } }).select('_id email name').lean();
    
    const populatedMembers = group.members.map((member: any) => {
        const user = users.find((u: any) => u._id.toString() === member.userId.toString());
        return {
            ...member.toObject(),
            userName: user?.name || 'Unknown User',
            userEmail: user?.email
        };
    });

    // Populate messages with user data  
    const messageUserIds = [...new Set(group.messages.map((m: any) => m.userId.toString()))];
    const messageUsers = await User.find({ _id: { $in: messageUserIds } }).select('_id name').lean();
    
    const populatedMessages = group.messages.map((message: any) => {
        const user = messageUsers.find((u: any) => u._id.toString() === message.userId.toString());
        return {
            ...message.toObject(),
            userName: user?.name || 'Unknown User'
        };
    });

    return {
        ...group.toObject(),
        members: populatedMembers,
        messages: populatedMessages
    };
}

// Apply auth middleware to all routes
router.use(requireAuth);

/* ---------- Create a new shared itinerary group ---------- */
router.post('/', async (req, res) => {
    try {
        const { name, description, itineraryId } = req.body;
        const userId = req.user?._id;

        if (!name || !itineraryId) {
            return res.status(400).json({ error: 'Name and itinerary ID are required' });
        }

        // Check if a group already exists for this itinerary
        const existingGroup = await ShareItinerary.findOne({ itineraryId, isActive: true });
        if (existingGroup) {
            return res.status(400).json({ error: 'A shared group already exists for this itinerary' });
        }

        const shareGroup = new ShareItinerary({
            name,
            description: description || '',
            itineraryId,
            createdBy: userId,
            members: [{
                userId,
                role: 'admin'
            }]
        });

        await shareGroup.save();
        
        // Populate with user data before returning
        const populatedGroup = await populateGroupWithUserData(shareGroup);
        res.status(201).json(populatedGroup);
    } catch (error: any) {
        console.error('Error creating shared itinerary:', error);
        res.status(500).json({ error: 'Failed to create shared itinerary group' });
    }
});

/* ---------- Get all groups for the current user ---------- */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?._id;
        const groups = await ShareItinerary.find({ "members.userId": userId, isActive: true });
        
        // Populate all groups with user data
        const populatedGroups = await Promise.all(
            groups.map(group => populateGroupWithUserData(group))
        );
        
        res.json(populatedGroups);
    } catch (error: any) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

/* ---------- Get a specific group by ID ---------- */
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?._id;

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is a member of this group
        const isMember = group.members.some((member: any) => 
            member.userId.toString() === userId?.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
        }

        // Populate with user data before returning
        const populatedGroup = await populateGroupWithUserData(group);
        res.json(populatedGroup);
    } catch (error: any) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

/* ---------- Add a member to a group ---------- */
router.post('/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: newUserId, role = 'member' } = req.body;
        const currentUserId = req.user?._id;

        if (!newUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Verify the new user exists
        const newUser = await User.findById(newUserId);
        if (!newUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if current user is admin
        const currentMember = group.members.find((member: any) => 
            member.userId.toString() === currentUserId?.toString()
        );
        if (!currentMember || currentMember.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can add members' });
        }

        await group.addMember(newUserId, role);
        
        // Add system message
        await group.addMessage('system', `${newUser.name} joined the group`, 'system');

        // Return populated group
        const populatedGroup = await populateGroupWithUserData(group);
        res.json(populatedGroup);
    } catch (error: any) {
        console.error('Error adding member:', error);
        if (error.message === 'User is already a member of this group') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add member' });
    }
});

/* ---------- Remove a member from a group ---------- */
router.delete('/:groupId/members/:targetUserId', async (req, res) => {
    try {
        const { groupId, targetUserId } = req.params;
        const currentUserId = req.user?._id;

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if current user is admin or removing themselves
        const currentMember = group.members.find((member: any) => 
            member.userId.toString() === currentUserId?.toString()
        );
        const targetMember = group.members.find((member: any) => member.userId.toString() === targetUserId);

        if (!currentMember) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        if (currentUserId?.toString() !== targetUserId && currentMember.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove other members' });
        }

        if (!targetMember) {
            return res.status(404).json({ error: 'Target user is not a member of this group' });
        }

        // Get user name for system message
        const targetUser = await User.findById(targetUserId).select('name');
        
        await group.removeMember(targetUserId);
        
        // Add system message
        await group.addMessage('system', `${targetUser?.name || 'User'} left the group`, 'system');

        // Return populated group
        const populatedGroup = await populateGroupWithUserData(group);
        res.json(populatedGroup);
    } catch (error: any) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

/* ---------- Send a message to the group chat ---------- */
router.post('/:groupId/messages', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { message, type = 'text' } = req.body;
        const userId = req.user?._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is a member
        const isMember = group.members.some((member: any) => 
            member.userId.toString() === userId?.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: 'Only group members can send messages' });
        }

        await group.addMessage(userId, message.trim(), type);

        // Get the newly added message with user data
        const newMessage = group.messages[group.messages.length - 1];
        const user = await User.findById(userId).select('name');
        
        const populatedMessage = {
            ...newMessage.toObject(),
            userName: user?.name || 'Unknown User'
        };

        res.status(201).json(populatedMessage);
    } catch (error: any) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/* ---------- Get messages for a group ---------- */
router.get('/:groupId/messages', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const userId = req.user?._id;

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is a member
        const isMember = group.members.some((member: any) => 
            member.userId.toString() === userId?.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: 'Only group members can view messages' });
        }

        // Get messages with pagination
        const messages = group.messages
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(Number(offset), Number(offset) + Number(limit));

        // Populate messages with user data
        const messageUserIds = [...new Set(messages.map((m: any) => m.userId.toString()))];
        const users = await User.find({ _id: { $in: messageUserIds } }).select('_id name').lean();
        
        const populatedMessages = messages.map((message: any) => {
            const user = users.find((u: any) => u._id.toString() === message.userId.toString());
            return {
                ...message.toObject(),
                userName: user?.name || 'Unknown User'
            };
        });

        res.json(populatedMessages);
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/* ---------- Update group details ---------- */
router.put('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user?._id;

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is admin
        const member = group.members.find((member: any) => 
            member.userId.toString() === userId?.toString()
        );
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update group details' });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;

        await group.save();
        
        // Return populated group
        const populatedGroup = await populateGroupWithUserData(group);
        res.json(populatedGroup);
    } catch (error: any) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

/* ---------- Delete/Deactivate a group ---------- */
router.delete('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?._id;

        const group = await ShareItinerary.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is admin or creator
        const member = group.members.find((member: any) => 
            member.userId.toString() === userId?.toString()
        );
        if (!member || (member.role !== 'admin' && group.createdBy.toString() !== userId?.toString())) {
            return res.status(403).json({ error: 'Only admins or creators can delete groups' });
        }

        // Soft delete by marking as inactive
        group.isActive = false;
        await group.save();

        res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

export default router;