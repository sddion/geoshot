import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { getGeoData, GeoData, getCachedMapTile } from './geoOverlay';

export function useLiveGeoData(enabled: boolean) {
    const [data, setData] = useState<GeoData | null>(null);
    const [mapTile, setMapTile] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

    // Refs for throttling
    const lastFullUpdate = useRef<number>(0);
    const FULL_UPDATE_INTERVAL = 15000; // 15 seconds for weather/address

    // Watch for permission changes
    useEffect(() => {
        let isMounted = true;

        const checkPermissionStatus = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (isMounted) {
                setPermissionStatus(status);
            }
        };

        // Check immediately
        checkPermissionStatus();

        // Check periodically (in case permissions change)
        const interval = setInterval(checkPermissionStatus, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        let locationSub: Location.LocationSubscription | null = null;
        let magSub: { remove: () => void } | null = null;
        let isMounted = true;

        const startUpdates = async () => {
            if (!enabled) return;

            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('GPS: Foreground location permission not granted yet');
                setLoading(false);
                return;
            }

            try {
                console.log('GPS: Starting location updates...');
                // Initial full fetch
                const initialData = await getGeoData();
                if (isMounted && initialData) {
                    setData(initialData);
                    lastFullUpdate.current = Date.now();

                    // Fetch map tile
                    const tile = await getCachedMapTile(initialData.latitude, initialData.longitude);
                    setMapTile(tile);
                }
                setLoading(false);

                // Live Location Updates (Speed, Altitude)
                locationSub = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 1000,
                        distanceInterval: 0,
                    },
                    async (location) => {
                        if (!isMounted) return;

                        const now = Date.now();
                        const shouldFullUpdate = now - lastFullUpdate.current > FULL_UPDATE_INTERVAL;

                        if (shouldFullUpdate) {
                            // Refresh everything
                            const fullData = await getGeoData();
                            if (fullData) {
                                setData(fullData);
                                lastFullUpdate.current = now;
                                const tile = await getCachedMapTile(fullData.latitude, fullData.longitude);
                                setMapTile(tile);
                            }
                        } else {
                            // Just update fast changing values
                            setData((prev) => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                    altitude: location.coords.altitude,
                                    speed: location.coords.speed,
                                    dateTime: new Date().toISOString(),
                                };
                            });
                        }
                    }
                );

                // Magnetometer Updates
                if (await Magnetometer.isAvailableAsync()) {
                    Magnetometer.setUpdateInterval(1000);
                    magSub = Magnetometer.addListener((result) => {
                        if (!isMounted) return;
                        const magnitude = Math.sqrt(
                            result.x * result.x + result.y * result.y + result.z * result.z
                        );
                        setData((prev) => {
                            if (!prev) return null;
                            return { ...prev, magneticField: magnitude };
                        });
                    });
                }

            } catch (error) {
                console.error('Live geo data error:', error);
                setLoading(false);
            }
        };

        if (enabled) {
            startUpdates();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
            if (locationSub) locationSub.remove();
            if (magSub) magSub.remove();
        };
    }, [enabled, permissionStatus]); // Re-run when permission status changes

    return { data, mapTile, loading };
}
