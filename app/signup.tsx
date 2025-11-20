// app/signup.tsx
import { BASE, setToken } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const countryCodes = [
    { code: '+1', country: 'United States' },
    { code: '+91', country: 'India' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
    { code: '+61', country: 'Australia' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+7', country: 'Russia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+82', country: 'South Korea' },
    { code: '+34', country: 'Spain' },
    { code: '+39', country: 'Italy' },
    { code: '+27', country: 'South Africa' },
    { code: '+66', country: 'Thailand' },
    { code: '+65', country: 'Singapore' },
    { code: '+60', country: 'Malaysia' },
    { code: '+63', country: 'Philippines' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+98', country: 'Iran' },
    { code: '+964', country: 'Iraq' },
    { code: '+971', country: 'United Arab Emirates' },
    { code: '+92', country: 'Pakistan' },
    { code: '+54', country: 'Argentina' },
    { code: '+56', country: 'Chile' },
    { code: '+57', country: 'Colombia' },
    { code: '+58', country: 'Venezuela' },
    { code: '+20', country: 'Egypt' },
    { code: '+212', country: 'Morocco' },
    { code: '+216', country: 'Tunisia' },
    { code: '+234', country: 'Nigeria' },
    { code: '+233', country: 'Ghana' },
    { code: '+254', country: 'Kenya' },
    { code: '+256', country: 'Uganda' },
    { code: '+258', country: 'Mozambique' },
    { code: '+64', country: 'New Zealand' },
    { code: '+48', country: 'Poland' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+43', country: 'Austria' },
    { code: '+41', country: 'Switzerland' },
    { code: '+351', country: 'Portugal' },
    { code: '+90', country: 'Turkey' },
    { code: '+30', country: 'Greece' },
];

export default function SignupScreen() {
    // Fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Error states
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
    const [isCountryCodeModalVisible, setIsCountryCodeModalVisible] = useState(false);

    const router = useRouter();

    function handleGoBack() {
        router.replace('/login');
    }

    async function handleSignup() {
        // Reset errors
        setFirstNameError('');
        setLastNameError('');
        setEmailError('');
        setPasswordError('');
        setPhoneError('');

        if (!firstName.trim()) {
            setFirstNameError('First name is required');
            return;
        }

        if (!lastName.trim()) {
            setLastNameError('Last name is required');
            return;
        }

        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }

        if (!password.trim()) {
            setPasswordError('Password is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (phone.trim()) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone.trim())) {
                setPhoneError('Please enter a valid phone number');
                return;
            }
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
                    phone: phone.trim() ? `${selectedCountryCode}${phone.trim()}` : '',
                    age: age.trim() ? age.trim() : '',
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.message || data?.error || 'Sign up failed');
            }

            setToken(data.token);
            router.replace('/signup-success');
        } catch (err: any) {
            Alert.alert('Sign up failed', err.message || 'Please try again');
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
                    {/* Center wrapper */}
                    <View style={styles.content}>
                        {/* Card */}
                        <View style={styles.card}>
                            {/* Back Button */}
                            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
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
                                    Get the best out of WanderOn by creating an account
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.formContainer}>
                                {/* First Name */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        First name <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[styles.input, firstNameError ? styles.inputError : null]}
                                        placeholder="John"
                                        placeholderTextColor="#D3D3D3"
                                        value={firstName}
                                        onChangeText={(text) => {
                                            setFirstName(text);
                                            if (firstNameError) setFirstNameError('');
                                        }}
                                    />
                                    {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
                                </View>

                                {/* Last Name */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Last name <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[styles.input, lastNameError ? styles.inputError : null]}
                                        placeholder="Doe"
                                        placeholderTextColor="#D3D3D3"
                                        value={lastName}
                                        onChangeText={(text) => {
                                            setLastName(text);
                                            if (lastNameError) setLastNameError('');
                                        }}
                                    />
                                    {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
                                </View>

                                {/* Age (optional) */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 25"
                                        placeholderTextColor="#D3D3D3"
                                        keyboardType="numeric"
                                        value={age}
                                        onChangeText={setAge}
                                    />
                                </View>

                                {/* Phone */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Phone</Text>
                                    <View style={styles.phoneContainer}>
                                        <TouchableOpacity
                                            style={styles.countryCode}
                                            onPress={() => setIsCountryCodeModalVisible(true)}
                                        >
                                            <Text style={styles.countryCodeText}>{selectedCountryCode}</Text>
                                            <Ionicons name="chevron-down" size={16} color="#666" />
                                        </TouchableOpacity>

                                        <TextInput
                                            style={[styles.phoneInput, phoneError ? styles.inputError : null]}
                                            placeholder="1234567890"
                                            placeholderTextColor="#D3D3D3"
                                            value={phone}
                                            onChangeText={(text) => {
                                                setPhone(text);
                                                if (phoneError) setPhoneError('');
                                            }}
                                            onBlur={() => {
                                                if (!phone.trim()) return;
                                                const phoneRegex = /^[0-9]{10}$/;
                                                if (!phoneRegex.test(phone.trim())) {
                                                    setPhoneError('Please enter a valid phone number');
                                                }
                                            }}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                                </View>

                                {/* Country Code Modal */}
                                <Modal
                                    visible={isCountryCodeModalVisible}
                                    transparent
                                    animationType="slide"
                                >
                                    <View style={styles.modalContainer}>
                                        <FlatList
                                            data={countryCodes}
                                            keyExtractor={(item) => item.code}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.modalItem}
                                                    onPress={() => {
                                                        setSelectedCountryCode(item.code);
                                                        setIsCountryCodeModalVisible(false);
                                                    }}
                                                >
                                                    <Text style={styles.modalText}>
                                                        {item.country} ({item.code})
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                </Modal>

                                {/* Email */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Email <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[styles.input, emailError ? styles.inputError : null]}
                                        placeholder="johnuser@gmail.com"
                                        placeholderTextColor="#D3D3D3"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) setEmailError('');
                                        }}
                                        onBlur={() => {
                                            if (!email.trim()) return;
                                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            if (!emailRegex.test(email.trim())) {
                                                setEmailError('Please enter a valid email address');
                                            }
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                                </View>

                                {/* Password */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Password <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                                            placeholder="••••••••"
                                            placeholderTextColor="#D3D3D3"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={(text) => {
                                                setPassword(text);
                                                if (passwordError) setPasswordError('');
                                            }}
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

                                {/* Terms */}
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

                                {/* Button */}
                                <TouchableOpacity
                                    style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                                    onPress={handleSignup}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Login */}
                                <View style={styles.loginContainer}>
                                    <Text style={styles.loginText}>Already have an account? </Text>
                                    <TouchableOpacity onPress={handleGoBack}>
                                        <Text style={styles.loginLink}>Go back</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
        justifyContent: 'center',
        paddingVertical: 24,
    },

    // Center wrapper
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // Card similar to login
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },

    backButton: { marginBottom: 12, alignSelf: 'flex-start' },

    logoContainer: { alignItems: 'center', marginBottom: 20 },
    logo: { width: 80, height: 80 },

    headerContainer: { alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },

    formContainer: { flex: 1 },

    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
    required: { color: '#ff4444' },

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
    countryCodeText: { fontSize: 16, color: '#333', marginRight: 8 },

    phoneInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    eyeIcon: { paddingHorizontal: 16 },

    termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    checkbox: { marginRight: 12 },
    termsText: { fontSize: 14, color: '#666' },
    termsLink: { color: '#007AFF', textDecorationLine: 'underline' },

    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    createButtonDisabled: { backgroundColor: '#B0C4DE' },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    loginContainer: { flexDirection: 'row', justifyContent: 'center' },
    loginText: { color: '#666', fontSize: 14 },
    loginLink: { color: '#007AFF', fontWeight: '600' },

    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalItem: {
        backgroundColor: '#fff',
        padding: 16,
        marginVertical: 4,
        borderRadius: 8,
        width: '80%',
    },
    modalText: { fontSize: 16, color: '#333' },
});
