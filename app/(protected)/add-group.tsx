import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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

export default function ItineraryChatScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    
    // State management
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [group, setGroup] = useState<ItineraryGroup | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Sample group ID - in real app, this would come from navigation params
    const groupId = 'sample-group-id';

    useEffect(() => {
        initializeChat();
        // Set up polling for new messages (in real app, use WebSocket)
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const initializeChat = async () => {
        try {
            await getCurrentUser();
            await fetchGroupData();
            await fetchMessages();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
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
        try {
            // TODO: Replace with actual API call
            const mockGroup: ItineraryGroup = {
                _id: groupId,
                name: 'Tokyo Adventure Trip',
                description: 'Planning our amazing Tokyo trip for December!',
                members: [
                    { userId: 'user1', userName: 'Alice', role: 'admin', joinedAt: '2024-11-01' },
                    { userId: 'user2', userName: 'Bob', role: 'member', joinedAt: '2024-11-01' },
                    { userId: 'user3', userName: 'Charlie', role: 'member', joinedAt: '2024-11-02' },
                ],
                itineraryId: 'tokyo-trip-2024',
                createdAt: '2024-11-01',
                updatedAt: '2024-11-03'
            };
            setGroup(mockGroup);
        } catch (error) {
            console.error('Failed to fetch group data:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            // TODO: Replace with actual API call
            const mockMessages: ChatMessage[] = [
                {
                    _id: '1',
                    userId: 'user1',
                    userName: 'Alice',
                    message: 'Hey everyone! I\'ve added some cool temples to our itinerary 🏛️',
                    timestamp: '2024-11-03T10:00:00Z',
                    type: 'text'
                },
                {
                    _id: '2',
                    userId: 'user2',
                    userName: 'Bob',
                    message: 'Alice updated the itinerary: Added Senso-ji Temple',
                    timestamp: '2024-11-03T10:01:00Z',
                    type: 'itinerary_update'
                },
                {
                    _id: '3',
                    userId: 'user3',
                    userName: 'Charlie',
                    message: 'Perfect! Should we also add some ramen places nearby?',
                    timestamp: '2024-11-03T10:05:00Z',
                    type: 'text'
                }
            ];
            setMessages(mockMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || isSending) return;

        setIsSending(true);
        try {
            const messageData = {
                groupId,
                message: newMessage.trim(),
                type: 'text'
            };

            // TODO: Replace with actual API call
            // await api('/chat/messages', {
            //     method: 'POST',
            //     body: JSON.stringify(messageData)
            // });

            // Optimistically add message to UI
            const optimisticMessage: ChatMessage = {
                _id: Date.now().toString(),
                userId: currentUser.id,
                userName: currentUser.name,
                message: newMessage.trim(),
                timestamp: new Date().toISOString(),
                type: 'text'
            };

            setMessages(prev => [...prev, optimisticMessage]);
            setNewMessage('');
            
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const navigateToItinerary = () => {
        // TODO: Navigate to itinerary view/edit page
        Alert.alert('Navigate to Itinerary', 'This will open the shared itinerary');
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
        
        if (item.type === 'itinerary_update') {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessage}>
                        <Ionicons name="map-outline" size={16} color="#007AFF" />
                        <Text style={styles.systemMessageText}>{item.message}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
            ]}>
                {!isOwnMessage && (
                    <Text style={styles.senderName}>{item.userName}</Text>
                )}
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
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.headerInfo}>
                    <Text style={styles.groupName}>{group?.name}</Text>
                    <Text style={styles.memberCount}>
                        {group?.members.length} members
                    </Text>
                </View>

                <TouchableOpacity 
                    style={styles.itineraryButton}
                    onPress={navigateToItinerary}
                >
                    <Ionicons name="map" size={24} color="#007AFF" />
                </TouchableOpacity>
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
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: width * 0.75,
    },
    ownMessageContainer: {
        alignSelf: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        marginLeft: 12,
    },
    messageBubble: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    ownMessageBubble: {
        backgroundColor: '#007AFF',
    },
    otherMessageBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e1e5e9',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#333',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    ownMessageTime: {
        color: '#666',
        textAlign: 'right',
    },
    otherMessageTime: {
        color: '#999',
        marginLeft: 12,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1ecf1',
    },
    systemMessageText: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 6,
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
});