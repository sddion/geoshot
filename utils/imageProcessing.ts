import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
}

export async function resizeImage(
  uri: string,
  maxWidth: number,
  maxHeight: number
): Promise<ProcessedImage> {
  try {
    const context = ImageManipulator.manipulate(uri);
    const imageRef = await context
      .resize({ width: maxWidth, height: maxHeight })
      .renderAsync();

    const result = await imageRef.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

export async function compressImage(uri: string, quality: number): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(uri);
    const imageRef = await context.renderAsync();
    const result = await imageRef.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}
