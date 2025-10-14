// app/(tabs)/logged-in.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';


export default function LoggedInScreen() {
    useEffect(() => {
        console.log('Logged-in screen mounted');  // Add this line for debugging
    }, []);  // Empty array ensures it runs only once on mount

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Logo */}
                <Image
                    source={require('@/assets/images/Logo.png')} // <-- place your Logo.png here
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Title */}
                <ThemedText type="title" style={styles.title}>
                    Welcome to WanderOn
                </ThemedText>

                {/* Description */}
                <ThemedText style={styles.lead}>
                    The Trip planner and Expense management application offers several core features designed
                    to simplify the travel planning process. Below is an overview of what the app does:
                </ThemedText>

                {/* Sections */}
                <Feature
                    heading="Shared Itinerary Planners"
                    userStory="As a group traveler, I would like to add itinerary so that everybody in the group knows the plan."
                    useCase="Add flight, rentals, activities, so all members can view/edit and sync instantly."
                />

                <Feature
                    heading="AI Route Planning"
                    userStory="As a traveler, I want the app to suggest the best route so I can save time and visit more places without stress."
                    useCase="Enter destinations in my trip, and the app automatically creates the most efficient path for me (and my group) to follow."
                />

                <Feature
                    heading="Booking Integrated"
                    userStory="As a user, I would like to add booking confirmation and it automatically adds to schedule, so everybody gets updated."
                    useCase="Forward confirmation → app parses details → booking added to itinerary with reminders."
                />

                <Feature
                    heading="Expense Tracking and Splitting"
                    userStory="As a group traveler, I would like to keep track of our expenses and quickly split them among the group at the end."
                    useCase="Everybody in the group can add transactions that are shared, and the app generates all the split calculations."
                />
            </ScrollView>
        </ThemedView>
    );
}



// Small presentational helper
function Feature({
    heading,
    userStory,
    useCase,
}: {
    heading: string;
    userStory: string;
    useCase: string;
}) {
    return (
        <View style={styles.featureCard}>
            <ThemedText type="subtitle" style={styles.featureTitle}>
                {heading}
            </ThemedText>
            <ThemedText style={styles.smallHeading}>User story</ThemedText>
            <ThemedText style={styles.body}>{userStory}</ThemedText>
            <ThemedText style={styles.smallHeading}>Use case</ThemedText>
            <ThemedText style={styles.body}>{useCase}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    logo: { width: '100%', height: 80, marginBottom: 12 },
    title: { marginBottom: 8 },
    lead: { marginBottom: 16, lineHeight: 20 },
    featureCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    featureTitle: { marginBottom: 8 },
    smallHeading: { marginTop: 4, fontWeight: '600' },
    body: { marginTop: 2, lineHeight: 20 },
});
