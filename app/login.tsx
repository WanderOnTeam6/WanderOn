import { BASE, clearToken, setToken } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter();

    // 👇 Core login logic
    async function handleLogin() {
        setEmailError('');
        setPasswordError('');

        let hasErrors = false;
        if (!email) {
            setEmailError('Email is required');
            hasErrors = true;
        } else {
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

        if (hasErrors) return;

        setIsLoading(true);

        try {
            // Step 1: Login
            const res = await fetch(`${BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.error || 'Invalid credentials');
            }

            // Step 2: Save JWT
            await setToken(data.token);

            // Step 3: Fetch user data to get _id
            const meRes = await fetch(`${BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${data.token}` },
            });
            const me = await meRes.json();

            if (me && me._id) {
                await AsyncStorage.setItem('userId', me._id);
                console.log('✅ Logged in user ID:', me._id);
            }

            // Step 4: Navigate to logged-in screen
            router.replace('/logged-in');
        } catch (e: any) {
            Alert.alert('Sign In Failed', e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    // 👇 Optional logout function for future use
    async function handleLogout() {
        await clearToken();
        await AsyncStorage.removeItem('userId');
        router.replace('/onboarding');
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        {/* Centered card */}
                        <View style={styles.card}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('@/assets/images/Logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeTitle}>Welcome to WanderOn</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    Please choose your login option below
                                </Text>
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
                                        if (emailError) setEmailError('');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
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
                                            if (passwordError) setPasswordError('');
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
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

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Signing you in...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>

                            {/* Create Account Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, { backgroundColor: '#34C759' }]}
                                onPress={() => router.replace('/signup')}
                            >
                                <Text style={styles.loginButtonText}>Create Account</Text>
                            </TouchableOpacity>

                            {/* Logout test button (kept commented)
                            <TouchableOpacity
                                style={[styles.loginButton, { backgroundColor: '#ff3b30' }]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.loginButtonText}>Log Out (Test)</Text>
                            </TouchableOpacity>
                            */}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    keyboardAvoidingView: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 50,
        paddingBottom: 40,
        justifyContent: 'center', // center vertically
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    // Centered card with max width
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    logoContainer: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 120, height: 120 },
    welcomeContainer: { alignItems: 'center', marginBottom: 32 },
    welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    welcomeSubtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
    inputContainer: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    inputError: { borderColor: '#ff4444', borderWidth: 1.5 },
    errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    eyeIcon: { paddingHorizontal: 16 },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    loginButtonDisabled: { backgroundColor: '#B0C4DE', opacity: 0.8 },
});
