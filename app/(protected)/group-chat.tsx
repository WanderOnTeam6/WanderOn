import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Types for chat messages
export type ChatMessage = {
    _id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    type: 'text' | 'itinerary_update' | 'system';
};

// Types for itinerary group
export type ItineraryGroup = {
    _id: string;
    name: string;
    description?: string;
    members: Array<{
        userId: string;
        userName: string;
        role: 'admin' | 'member';
        joinedAt: string;
    }>;
    itineraryId: string;
    createdAt: string;
    updatedAt: string;
};

export default function GroupChatScreen() {
    const router = useRouter();
    const { groupId } = useLocalSearchParams();
    const flatListRef = useRef<FlatList>(null);
    
    // State management
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [group, setGroup] = useState<ItineraryGroup | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    // Add member functionality
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Get groupId from navigation parameters
    const actualGroupId = Array.isArray(groupId) ? groupId[0] : groupId;
    
    console.log('🔍 Group Chat Screen - Received groupId:', groupId);
    console.log('🔍 Group Chat Screen - Actual groupId:', actualGroupId);

    useEffect(() => {
        console.log('🔍 Group Chat Screen - useEffect triggered with actualGroupId:', actualGroupId);
        if (actualGroupId) {
            initializeChat();
            // Set up polling for new messages (in real app, use WebSocket)
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        } else {
            console.error('❌ No groupId provided to group chat screen');
        }
    }, [actualGroupId]);

    const initializeChat = async () => {
        console.log('🔧 initializeChat called with actualGroupId:', actualGroupId);
        if (!actualGroupId) {
            console.error('❌ No group ID provided to initializeChat');
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔧 Initializing chat for group ID:', actualGroupId);
            await getCurrentUser();
            await fetchGroupData();
            await fetchMessages();
            console.log('✅ Chat initialization completed successfully');
        } catch (error) {
            console.error('❌ Failed to initialize chat:', error);
            Alert.alert('Error', 'Failed to load chat data');
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentUser = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            // In real app, fetch user data from API
            const userData = await api(`/auth/me`) as any;
            setCurrentUser({
                id: userId || userData._id,
                name: userData.name || 'User'
            });
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
    };

    const fetchGroupData = async () => {
        if (!actualGroupId) return;
        
        try {
            console.log('Fetching group data for:', actualGroupId);
            // Fetch real group data from API
            const groupData = await api(`/share-itinerary/${actualGroupId}`) as any;
            console.log('Retrieved group data:', groupData);
            
            setGroup({
                _id: groupData._id,
                name: groupData.name,
                description: groupData.description || '',
                members: groupData.members || [],
                itineraryId: groupData.itineraryId,
                createdAt: groupData.createdAt,
                updatedAt: groupData.updatedAt
            });
        } catch (error) {
            console.error('Failed to fetch group data:', error);
            Alert.alert('Error', 'Failed to load group information');
        }
    };

    const fetchMessages = async () => {
        if (!actualGroupId) return;
        
        try {
            console.log('Fetching messages for group:', actualGroupId);
            // Fetch real messages from API
            const messagesData = await api(`/share-itinerary/${actualGroupId}/messages`) as any[];
            console.log('Retrieved messages:', messagesData);
            
            const formattedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
                _id: msg._id,
                userId: msg.userId,
                userName: msg.userName || 'Unknown User',
                message: msg.message,
                timestamp: msg.timestamp,
                type: msg.type || 'text'
            }));
            
            setMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            // Don't show alert for messages - it's not critical
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || isSending || !actualGroupId) return;

        setIsSending(true);
        try {
            const messageData = {
                message: newMessage.trim(),
                type: 'text'
            };

            console.log('Sending message to group:', actualGroupId);
            const response = await api(`/share-itinerary/${actualGroupId}/messages`, {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
            console.log('Message sent successfully:', response);

            // Clear the input immediately after successful send
            setNewMessage('');
            
            // Refresh messages to include the new one
            fetchMessages();
            
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const navigateToItinerary = () => {
        // TODO: Navigate to itinerary view/edit page
        Alert.alert('Navigate to Itinerary', 'This will open the shared itinerary');
    };

    const addMember = async () => {
        if (!memberEmail.trim() || !actualGroupId) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsAddingMember(true);
        try {
            console.log('👥 Adding member with email:', memberEmail);
            
            // First, find the user by email
            const userResponse = await api(`/users/by-email/${encodeURIComponent(memberEmail.trim())}`);
            const targetUser = userResponse as any;
            
            if (!targetUser) {
                Alert.alert('Error', 'User not found with this email address');
                return;
            }

            console.log('👥 Found user:', targetUser);

            // Add the user to the group
            const response = await api(`/share-itinerary/${actualGroupId}/members`, {
                method: 'POST',
                body: JSON.stringify({
                    userId: targetUser._id,
                    role: 'member'
                })
            });

            console.log('👥 Successfully added member:', response);
            
            // Refresh group data to show new member
            await fetchGroupData();
            await fetchMessages(); // Refresh messages to show system message
            
            // Reset form
            setMemberEmail('');
            setShowAddMember(false);
            
            Alert.alert('Success', `${targetUser.name || targetUser.email} has been added to the group!`);
            
        } catch (error: any) {
            console.error('❌ Failed to add member:', error);
            
            let errorMessage = 'Failed to add member. Please try again.';
            if (error.message.includes('User not found')) {
                errorMessage = 'No user found with this email address.';
            } else if (error.message.includes('already a member')) {
                errorMessage = 'This user is already a member of the group.';
            } else if (error.message.includes('Only admins')) {
                errorMessage = 'Only group admins can add new members.';
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setIsAddingMember(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwnMessage = item.userId === currentUser?.id;
        
        // Debug logging
        console.log('📝 Message debug:', {
            messageId: item._id,
            messageUserId: item.userId,
            currentUserId: currentUser?.id,
            isOwnMessage,
            userName: item.userName,
            message: item.message.substring(0, 30) + '...'
        });
        
        // Handle system messages (like member join/leave notifications)
        if (item.type === 'system') {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessage}>
                        <Text style={styles.systemMessageText}>{item.message}</Text>
                    </View>
                </View>
            );
        }
        
        // Handle itinerary update messages
        if (item.type === 'itinerary_update') {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.itineraryUpdateMessage}>
                        <Ionicons name="map-outline" size={14} color="#007AFF" />
                        <Text style={styles.itineraryUpdateText}>{item.message}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
            ]}>
                {/* Always show sender name for clarity, but style differently */}
                <Text style={[
                    styles.senderName,
                    isOwnMessage ? styles.ownSenderName : styles.otherSenderName
                ]}>
                    {isOwnMessage ? 'You' : item.userName}
                </Text>
                
                <View style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                    ]}>
                        {item.message}
                    </Text>
                </View>
                <Text style={[
                    styles.messageTime,
                    isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                ]}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading chat...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.push('/logged-in')}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.headerInfo}>
                    <Text style={styles.groupName}>{group?.name}</Text>
                    <Text style={styles.memberCount}>
                        {group?.members.length} members
                    </Text>
                </View>

                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => setShowAddMember(true)}
                    >
                        <Ionicons name="person-add" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={navigateToItinerary}
                    >
                        <Ionicons name="map" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Add Member Modal */}
            {showAddMember && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Member</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowAddMember(false);
                                    setMemberEmail('');
                                }}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalDescription}>
                            Enter the email address of the person you want to add to this group:
                        </Text>
                        
                        <TextInput
                            style={styles.emailInput}
                            placeholder="Enter email address"
                            placeholderTextColor="#999"
                            value={memberEmail}
                            onChangeText={setMemberEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowAddMember(false);
                                    setMemberEmail('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.addButton,
                                    (!memberEmail.trim() || isAddingMember) && styles.addButtonDisabled
                                ]}
                                onPress={addMember}
                                disabled={!memberEmail.trim() || isAddingMember}
                            >
                                <Text style={styles.addButtonText}>
                                    {isAddingMember ? 'Adding...' : 'Add Member'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor="#999"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!newMessage.trim() || isSending) && styles.sendButtonDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                    >
                        <Ionicons 
                            name="send" 
                            size={20} 
                            color={(!newMessage.trim() || isSending) ? "#999" : "#fff"} 
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e5e9',
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    memberCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    itineraryButton: {
        padding: 8,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    messageContainer: {
        marginVertical: 2,
        maxWidth: width * 0.75,
        marginHorizontal: 16,
    },
    ownMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    ownSenderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginRight: 4,
        fontWeight: '500',
        textAlign: 'right',
    },
    otherSenderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    messageBubble: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: '100%',
    },
    ownMessageBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#f1f1f1',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#000',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 2,
    },
    ownMessageTime: {
        color: '#666',
        textAlign: 'right',
        marginRight: 4,
    },
    otherMessageTime: {
        color: '#999',
        marginLeft: 4,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemMessage: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        maxWidth: '70%',
    },
    systemMessageText: {
        fontSize: 12,
        color: '#8e8e93',
        textAlign: 'center',
        fontWeight: '400',
    },
    itineraryUpdateMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1ecf1',
        maxWidth: '80%',
    },
    itineraryUpdateText: {
        fontSize: 13,
        color: '#007AFF',
        marginLeft: 6,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e1e5e9',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e1e5e9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#e1e5e9',
    },
    // Modal styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 12,
        padding: 20,
        width: width - 40,
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
        lineHeight: 22,
    },
    emailInput: {
        borderWidth: 1,
        borderColor: '#e1e5e9',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e1e5e9',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    addButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#e1e5e9',
    },
    addButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});