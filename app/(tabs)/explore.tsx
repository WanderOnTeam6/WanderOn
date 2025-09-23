import { Image } from 'expo-image';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';

export default function ExploreScreen() {
  return (
    // Parent establishes a stacking context
    <ThemedView style={styles.page}>
      {/* Background logo (stays visible, doesn't eat touches) */}
      <Image
        source={require('@/assets/images/Logo.png')}
        style={styles.bgLogo}
        contentFit="contain"
        pointerEvents="none"
      />

      {/* Content layer */}
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          WanderOn — Trip Planning & Expenses, Together
        </ThemedText>

        <ThemedText style={styles.lead}>
          Plan trips with friends, keep every booking in one place, and split costs without
          spreadsheets. WanderOn keeps your group in sync from first idea to final receipt.
        </ThemedText>

        <Section
          title="Shared Itinerary Planners"
          story="As a group traveler, I want to add itinerary items so everyone knows the plan."
          usecase="Add flights, rentals, and activities; all members can view/edit and changes sync instantly."
        />

        <Section
          title="AI Route Planning"
          story="As a traveler, I want the app to suggest the best route so I can save time and visit more places without stress."
          usecase="Enter your destinations and WanderOn generates an efficient path for you (and your group) to follow."
        />

        <Section
          title="Booking Integrated"
          story="As a user, I want to add booking confirmations and have them scheduled automatically so everyone stays updated."
          usecase="Forward confirmations → the app parses details → booking appears on your itinerary with reminders."
        />

        <Section
          title="Expense Tracking & Splitting"
          story="As a group traveler, I want to track expenses and quickly split fairly at the end."
          usecase="Everyone can add shared transactions; WanderOn calculates who owes whom—no manual math."
        />
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, story, usecase }: { title: string; story: string; usecase: string }) {
  return (
    <Collapsible title={title}>
      <ThemedText style={styles.subhead}>User story</ThemedText>
      <ThemedText style={styles.body}>{story}</ThemedText>
      <ThemedText style={styles.subhead}>Use case</ThemedText>
      <ThemedText style={styles.body}>{usecase}</ThemedText>
    </Collapsible>
  );
}

const styles = StyleSheet.create({
  // Full-page container, creates a stacking context
  page: {
    flex: 1,
    position: 'relative',
  },

  // Background logo: centered, behind content, 60% opacity
  bgLogo: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject, // covers the whole page
    opacity: 0.6,
    zIndex: 0, // behind content (but not negative, so it won't disappear)
    // Center the logo within the page
    width: undefined,
    height: undefined,
  },

  // Content fills the whole page width with comfy padding
  content: {
    zIndex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },

  title: {
    marginBottom: 8,
  },
  lead: {
    marginBottom: 16,
    lineHeight: 20,
  },
  subhead: {
    marginTop: 6,
    fontWeight: '600',
  },
  body: {
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 20,
  },
});
