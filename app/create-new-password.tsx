import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function CreateNewPasswordScreen() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleCreatePassword() {
        if (!password) {
            Alert.alert('Missing password', 'Please enter a new password.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Password too short', 'Password should be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Alert.alert(
                'Password Updated', 
                'Your password has been successfully updated.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/login')
                    }
                ]
            );
        } catch (e: any) {
            Alert.alert('Error', 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/Logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Create new password</Text>
                    <Text style={styles.subtitle}>
                        Keep your account secure by creating a strong password
                    </Text>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Your password should be at least contain some characters</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Create Password Button */}
                <TouchableOpacity
                    style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                    onPress={handleCreatePassword}
                    disabled={isLoading}
                >
                    <Text style={styles.createButtonText}>
                        {isLoading ? 'Creating...' : 'Create new password'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    backButton: {
        marginBottom: 30,
        alignSelf: 'flex-start',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#B0C4DE',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});