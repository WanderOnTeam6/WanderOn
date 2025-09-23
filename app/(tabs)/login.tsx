import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api, setToken } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    async function onSubmit() {
        try {
            const res = await api<{ token: string; user: any }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setToken(res.token);
            Alert.alert('Login successful', `Welcome ${res.user?.name || res.user?.email}`);
            router.replace('../logged-in');
        } catch (e: any) {
            Alert.alert('Login failed', e.message || 'Invalid credentials');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Sign in</ThemedText>

            <TextInput
                style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#AAA' : '#444' }]}
                placeholder="Username"
                placeholderTextColor={isDark ? '#BBB' : '#666'}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#AAA' : '#444' }]}
                placeholder="Password"
                placeholderTextColor={isDark ? '#BBB' : '#666'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <View style={styles.actions}>
                <Button title="Sign In" onPress={onSubmit} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
        padding: 16,
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    actions: {
        marginTop: 8,
    },
});
