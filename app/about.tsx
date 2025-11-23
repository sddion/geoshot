import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aboutStyles as styles } from '@/styles/about.styles';
import Constants from 'expo-constants';

export default function AboutScreen() {
    const version = Constants.expoConfig?.version || '1.0.0';

    const features = [
        { icon: 'map-marker', title: 'GPS Overlay', description: 'Location data on photos' },
        { icon: 'shield-check', title: 'Privacy First', description: 'No tracking, no ads' },
        { icon: 'camera', title: 'Pro Features', description: 'Manual controls & grids' },
        { icon: 'open-source-initiative', title: 'Open Source', description: 'Free forever' },
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
                {/* App Header */}
                <View style={styles.header}>
                    <Image
                        source={require('@/assets/images/android/mipmap-xxxhdpi/geoshot.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>GeoShot</Text>
                    <Text style={styles.tagline}>Camera with GPS Overlay</Text>
                    <Text style={styles.version}>Version {version}</Text>
                </View>

                {/* Description */}
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>
                        GeoShot embeds GPS data, location info, and weather conditions directly onto your photos. Perfect for documentation, field work, and travel.
                    </Text>
                </View>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name={feature.icon as any}
                                    size={24}
                                    color="#FFD700"
                                />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => Linking.openURL('https://github.com/sddion/geoshot')}
                    >
                        <MaterialCommunityIcons name="github" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>View on GitHub</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => Linking.openURL('https://buymeacoffee.com/sddion')}
                    >
                        <MaterialCommunityIcons name="heart" size={20} color="#E91E63" />
                        <Text style={styles.actionButtonText}>Support Development</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made with ❤️ by Sddion</Text>
                    <Text style={styles.footerSubtext}>Open Source • React Native • Expo</Text>
                </View>
            </ScrollView>
        </>
    );
}
