// app/logged-in.tsx
import { clearToken } from '@/lib/api'; // <-- ensure this exists like in maps
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Fallback components if Themed* not available
const ThemedText = ({ children, style, type, ...props }: any) => (
    <Text style={style} {...props}>{children}</Text>
);
const ThemedView = ({ children, style, ...props }: any) => (
    <View style={style} {...props}>{children}</View>
);

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const SPACING = 20;
const CARD_WITH_SPACING = CARD_WIDTH + SPACING;
const slideHeight = 280;

const featuresData = [
    {
        heading: 'Shared Itinerary Planners',
        userStory: 'As a group traveler, I would like to add itinerary so that everybody in the group knows the plan.',
        useCase: 'Add flight, rentals, activities, so all members can view/edit and sync instantly.',
    },
    {
        heading: 'AI Route Planning',
        userStory: 'As a traveler, I want the app to suggest the best route so I can save time and visit more places without stress.',
        useCase: 'Enter destinations in my trip, and the app automatically creates the most efficient path for me (and my group) to follow.',
    },
    {
        heading: 'Booking Integrated',
        userStory: 'As a user, I would like to add booking confirmation and it automatically adds to schedule, so everybody gets updated.',
        useCase: 'Forward confirmation → app parses details → booking added to itinerary with reminders.',
    },
    {
        heading: 'Expense Tracking and Splitting',
        userStory: 'As a group traveler, I would like to keep track of our expenses and quickly split them among the group at the end.',
        useCase: 'Everybody in the group can add transactions that are shared, and the app generates all the split calculations.',
    },
];

const ProgressDots = ({ currentIndex, total }: { currentIndex: number; total: number }) => (
    <View style={styles.dotsContainer}>
        {Array.from({ length: total }, (_, i) => (
            <ThemedView
                key={i}
                style={[
                    styles.dot,
                    i === currentIndex && styles.activeDot,
                ]}
            />
        ))}
    </View>
);

export default function LoggedInScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Viewability for slideshow
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            console.log(`Slide changed to index: ${newIndex}`);
            setCurrentIndex(newIndex);
        }
    }, []);

    // Auto-advance slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % featuresData.length;
            console.log(`Auto-advancing to index: ${nextIndex}`);
            setCurrentIndex(nextIndex);
            flatListRef.current?.scrollToOffset({
                offset: nextIndex * CARD_WITH_SPACING,
                animated: true,
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    // Load & log userId
    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem('userId');
            setUserId(id);
            console.log('[DEBUG] Logged-in screen, user ID:', id);
        })();
    }, []);

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: CARD_WITH_SPACING,
            offset: CARD_WITH_SPACING * index,
            index,
        }),
        []
    );

    const renderFeatureSlide = ({ item }: { item: any; index: number }) => (
        <ThemedView style={styles.slideCard}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => {
                    console.log(`Tapped: ${item.heading}`);
                    Alert.alert('Feature Tapped', `${item.heading} - Coming soon!`);
                }}
                activeOpacity={0.8}
            >
                <ThemedText style={styles.heading}>{item.heading}</ThemedText>
                <ThemedText style={styles.userStory}>{item.userStory}</ThemedText>
                <ThemedText style={styles.useCase}>{item.useCase}</ThemedText>
                <View style={styles.iconContainer}>
                    <Ionicons name="arrow-forward" size={24} color="#007AFF" />
                </View>
            </TouchableOpacity>
        </ThemedView>
    );

    const handleQuickAction = (action: string) => {
        console.log(`Quick Action: ${action}`);
        Alert.alert('Quick Action', `${action} - Coming soon!`);
    };

    function handleCreateNewTrip() {
        router.replace('/maps');
    }

    async function onLogout() {
        console.log('[DEBUG] Logging out user:', userId);
        try {
            await clearToken();
            await AsyncStorage.removeItem('userId');
        } finally {
            router.replace('/onboarding');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <ImageBackground
                source={require('../../assets/images/Background.jpg')}
                style={styles.background}
                resizeMode="cover"
                defaultSource={{ uri: 'https://via.placeholder.com/1920x1080/007AFF/FFFFFF?text=Background' }}
            >
                {/* Top overlay header with avatar (absolute, non-blocking) */}
                <View style={styles.topOverlay}>
                    <Pressable
                        onPress={() => setMenuOpen((v) => !v)}
                        style={styles.avatarBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Profile"
                        testID="profile-avatar"
                    >
                        <Text style={styles.avatarText}>
                            {(userId?.slice(-2) || 'U').toUpperCase()}
                        </Text>
                    </Pressable>

                    {menuOpen && (
                        <View style={styles.dropdownMenu} testID="profile-menu">
                            <View style={styles.menuHeader}>
                                <Text style={styles.menuHeaderLabel}>Signed in</Text>
                                <Text style={styles.menuHeaderValue} numberOfLines={2}>
                                    {userId || 'unknown'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onLogout} style={styles.menuItem}>
                                <Ionicons name="log-out-outline" size={18} color="#111827" />
                                <Text style={styles.menuItemText}>Log out</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <LinearGradient
                    colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.9)']}
                    style={styles.gradientOverlay}
                >
                    {/* Hero Section with Slideshow */}
                    <View style={styles.heroSection}>
                        <ThemedText style={styles.welcomeText}>
                            Welcome Back! Discover What's New
                        </ThemedText>

                        <FlatList
                            ref={flatListRef}
                            data={featuresData}
                            renderItem={renderFeatureSlide}
                            keyExtractor={(item) => item.heading}
                            horizontal
                            pagingEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WITH_SPACING}
                            snapToAlignment="center"
                            decelerationRate="fast"
                            contentContainerStyle={{
                                paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
                            }}
                            bounces={false}
                            getItemLayout={getItemLayout}
                            viewabilityConfig={viewabilityConfig}
                            onViewableItemsChanged={onViewableItemsChanged}
                            style={styles.slideshow}
                        />

                        <ProgressDots currentIndex={currentIndex} total={featuresData.length} />
                    </View>

                    {/* Dashboard Footer - Quick Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleQuickAction('View Trips')}
                        >
                            <Ionicons name="map-outline" size={24} color="#fff" />
                            <ThemedText style={styles.actionText}>View Trips</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleCreateNewTrip} // fixed: no arg passed
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <ThemedText style={styles.actionText}>Create New Trip</ThemedText>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    gradientOverlay: { flex: 1 },

    // Absolute overlay header (avatar + dropdown)
    topOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    avatarBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 12, fontWeight: '700', color: '#111827' },
    dropdownMenu: {
        position: 'absolute',
        top: 44,
        left: 0,
        width: 220,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    menuHeader: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9fafb',
    },
    menuHeaderLabel: { fontSize: 12, color: '#6b7280' },
    menuHeaderValue: { fontSize: 12, color: '#111827' },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    menuItemText: { fontSize: 14, color: '#111827' },

    heroSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
    },
    slideshow: {
        height: slideHeight + 40,
        width: screenWidth,
    },
    slideCard: {
        width: CARD_WIDTH,
        height: slideHeight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING,
    },
    cardContent: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    userStory: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    useCase: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        lineHeight: 20,
        flex: 1,
    },
    iconContainer: {
        alignItems: 'flex-end',
        width: '100%',
        marginTop: 16,
    },

    // Progress Dots
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 40,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
    },
    activeDot: {
        backgroundColor: '#007AFF',
    },

    footer: {
        padding: 24,
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
});
