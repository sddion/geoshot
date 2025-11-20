import { useState, useEffect } from 'react';
import { getVideoGPSData, getAllVideosWithGPS, VideoGPSData } from './videoGPSData';

/**
 * Hook to retrieve GPS data for a specific video
 */
export function useVideoGPSData(videoUri: string | null) {
    const [gpsData, setGPSData] = useState<VideoGPSData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!videoUri) {
            setGPSData(null);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        getVideoGPSData(videoUri)
            .then((data) => {
                if (isMounted) {
                    setGPSData(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [videoUri]);

    return { gpsData, loading, error };
}

/**
 * Hook to retrieve all videos with GPS data
 */
export function useAllVideosWithGPS() {
    const [videos, setVideos] = useState<VideoGPSData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllVideosWithGPS();
            setVideos(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { videos, loading, error, refresh };
}
