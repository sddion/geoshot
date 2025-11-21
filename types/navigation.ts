import { GeoData } from '@/utils/geoOverlay';

// Navigation params
export type RootStackParamList = {
    index: undefined;
    settings: undefined;
    gallery: undefined;
    'geo-preview': { photoUri: string };
};

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Screen props helper
export type ScreenProps<T extends keyof RootStackParamList> = {
    route: { params: RootStackParamList[T] };
    navigation: NativeStackNavigationProp<RootStackParamList, T>;
};

// GPS overlay data
export interface GPSOverlayData {
    geoData: GeoData | null;
    mapTile: string | null;
    imageWidth: number;
    imageHeight?: number;
}

// Media capture result
export interface MediaCaptureResult {
    uri: string;
    type: 'photo' | 'video';
    timestamp: Date;
    gpsData?: GeoData;
}
