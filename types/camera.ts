// Camera related types
export type CameraFacing = 'back' | 'front';

// Photo capture options
export interface PhotoCaptureOptions {
    flash?: 'off' | 'on' | 'auto';
    qualityPrioritization?: 'quality' | 'speed' | 'balanced';
    enableShutterSound?: boolean;
}

// Camera permissions
export interface CameraPermissionStatus {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
}

// Focus point
export interface FocusPoint {
    x: number;
    y: number;
}

// Zoom range
export interface ZoomRange {
    minZoom: number;
    maxZoom: number;
    neutralZoom: number;
}
