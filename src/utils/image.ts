const MAX_SIZE_KB = 500;
const MAX_WIDTH = 600;

export async function getOptimizedBase64Image(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting image conversion for:', imagePath);
      
      // Create an image element
      const img = new Image();
      
      // Load the image
      img.onload = () => {
        try {
          console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
          
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

          console.log('Resized dimensions:', width, 'x', height);

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality adjustment
          let quality = 0.8; // Start with 80% quality
          let base64Image = canvas.toDataURL('image/jpeg', quality);
          
          console.log('Initial base64 length:', base64Image.length);

          // If the image is still too large, reduce quality
          while (base64Image.length > MAX_SIZE_KB * 1024 * 1.33 && quality > 0.1) { // 1.33 is base64 overhead
            quality -= 0.1;
            base64Image = canvas.toDataURL('image/jpeg', quality);
            console.log('Reducing quality to:', quality, 'new length:', base64Image.length);
          }

          if (base64Image.length > MAX_SIZE_KB * 1024 * 1.33) {
            reject(new Error(`Image size exceeds ${MAX_SIZE_KB}KB limit after optimization`));
            return;
          }

          console.log('Final base64 length:', base64Image.length);
          resolve(base64Image);
        } catch (error) {
          console.error('Error in image processing:', error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image:', error);
        reject(new Error('Failed to load image'));
      };

      // Start loading the image
      img.src = imagePath;
    } catch (error) {
      console.error('Error in image conversion:', error);
      reject(error);
    }
  });
} 