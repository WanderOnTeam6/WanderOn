import { BASE, setToken } from '@/lib/api';
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

export default function SignupScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    function handleGoBack() {
        router.replace('/login');
    }

    async function handleSignup() {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert('Missing fields', 'Please fill in all required fields.');
            return;
        }

        if (!acceptTerms) {
            Alert.alert('Terms & Conditions', 'Please accept the terms and conditions to continue.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    password: password,
                    phone: phone.trim(),
                }),
            });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) throw new Error(data?.error || 'Sign up failed');

            setToken(data.token);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth:changed'));
            }

            // Navigate to success screen or main app
            router.replace('/signup-success');
        } catch (e: any) {
            Alert.alert('Sign up failed', e.message || 'Please try again');
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
                            <Text style={styles.title}>Create account</Text>
                            <Text style={styles.subtitle}>
                                Get the best out of wanderon by creating an account
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* First Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>First name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John"
                                    placeholderTextColor="#999"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Last Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Last name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    placeholderTextColor="#999"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Phone Number */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <View style={styles.phoneContainer}>
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+1</Text>
                                        <Ionicons name="chevron-down" size={16} color="#666" />
                                    </View>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="123 456 789"
                                        placeholderTextColor="#999"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* Age */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="30"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email</Text>
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

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
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

                            {/* Terms & Conditions */}
                            <View style={styles.termsContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setAcceptTerms(!acceptTerms)}
                                >
                                    <Ionicons
                                        name={acceptTerms ? 'checkbox' : 'square-outline'}
                                        size={20}
                                        color={acceptTerms ? '#007AFF' : '#666'}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.termsText}>
                                    I accept{' '}
                                    <Text style={styles.termsLink}>terms and condition</Text>
                                </Text>
                            </View>

                            {/* Create Account Button */}
                            <TouchableOpacity
                                style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                                onPress={handleSignup}
                                disabled={isLoading}
                            >
                                <Text style={styles.createButtonText}>
                                    {isLoading ? 'Creating Account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            {/* Already have account */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={handleGoBack}>
                                    <Text style={styles.loginLink}>Go back</Text>
                                </TouchableOpacity>
                            </View>
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
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    backButton: {
        marginTop: 20,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
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
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
    },
    countryCodeText: {
        fontSize: 16,
        color: '#333',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    checkbox: {
        marginRight: 12,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    termsLink: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    createButtonDisabled: {
        backgroundColor: '#B0C4DE',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
});