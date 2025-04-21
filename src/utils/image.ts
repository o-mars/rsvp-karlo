import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const MAX_SIZE_KB = 500;
const MAX_WIDTH = 600;

export async function getOptimizedBase64Image(imagePath: string): Promise<string> {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(path.join(process.cwd(), 'public', imagePath));
    
    // Process the image with sharp
    const processedImage = await sharp(imageBuffer)
      .resize(MAX_WIDTH, null, { // null for height to maintain aspect ratio
        withoutEnlargement: true, // don't enlarge if image is smaller
        fit: 'inside' // maintain aspect ratio
      })
      .jpeg({ 
        quality: 80, // adjust quality to meet size requirements
        mozjpeg: true // better compression
      })
      .toBuffer();

    // Check if the processed image is within size limits
    if (processedImage.length > MAX_SIZE_KB * 1024) {
      throw new Error(`Image size exceeds ${MAX_SIZE_KB}KB limit after optimization`);
    }

    // Convert to base64
    const base64Image = `data:image/jpeg;base64,${processedImage.toString('base64')}`;
    
    return base64Image;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
} 