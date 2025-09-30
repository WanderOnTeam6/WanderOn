import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '../components/onboarding-screen';

export default function OnboardingFlow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const onboardingData = [
    {
      title: 'Plan Smarter, Together',
      description: 'Build detailed itineraries and sync plans with your group in real-time.',
      backgroundImage: require('../assets/images/landing1.jpg'),
    },
    {
      title: 'Manage expenses with ease',
      description: 'Track costs, split bills for food, travel, and hotels, and stay within budget.',
      backgroundImage: require('../assets/images/landing2.jpg'),
    },
    {
      title: 'Smart Routes, Real Stories',
      description: 'Get trusted recommendations from fellow travelers and AI-powered route planning.',
      backgroundImage: require('../assets/images/landing3.jpg'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  const currentScreen = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      <OnboardingScreen
        title={currentScreen.title}
        description={currentScreen.description}
        backgroundImage={currentScreen.backgroundImage}
        onNext={handleNext}
        onSkip={handleSkip}
        showSkip={true}
        isLastScreen={currentIndex === onboardingData.length - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});