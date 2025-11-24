/*

import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { checkForUpdate, downloadAndInstallUpdate } from '../utils/updater';

export const UpdateChecker = () => {
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const check = async () => {
            const update = await checkForUpdate();
            if (update) {
                Alert.alert(
                    'Update Available',
                    `A new version (${update.tag_name}) is available.\n\n${update.body || ''}`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Update Now',
                            onPress: () => downloadAndInstallUpdate(update),
                        },
                    ]
                );
            }
        };

        // Check after a short delay to ensure app is loaded
        const timer = setTimeout(check, 5000);
        return () => clearTimeout(timer);
    }, []);

    return null; // This component doesn't render anything visible
};

*/