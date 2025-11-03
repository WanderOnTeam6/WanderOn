import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SignupSuccessScreen() {
    const router = useRouter();

    function handleExplore() {
        router.replace('/logged-in');
    }

    return (
        <LinearGradient
            colors={['#007AFF', '#0056CC']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Success Message */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.title}>Successfully{'\n'}created an account</Text>
                        <Text style={styles.subtitle}>
                            Now you can start wandering. Let's{'\n'}enjoy it
                        </Text>
                    </View>

                    {/* Explore Button */}
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={handleExplore}
                    >
                        <Text style={styles.exploreButtonText}>Let's Explore</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 36,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        opacity: 0.9,
        lineHeight: 22,
    },
    exploreButton: {
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 16,
        paddingHorizontal: 40,
        minWidth: 200,
        alignItems: 'center',
        marginBottom: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    exploreButtonText: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: '600',
    },
});