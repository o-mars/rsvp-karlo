const MAX_SIZE_KB = 500;
const MAX_WIDTH = 600;

export async function getOptimizedBase64Image(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS if needed
      
      // Load the image
      img.onload = () => {
        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality adjustment
        let quality = 0.8; // Start with 80% quality
        let base64Image = canvas.toDataURL('image/jpeg', quality);
        
        // If the image is still too large, reduce quality
        while (base64Image.length > MAX_SIZE_KB * 1024 * 1.33 && quality > 0.1) { // 1.33 is base64 overhead
          quality -= 0.1;
          base64Image = canvas.toDataURL('image/jpeg', quality);
        }

        if (base64Image.length > MAX_SIZE_KB * 1024 * 1.33) {
          reject(new Error(`Image size exceeds ${MAX_SIZE_KB}KB limit after optimization`));
          return;
        }

        resolve(base64Image);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Start loading the image
      img.src = imagePath;
    } catch (error) {
      reject(error);
    }
  });
} 