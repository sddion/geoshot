import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aboutStyles as styles } from '@/styles/about.styles';
import Constants from 'expo-constants';

export default function AboutScreen() {
    const version = Constants.expoConfig?.version || '1.0.0';

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
                    <Text style={styles.version}>v{version}</Text>
                </View>

                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFD700" style={{ marginRight: 10 }} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Our Philosophy</Text>
                    </View>

                    <Text style={styles.text}>
                        GeoShot was built with a simple mission: <Text style={styles.highlight}>Ditch Ads.</Text>
                    </Text>
                    <Text style={[styles.text, { marginBottom: 0 }]}>
                        We believe your camera app should be a tool, not a billboard. No tracking, and absolutely no advertisements. Just a clean, powerful camera experience that respects your privacy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MaterialCommunityIcons name="heart-outline" size={24} color="#E91E63" style={{ marginRight: 10 }} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Support Development</Text>
                    </View>
                    <Text style={styles.text}>
                        This project is open source and maintained by Sddion. If you enjoy using GeoShot, consider starring the repo or making a donation to support future updates.
                    </Text>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.githubButton]}
                            onPress={() => Linking.openURL('https://github.com/sddion/geoshot')}
                        >
                            <MaterialCommunityIcons name="github" size={22} color="#fff" />
                            <Text style={styles.buttonText}>GitHub</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.donateButton]}
                            onPress={() => Linking.openURL('https://github.com/sponsors/sddion')}
                        >
                            <MaterialCommunityIcons name="heart" size={22} color="#fff" />
                            <Text style={styles.buttonText}>Donate</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made with ❤️ by Sddion</Text>
                </View>
            </ScrollView>
        </>
    );
}
