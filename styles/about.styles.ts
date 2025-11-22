import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_BG = '#1C1C1E';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A1A1AA';

export const aboutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    contentContainer: {
        padding: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    logoContainer: {
        marginBottom: 40,
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 30,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: TEXT_PRIMARY,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    version: {
        fontSize: 16,
        color: '#FFD700', // Gold accent
        fontWeight: '600',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    section: {
        width: '100%',
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: TEXT_SECONDARY,
        lineHeight: 26,
        marginBottom: 16,
    },
    highlight: {
        color: '#FFD700',
        fontWeight: '700',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 12,
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        flex: 1,
    },
    githubButton: {
        backgroundColor: '#24292E',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    donateButton: {
        backgroundColor: '#E91E63',
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
});
