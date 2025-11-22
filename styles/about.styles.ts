import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const aboutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 60,
    },
    logoContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 25,
        marginBottom: 15,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    version: {
        fontSize: 16,
        color: '#888',
        marginBottom: 30,
    },
    section: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    text: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
        marginBottom: 15,
    },
    highlight: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 0.48,
    },
    githubButton: {
        backgroundColor: '#333',
    },
    donateButton: {
        backgroundColor: '#E91E63',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
});
