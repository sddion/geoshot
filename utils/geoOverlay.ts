import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as FileSystem from 'expo-file-system/legacy';

export interface GeoData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  address: string;
  placeName: string;
  plusCode: string;
  dateTime: string;
  temperature: number | null;
  weatherCondition: string;
  magneticField: number | null;
}

const USER_AGENT = 'GeoShotCamera/1.0 (contact@geoshot.app)';

export async function getGeoData(): Promise<GeoData | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude, altitude, speed } = location.coords;

    // Parallelize independent fetches
    const [address, weather, magneticField] = await Promise.all([
      getReverseGeocode(latitude, longitude),
      getWeather(latitude, longitude),
      getMagneticField()
    ]);

    const plusCode = generatePlusCode(latitude, longitude);

    return {
      latitude,
      longitude,
      altitude,
      speed,
      address: address.fullAddress,
      placeName: address.placeName,
      plusCode,
      dateTime: new Date().toISOString(),
      temperature: weather.temperature,
      weatherCondition: weather.condition,
      magneticField,
    };
  } catch (error) {
    console.error('Error getting geo data:', error);
    return null;
  }
}

async function getReverseGeocode(
  lat: number,
  lon: number
): Promise<{ fullAddress: string; placeName: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) throw new Error('Nominatim error');

    const data = await response.json();

    const address = data.address || {};
    const placeName =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      'Unknown Location';

    const fullAddress =
      data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

    return { fullAddress, placeName };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return {
      fullAddress: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      placeName: 'Unknown Location',
    };
  }
}

async function getWeather(
  lat: number,
  lon: number
): Promise<{ temperature: number | null; condition: string }> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    const data = await response.json();

    if (data.current_weather) {
      const temp = data.current_weather.temperature;
      const weatherCode = data.current_weather.weathercode;
      const condition = getWeatherCondition(weatherCode);
      return { temperature: temp, condition };
    }

    return { temperature: null, condition: 'Unknown' };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return { temperature: null, condition: 'Unknown' };
  }
}

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function generatePlusCode(lat: number, lon: number): string {
  const code = `${Math.abs(lat).toFixed(4)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(
    lon
  ).toFixed(4)}${lon >= 0 ? 'E' : 'W'}`;
  return code;
}

async function getMagneticField(): Promise<number | null> {
  try {
    const isAvailable = await Magnetometer.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    return new Promise((resolve) => {
      const subscription = Magnetometer.addListener((data) => {
        const magnitude = Math.sqrt(
          data.x * data.x + data.y * data.y + data.z * data.z
        );
        subscription.remove();
        resolve(magnitude);
      });

      // Timeout after 1s
      setTimeout(() => {
        subscription.remove();
        resolve(null);
      }, 1000);
    });
  } catch (error) {
    console.error('Magnetometer error:', error);
    return null;
  }
}

// Tile Caching Logic
const TILE_CACHE_DIR = ((FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory) + 'osm_tiles/';

async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(TILE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(TILE_CACHE_DIR, { intermediates: true });
  }
}

export async function getCachedMapTile(
  lat: number,
  lon: number,
  zoom: number = 15
): Promise<string> {
  try {
    await ensureCacheDir();

    const tileSize = 256;
    const centerX = ((lon + 180) / 360) * Math.pow(2, zoom) * tileSize;
    const centerY =
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
        ) /
        Math.PI) /
        2) *
      Math.pow(2, zoom) *
      tileSize;

    const tileX = Math.floor(centerX / tileSize);
    const tileY = Math.floor(centerY / tileSize);

    const fileName = `${zoom}_${tileX}_${tileY}.png`;
    const fileUri = TILE_CACHE_DIR + fileName;

    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (fileInfo.exists) {
      return fileUri;
    }

    const url = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

    // Download with User-Agent
    const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (downloadRes.status === 200) {
      return downloadRes.uri;
    }

    return url; // Fallback to remote URL if download fails
  } catch (error) {
    console.error('Tile cache error:', error);
    // Fallback calculation without caching
    const tileSize = 256;
    const centerX = ((lon + 180) / 360) * Math.pow(2, zoom) * tileSize;
    const centerY =
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
        ) /
        Math.PI) /
        2) *
      Math.pow(2, zoom) *
      tileSize;
    const tileX = Math.floor(centerX / tileSize);
    const tileY = Math.floor(centerY / tileSize);
    return `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
  }
}
