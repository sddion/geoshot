import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

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

export async function getGeoData(): Promise<GeoData | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude, altitude, speed } = location.coords;

    const address = await getReverseGeocode(latitude, longitude);
    const weather = await getWeather(latitude, longitude);
    
    const plusCode = generatePlusCode(latitude, longitude);
    const magneticField = await getMagneticField();

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
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`
    );
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
      console.log('Magnetometer not available');
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

      setTimeout(() => {
        subscription.remove();
        resolve(null);
      }, 2000);
    });
  } catch (error) {
    console.error('Magnetometer error:', error);
    return null;
  }
}

export function getMapImageUrl(
  lat: number,
  lon: number,
  width: number = 300,
  height: number = 200,
  zoom: number = 15
): string {
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
