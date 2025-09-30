import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BASE, setToken } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';

export default function AuthScreen() {
    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup state
    const [first, setFirst] = useState('');
    const [last, setLast] = useState('');
    const [email2, setEmail2] = useState('');
    const [password2, setPassword2] = useState('');

    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const tint = isDark ? '#FFF' : '#000';
    const hint = isDark ? '#BBB' : '#666';
    const border = isDark ? '#AAA' : '#444';

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Missing fields', 'Please enter email and password.');
            return;
        }
        try {
            const res = await fetch(`${BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) throw new Error(data?.error || 'Login failed');

            setToken(data.token);
            window.dispatchEvent(new Event('auth:changed'));
            router.replace('/logged-in');
        } catch (e: any) {
            Alert.alert('Login failed', e.message || 'Invalid credentials');
        }
    }

    async function handleSignup() {
        if (!first || !last || !email2 || !password2) {
            Alert.alert('Missing fields', 'Please fill in all fields.');
            return;
        }
        try {
            const res = await fetch(`${BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: first.trim(),
                    lastName: last.trim(),
                    email: email2.trim(),
                    password: password2,
                }),
            });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) throw new Error(data?.error || 'Sign up failed');

            setToken(data.token);
            window.dispatchEvent(new Event('auth:changed'));
            Alert.alert('Welcome!', `Account created for ${data?.user?.email}`);
            router.replace('/logged-in');
        } catch (e: any) {
            Alert.alert('Sign up error', e.message || 'Please try again');
        }
    }

    return (
        <ThemedView style={styles.page}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* LOGIN */}
                <ThemedText type="title" style={styles.heading}>
                    Sign in
                </ThemedText>

                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="Email"
                    placeholderTextColor={hint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="Password"
                    placeholderTextColor={hint}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <View style={styles.actions}>
                    <Button title="Sign In" onPress={handleLogin} />
                </View>

                {/* DIVIDER */}
                <View style={styles.divider}>
                    <View style={styles.rule} />
                    <ThemedText style={{ opacity: 0.7, marginHorizontal: 8 }}>New to WanderOn? Register below</ThemedText>
                    <View style={styles.rule} />
                </View>

                {/* SIGN UP */}
                <ThemedText type="title" style={styles.heading}>
                    Create account
                </ThemedText>

                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="First name"
                    placeholderTextColor={hint}
                    value={first}
                    onChangeText={setFirst}
                />
                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="Last name"
                    placeholderTextColor={hint}
                    value={last}
                    onChangeText={setLast}
                />
                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="Username"
                    placeholderTextColor={hint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email2}
                    onChangeText={setEmail2}
                />
                <TextInput
                    style={[styles.input, { color: tint, borderColor: border }]}
                    placeholder="Password"
                    placeholderTextColor={hint}
                    secureTextEntry
                    value={password2}
                    onChangeText={setPassword2}
                />
                <View style={styles.actions}>
                    <Button title="Sign Up" onPress={handleSignup} />
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1 },
    container: {
        gap: 12,
        padding: 16,
        paddingBottom: 48,
    },
    heading: { textAlign: 'center', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    actions: { marginTop: 8, marginBottom: 16 },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    rule: { flex: 1, height: 1, opacity: 0.2, backgroundColor: '#888' },
});
