import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aboutStyles as styles } from '@/styles/about.styles';
import Constants from 'expo-constants';

export default function AboutScreen() {
    const version = Constants.expoConfig?.version || '1.0.0';

    const features = [
        { icon: 'map-marker', title: 'GPS Overlay', description: 'Embed location data directly on photos' },
        { icon: 'shield-check', title: 'Privacy First', description: 'No ads, no tracking, no data collection' },
        { icon: 'camera', title: 'Pro Features', description: 'Manual controls, grid overlays, and more' },
        { icon: 'open-source-initiative', title: 'Open Source', description: 'Free forever, community-driven' },
    ];

    return (
        <>
            <Stack.Screen
                options={{
                    title: "About",
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                    headerBackTitle: "Settings",
                    headerShadowVisible: false,
                }}
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/android/mipmap-xxxhdpi/geoshot.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>GeoShot</Text>
                    <Text style={styles.tagline}>Camera with GPS Overlay</Text>
                    <View style={styles.versionBadge}>
                        <Text style={styles.version}>v{version}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Features</Text>
                    <View style={styles.featureGrid}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureCard}>
                                <MaterialCommunityIcons
                                    name={feature.icon as any}
                                    size={28}
                                    color="#FFD700"
                                />
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.text}>
                        GeoShot is a privacy-focused camera app that embeds GPS data, location info, and weather conditions directly onto your photos. Perfect for documentation, field work, and travel photography.
                    </Text>
                    <Text style={styles.text}>
                        Built with React Native and Expo, GeoShot is completely open source and free to use.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <Text style={styles.text}>
                        This project is maintained by Sddion. If you find it useful, consider supporting development.
                    </Text>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.githubButton]}
                            onPress={() => Linking.openURL('https://github.com/sddion/geoshot')}
                        >
                            <MaterialCommunityIcons name="github" size={20} color="#fff" />
                            <Text style={styles.buttonText}>GitHub</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.donateButton]}
                            onPress={() => Linking.openURL('https://buymeacoffee.com/sddion')}
                        >
                            <MaterialCommunityIcons name="heart" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made by Sddion</Text>
                </View>
            </ScrollView>
        </>
    );
}
