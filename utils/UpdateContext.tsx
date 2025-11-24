import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkForUpdate, GitHubRelease } from './updater';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UpdateContextValue {
    updateInfo: GitHubRelease | null;
    refresh: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextValue | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [updateInfo, setUpdateInfo] = useState<GitHubRelease | null>(null);

    const refresh = async () => {
        try {
            const info = await checkForUpdate();
            setUpdateInfo(info);
        } catch (e) {
            console.warn('Update check failed', e);
            setUpdateInfo(null);
        }
    };

    // Run once per day
    useEffect(() => {
        const runCheck = async () => {
            const last = await AsyncStorage.getItem('lastUpdateCheck');
            const now = Date.now();
            if (!last || now - Number(last) > 24 * 60 * 60 * 1000) {
                await refresh();
                await AsyncStorage.setItem('lastUpdateCheck', now.toString());
            } else {
                // Still load cached info if any
                await refresh();
            }
        };
        runCheck();
    }, []);

    return (
        <UpdateContext.Provider value={{ updateInfo, refresh }}>
            {children}
        </UpdateContext.Provider>
    );
};

export const useUpdate = (): UpdateContextValue => {
    const ctx = useContext(UpdateContext);
    if (!ctx) throw new Error('useUpdate must be used within UpdateProvider');
    return ctx;
};
