import { StyleSheet } from 'react-native';

const CARD_BG = '#1C1C1E';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A1A1AA';
const ACCENT_COLOR = '#FFD700';

export const aboutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginBottom: 12,
    },
    versionBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    version: {
        fontSize: 13,
        color: ACCENT_COLOR,
        fontWeight: '600',
    },
    section: {
        backgroundColor: CARD_BG,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 16,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    featureCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_PRIMARY,
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 16,
    },
    text: {
        fontSize: 15,
        color: TEXT_SECONDARY,
        lineHeight: 24,
        marginBottom: 12,
    },
    highlight: {
        color: ACCENT_COLOR,
        fontWeight: '700',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        flex: 1,
    },
    githubButton: {
        backgroundColor: '#24292E',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    donateButton: {
        backgroundColor: '#E91E63',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    footerSubtext: {
        color: '#444',
        fontSize: 12,
    },
});
