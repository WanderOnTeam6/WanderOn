import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
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

const { width } = Dimensions.get('window');

import { BASE, setToken } from '@/lib/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter();

    async function handleLogin() {
        // Clear previous errors
        setEmailError('');
        setPasswordError('');

        // Input validation with better messages
        let hasErrors = false;

        if (!email) {
            setEmailError('Email is required');
            hasErrors = true;
        } else {
            // Basic email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setEmailError('Please enter a valid email address');
                hasErrors = true;
            }
        }

        if (!password) {
            setPasswordError('Password is required');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Handle specific HTTP status codes
                switch (res.status) {
                    case 401:
                        throw new Error('Invalid email or password. Please check your credentials and try again.');
                    case 404:
                        throw new Error('Account not found. Please check your email or create a new account.');
                    case 429:
                        throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
                    case 500:
                        throw new Error('Server error. Please try again later.');
                    default:
                        throw new Error(data?.error || data?.message || 'Unable to sign in. Please try again.');
                }
            }

            setToken(data.token);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth:changed'));
            }

            // Direct navigation after successful login
            router.replace('/logged-in');
        } catch (e: any) {
            // Network or other errors
            if (e.message.includes('fetch')) {
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to the server. Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Sign In Failed',
                    e.message || 'An unexpected error occurred. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setIsLoading(false);
        }
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
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('@/assets/images/Logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Welcome Text */}
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>Welcome to WanderOn</Text>
                            <Text style={styles.welcomeSubtitle}>Please choose your login option below</Text>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={[styles.input, emailError ? styles.inputError : null]}
                                placeholder="Enter your email address"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (emailError) setEmailError(''); // Clear error on typing
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (passwordError) setPasswordError(''); // Clear error on typing
                                    }}
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
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => router.push('/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <View style={styles.loginButtonContent}>
                                {isLoading && (
                                    <View style={styles.loadingIndicator}>
                                        <Text style={styles.loadingDot}>●</Text>
                                        <Text style={styles.loadingDot}>●</Text>
                                        <Text style={styles.loadingDot}>●</Text>
                                    </View>
                                )}
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Signing you in...' : 'Sign In'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or login with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Gmail</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color="#000" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have account on already? </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/signup')}
                                activeOpacity={0.7}
                                style={styles.signupLinkContainer}
                                delayPressIn={0}
                                delayPressOut={0}
                                delayLongPress={500}
                            >
                                <Text style={styles.signupLink}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    logo: {
        width: 120,
        height: 120,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
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
    inputError: {
        borderColor: '#ff4444',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        minHeight: 50,
        justifyContent: 'center',
    },
    loginButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingIndicator: {
        flexDirection: 'row',
        marginRight: 8,
    },
    loadingDot: {
        color: '#fff',
        fontSize: 8,
        marginHorizontal: 1,
        opacity: 0.7,
    },
    loginButtonDisabled: {
        backgroundColor: '#B0C4DE',
        opacity: 0.8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        color: '#666',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        marginHorizontal: 4,
    },
    socialButtonText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
        backgroundColor: 'transparent',
    },
    signupLinkContainer: {
        padding: 8,
        borderRadius: 4,
    },
    signupText: {
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    signupLink: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'none',
        lineHeight: 20,
        textAlign: 'center',
        includeFontPadding: false,
    },
});