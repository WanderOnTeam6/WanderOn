import { api } from '@/lib/api';

// Types for shared itinerary
export type ChatMessage = {
    _id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    type: 'text' | 'itinerary_update' | 'system';
};

export type GroupMember = {
    userId: string;
    userName: string;
    role: 'admin' | 'member';
    joinedAt: string;
};

export type ShareItineraryGroup = {
    _id: string;
    name: string;
    description?: string;
    members: GroupMember[];
    itineraryId: string;
    messages: ChatMessage[];
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
};

/* ---------- Group Management ---------- */

// Create a new shared itinerary group
export async function createShareGroup(
    name: string, 
    itineraryId: string, 
    description?: string
): Promise<ShareItineraryGroup> {
    return api('/share-itinerary', {
        method: 'POST',
        body: JSON.stringify({ name, itineraryId, description })
    });
}

// Get all groups for the current user
export async function getUserGroups(): Promise<ShareItineraryGroup[]> {
    return api('/share-itinerary');
}

// Get a specific group by ID
export async function getShareGroup(groupId: string): Promise<ShareItineraryGroup> {
    return api(`/share-itinerary/${groupId}`);
}

// Update group details (admin only)
export async function updateShareGroup(
    groupId: string, 
    updates: { name?: string; description?: string }
): Promise<ShareItineraryGroup> {
    return api(`/share-itinerary/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

// Delete/deactivate a group (admin only)
export async function deleteShareGroup(groupId: string): Promise<{ message: string }> {
    return api(`/share-itinerary/${groupId}`, {
        method: 'DELETE'
    });
}

/* ---------- Member Management ---------- */

// Add a member to a group (admin only)
export async function addGroupMember(
    groupId: string, 
    userId: string, 
    userName: string, 
    role: 'admin' | 'member' = 'member'
): Promise<ShareItineraryGroup> {
    return api(`/share-itinerary/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, userName, role })
    });
}

// Remove a member from a group (admin only, or self)
export async function removeGroupMember(
    groupId: string, 
    userId: string
): Promise<ShareItineraryGroup> {
    return api(`/share-itinerary/${groupId}/members/${userId}`, {
        method: 'DELETE'
    });
}

/* ---------- Chat/Messaging ---------- */

// Send a message to the group chat
export async function sendGroupMessage(
    groupId: string, 
    message: string, 
    type: 'text' | 'itinerary_update' | 'system' = 'text'
): Promise<ChatMessage> {
    return api(`/share-itinerary/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, type })
    });
}

// Get messages for a group
export async function getGroupMessages(
    groupId: string, 
    limit: number = 50, 
    offset: number = 0
): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
    });
    return api(`/share-itinerary/${groupId}/messages?${params}`);
}

/* ---------- Helper Functions ---------- */

// Check if current user is admin of a group
export function isGroupAdmin(group: ShareItineraryGroup, userId: string): boolean {
    const member = group.members.find(m => m.userId === userId);
    return member?.role === 'admin' || false;
}

// Check if current user is member of a group
export function isGroupMember(group: ShareItineraryGroup, userId: string): boolean {
    return group.members.some(m => m.userId === userId);
}

// Get member info by userId
export function getGroupMember(group: ShareItineraryGroup, userId: string): GroupMember | null {
    return group.members.find(m => m.userId === userId) || null;
}