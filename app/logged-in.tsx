// app/logged-in.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import { ThemedText } from '@/components/themed-text'; // Uncomment if available (and remove fallback below)
// import { ThemedView } from '@/components/themed-view'; // Uncomment if available (and remove fallback below)

// Fallback components if Themed* not available (remove if using real imports)
const ThemedText = ({ children, style, type, ...props }: any) => (
    <Text style={style} {...props}>{children}</Text>
);
const ThemedView = ({ children, style, ...props }: any) => (
    <View style={style} {...props}>{children}</View>
);

const { width: screenWidth } = Dimensions.get('window');
const slideWidth = screenWidth - 48; // Exact slide width (accounting for 24px padding on each side)
const slideHeight = 280; // Fixed height for each slide

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

// Inline Progress Dots Component
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

    // Viewability config for detecting visible slide
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            console.log(`Slide changed to index: ${newIndex}`); // Debug log
            setCurrentIndex(newIndex);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % featuresData.length;
            console.log(`Auto-advancing to index: ${nextIndex}`); // Debug log
            setCurrentIndex(nextIndex);
            // Use scrollToOffset for reliable horizontal scrolling
            flatListRef.current?.scrollToOffset({
                offset: nextIndex * slideWidth,
                animated: true,
            });
        }, 4000); // Auto-advance every 4 seconds

        return () => clearInterval(interval);
    }, [currentIndex]);

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: slideWidth,
            offset: slideWidth * index,
            index,
        }),
        []
    );

    const renderFeatureSlide = ({ item, index }: { item: any; index: number }) => (
        <ThemedView style={styles.slideCard}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => {
                    console.log(`Tapped: ${item.heading}`); // Debug log
                    Alert.alert('Feature Tapped', `${item.heading} - Coming soon!`);
                }}
                activeOpacity={0.8}
            >
                <ThemedText type="title" style={styles.heading}>{item.heading}</ThemedText>
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

    return (
        <ThemedView style={styles.container}>
            <ImageBackground
                source={require('../assets/images/Background.jpg')}
                style={styles.background}
                resizeMode="cover"
                defaultSource={{ uri: 'https://via.placeholder.com/1920x1080/007AFF/FFFFFF?text=Background' }}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.9)']}
                    style={styles.gradientOverlay}
                >
                    {/* Hero Section with Slideshow */}
                    <View style={styles.heroSection}>
                        <ThemedText type="title" style={styles.welcomeText}>
                            Welcome Back! Discover What's New
                        </ThemedText>
                        <FlatList
                            ref={flatListRef}
                            data={featuresData}
                            renderItem={renderFeatureSlide}
                            keyExtractor={(item) => item.heading}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={slideWidth}
                            decelerationRate="fast"
                            bounces={false} // Crisp paging, no bounce
                            getItemLayout={getItemLayout} // Exact layout for scrolling
                            viewabilityConfig={viewabilityConfig}
                            onViewableItemsChanged={onViewableItemsChanged}
                            style={styles.slideshow}
                            contentContainerStyle={styles.slideshowContent}
                            initialScrollIndex={0} // Start at first slide
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
                            onPress={() => handleQuickAction('Create New Trip')}
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
        height: slideHeight + 40, // Fixed height to contain slides + margin
        width: screenWidth,
    },
    slideshowContent: {
        paddingHorizontal: 0, // Remove padding here; handled by slideWidth
        height: slideHeight,
        alignItems: 'center',
    },
    slideCard: {
        width: slideWidth,
        height: slideHeight,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 0, // No extra margin; getItemLayout handles spacing
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
    // Inline Progress Dots Styles
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
