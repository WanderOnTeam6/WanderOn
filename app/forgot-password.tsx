import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
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

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleRequestCode() {
        if (!email) {
            Alert.alert('Missing email', 'Please enter your email address.');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Alert.alert(
                'Code Sent', 
                'We have sent a verification code to your email address.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate to reset password screen
                            Alert.alert('Coming Soon', 'Password reset feature will be available soon');
                        }
                    }
                ]
            );
        } catch (e: any) {
            Alert.alert('Error', 'Failed to send verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    function handleResetWithPhone() {
        Alert.alert('Coming Soon', 'Phone reset feature will be available soon');
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
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
                    <Text style={styles.title}>Forget password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email or phone we will send the verification code to reset your password
                    </Text>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="johnuser@gmail.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Reset with phone number */}
                <TouchableOpacity
                    style={styles.phoneResetContainer}
                    onPress={handleResetWithPhone}
                >
                    <Text style={styles.phoneResetText}>Reset with phone number</Text>
                </TouchableOpacity>

                {/* Request Code Button */}
                <TouchableOpacity
                    style={[styles.requestButton, isLoading && styles.requestButtonDisabled]}
                    onPress={handleRequestCode}
                    disabled={isLoading}
                >
                    <Text style={styles.requestButtonText}>
                        {isLoading ? 'Sending...' : 'Request code'}
                    </Text>
                </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    phoneResetContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    phoneResetText: {
        color: '#007AFF',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    requestButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    requestButtonDisabled: {
        backgroundColor: '#B0C4DE',
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});