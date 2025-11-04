import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateGroupScreen() {
    const router = useRouter();
    
    // State management
    const [destination, setDestination] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const validateInputs = () => {
        console.log('🔍 Validating inputs...');
        console.log('Destination:', `"${destination}"`);
        console.log('Destination trimmed:', `"${destination.trim()}"`);
        console.log('Destination trim length:', destination.trim().length);
        
        if (!destination.trim()) {
            console.log('❌ Validation failed: empty destination');
            Alert.alert('Error', 'Please enter a destination');
            return false;
        }
        if (destination.trim().length < 2) {
            console.log('❌ Validation failed: destination too short');
            Alert.alert('Error', 'Destination must be at least 2 characters long');
            return false;
        }
        console.log('✅ Validation passed');
        return true;
    };

    const createGroup = async () => {
        console.log('🔥 CREATE GROUP BUTTON PRESSED!');
        console.log('Destination value:', destination);
        console.log('Destination length:', destination.length);
        console.log('isCreating current value:', isCreating);
        
        // Check validation step by step
        console.log('Running validation...');
        const validationResult = validateInputs();
        console.log('Validation result:', validationResult);
        
        if (!validationResult) {
            console.log('❌ Validation failed');
            return;
        }
        
        if (isCreating) {
            console.log('❌ Already creating, returning early');
            return;
        }

        console.log('✅ Validation passed, about to set isCreating to true...');
        
        setIsCreating(true);
        console.log('✅ isCreating should now be true, starting API calls...');
        try {
            // Step 1: Create a basic itinerary for this destination
            console.log('Creating itinerary for destination:', destination);
            const itineraryData = {
                items: [] // Start with empty items, user can add later
            };

            const itineraryResponse = await api('/itinerary', {
                method: 'POST',
                body: JSON.stringify(itineraryData)
            }) as any;

            console.log('Created itinerary response:', itineraryResponse);

            // Step 2: Create the shared group document in share-iti collection
            console.log('Creating shared group document in share-iti...');
            const groupData = {
                name: destination.trim(),
                description: groupDescription.trim() || `Collaborative planning for ${destination}`,
                itineraryId: itineraryResponse.itineraryId,
                // Initialize with proper data structure
                members: [], // Will be auto-populated by the API with creator as admin
                messages: [], // Start with empty message array
                isActive: true,
                // The API will automatically add:
                // - createdBy: current user ID
                // - timestamps: createdAt, updatedAt
                // - creator as admin member
            };

            console.log('Sending group data to share-itinerary API:', groupData);

            const shareGroup = await api('/share-itinerary', {
                method: 'POST',
                body: JSON.stringify(groupData)
            }) as any;

            console.log('✅ Successfully created share group in database:', shareGroup);
            console.log('Group ID:', shareGroup._id);
            console.log('Group members:', shareGroup.members);
            console.log('Group itinerary ID:', shareGroup.itineraryId);

            console.log('🚀 Attempting immediate navigation to group chat...');
            
            try {
                // Navigate immediately without alert
                router.push({
                    pathname: '/group-chat',
                    params: { groupId: shareGroup._id }
                } as any);
                console.log('🚀 Immediate navigation executed successfully');
            } catch (error) {
                console.error('❌ Immediate navigation failed:', error);
                
                // Show alert as fallback if navigation fails
                Alert.alert(
                    'Success!',
                    `Group "${destination}" has been created and stored in the database!\n\nNavigation to group chat failed. Please try manually.`,
                    [
                        {
                            text: 'Try Group Chat Again',
                            onPress: () => {
                                console.log('🚀 Manual retry - Navigating to group chat with ID:', shareGroup._id);
                                
                                try {
                                    router.navigate(`/group-chat?groupId=${shareGroup._id}` as any);
                                    console.log('🚀 Manual retry navigation executed');
                                } catch (retryError) {
                                    console.error('❌ Manual retry also failed:', retryError);
                                }
                            }
                        },
                        {
                            text: 'Go Back',
                            style: 'cancel',
                            onPress: () => {
                                router.back();
                            }
                        }
                    ]
                );
            }

        } catch (error: any) {
            console.error('Failed to create group:', error);
            
            let errorMessage = 'Failed to create group. Please try again.';
            if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            console.log('Setting isCreating to false');
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Create Group</Text>
                    
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Group Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.groupIcon}>
                            <Ionicons name="people" size={40} color="#007AFF" />
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Destination */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Destination *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter destination (e.g., Tokyo, Paris, New York)"
                                placeholderTextColor="#999"
                                value={destination}
                                onChangeText={setDestination}
                                maxLength={50}
                                autoCapitalize="words"
                            />
                            <Text style={styles.characterCount}>
                                {destination.length}/50
                            </Text>
                        </View>

                        {/* Group Description */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe your travel plans and what you want to do at this destination..."
                                placeholderTextColor="#999"
                                value={groupDescription}
                                onChangeText={setGroupDescription}
                                maxLength={200}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <Text style={styles.characterCount}>
                                {groupDescription.length}/200
                            </Text>
                        </View>

                        {/* Info Card */}
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={20} color="#007AFF" />
                            <Text style={styles.infoText}>
                                After creating the group, you'll be able to invite members and share your itinerary for collaborative planning.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Create Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            (!destination.trim() || isCreating) && styles.createButtonDisabled
                        ]}
                        onPress={createGroup}
                        disabled={!destination.trim() || isCreating}
                    >
                        {isCreating ? (
                            <Text style={styles.createButtonText}>Creating...</Text>
                        ) : (
                            <>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createButtonText}>Create Group</Text>
                            </>
                        )}
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
    keyboardView: {
        flex: 1,
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
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    iconContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    groupIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    form: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    inputSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    characterCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#f0f8ff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1ecf1',
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 12,
        lineHeight: 20,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e1e5e9',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#e1e5e9',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
});