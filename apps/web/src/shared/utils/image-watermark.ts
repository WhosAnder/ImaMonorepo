/**
 * Image Watermark Utility
 * 
 * Applies watermark (logo + timestamp) to images before upload to S3.
 * Uses HTML Canvas API for client-side processing.
 * 
 * Features:
 * - Semi-transparent logo overlay
 * - Formatted timestamp
 * - Image compression/optimization
 * - Error handling with graceful fallback
 */

export interface WatermarkOptions {
  timestamp?: string | Date;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  logoPath?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  padding?: number;
}

interface ProcessedImageResult {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: Required<WatermarkOptions> = {
  timestamp: new Date(),
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  logoPath: '/assets/ima-logo.png',
  opacity: 0.7,
  position: 'bottom-right',
  padding: 20,
};

// Cache loaded logo to avoid reloading
let cachedLogo: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

/**
 * Format timestamp for watermark display
 */
function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}\n${hours}:${minutes}`;
}

/**
 * Load logo image (with caching)
 */
async function loadLogo(logoPath: string): Promise<HTMLImageElement> {
  // Return cached logo if available
  if (cachedLogo && cachedLogo.src.endsWith(logoPath)) {
    return cachedLogo;
  }

  // Return pending promise if already loading
  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  // Load logo
  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      cachedLogo = img;
      logoLoadPromise = null;
      resolve(img);
    };
    
    img.onerror = () => {
      logoLoadPromise = null;
      reject(new Error(`Failed to load logo from ${logoPath}`));
    };
    
    img.src = logoPath;
  });

  return logoLoadPromise;
}

/**
 * Load image from File or base64 string
 */
function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Calculate dimensions for resized image (maintaining aspect ratio)
 */
function calculateResizedDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Draw watermark on canvas
 */
async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: Required<WatermarkOptions>,
  useFallbackText: boolean = false
): Promise<void> {
  const { padding, opacity, position } = options;
  const formattedTimestamp = formatTimestamp(options.timestamp);
  
  // Try to load and draw logo
  let logo: HTMLImageElement | null = null;
  if (!useFallbackText) {
    try {
      logo = await loadLogo(options.logoPath);
    } catch (error) {
      console.warn('Failed to load logo, using text-only watermark:', error);
      // Continue with text-only watermark
    }
  }

  // Calculate watermark dimensions
  const logoHeight = logo ? Math.min(60, canvas.height * 0.1) : 0;
  const logoWidth = logo ? (logoHeight * logo.width) / logo.height : 0;
  
  // Set text properties
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  
  // Measure text dimensions
  const lines = formattedTimestamp.split('\n');
  const textMetrics = lines.map(line => ctx.measureText(line));
  const textWidth = Math.max(...textMetrics.map(m => m.width));
  const lineHeight = 20;
  const textHeight = lines.length * lineHeight;
  
  // Calculate watermark box dimensions
  const watermarkWidth = Math.max(logoWidth, textWidth) + padding * 2;
  const watermarkHeight = (logo ? logoHeight + 10 : 0) + textHeight + padding * 2;
  
  // Calculate position
  let x: number, y: number;
  switch (position) {
    case 'bottom-right':
      x = canvas.width - watermarkWidth - padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - watermarkHeight - padding;
      break;
    case 'top-right':
      x = canvas.width - watermarkWidth - padding;
      y = padding;
      break;
    case 'top-left':
      x = padding;
      y = padding;
      break;
    default:
      x = canvas.width - watermarkWidth - padding;
      y = canvas.height - watermarkHeight - padding;
  }
  
  // Draw semi-transparent background
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
  ctx.fillRect(x, y, watermarkWidth, watermarkHeight);
  
  // Draw logo if available
  let currentY = y + padding;
  if (logo) {
    const logoX = x + (watermarkWidth - logoWidth) / 2;
    ctx.globalAlpha = opacity;
    ctx.drawImage(logo, logoX, currentY, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;
    currentY += logoHeight + 10;
  }
  
  // Draw timestamp text
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = opacity;
  lines.forEach((line, index) => {
    const textX = x + (watermarkWidth - ctx.measureText(line).width) / 2;
    ctx.fillText(line, textX, currentY + index * lineHeight);
  });
  ctx.globalAlpha = 1.0;
}

/**
 * Convert canvas to File object
 */
async function canvasToFile(
  canvas: HTMLCanvasElement,
  originalFileName: string,
  mimeType: string,
  quality: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        
        // Create filename with watermark indicator
        const extension = mimeType.split('/')[1] || 'jpg';
        const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
        const fileName = `${nameWithoutExt}_wm.${extension}`;
        
        const file = new File([blob], fileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Main function: Apply watermark to image
 * 
 * @param source - File object or base64 data URL
 * @param options - Watermark configuration options
 * @returns Processed File object with watermark
 */
export async function applyWatermarkToImage(
  source: File | string,
  options: WatermarkOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get original file name and size
  let originalFileName: string;
  let originalSize: number;
  let mimeType: string;
  
  if (source instanceof File) {
    originalFileName = source.name;
    originalSize = source.size;
    mimeType = source.type || 'image/jpeg';
  } else {
    originalFileName = 'image.jpg';
    originalSize = source.length;
    // Extract mime type from base64 data URL
    const match = source.match(/data:([^;]+);/);
    mimeType = match ? match[1] : 'image/jpeg';
  }
  
  try {
    // Load source image
    const img = await loadImage(source);
    
    // Calculate resized dimensions
    const { width, height } = calculateResizedDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight
    );
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Draw original image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Draw watermark
    await drawWatermark(ctx, canvas, opts);
    
    // Convert to File
    const processedFile = await canvasToFile(
      canvas,
      originalFileName,
      mimeType,
      opts.quality
    );
    
    // Log compression info
    const compressionRatio = ((originalSize - processedFile.size) / originalSize * 100).toFixed(1);
    console.log(`[Watermark] Processed: ${originalFileName}`);
    console.log(`  Original: ${(originalSize / 1024).toFixed(1)}KB → Processed: ${(processedFile.size / 1024).toFixed(1)}KB`);
    console.log(`  Compression: ${compressionRatio}% reduction`);
    console.log(`  Dimensions: ${img.width}x${img.height} → ${width}x${height}`);
    
    return processedFile;
    
  } catch (error) {
    console.error('[Watermark] Failed to process image:', error);
    
    // Fallback: Return original file if it's a File object
    if (source instanceof File) {
      console.warn('[Watermark] Returning original file without watermark');
      return source;
    }
    
    // Fallback: Convert base64 to File without watermark
    console.warn('[Watermark] Converting base64 to file without watermark');
    const base64Data = source.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    return new File([bytes], originalFileName, { type: mimeType });
  }
}

/**
 * Batch process multiple images with watermarks
 * 
 * @param sources - Array of File objects or base64 strings
 * @param options - Watermark configuration options
 * @returns Array of processed File objects
 */
export async function applyWatermarkToImages(
  sources: (File | string)[],
  options: WatermarkOptions = {}
): Promise<File[]> {
  console.log(`[Watermark] Processing ${sources.length} images...`);
  
  const results = await Promise.allSettled(
    sources.map(source => applyWatermarkToImage(source, options))
  );
  
  const processedFiles: File[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      processedFiles.push(result.value);
    } else {
      console.error(`[Watermark] Failed to process image ${index}:`, result.reason);
      // For failed images, try to convert source to File as fallback
      const source = sources[index];
      if (source instanceof File) {
        processedFiles.push(source);
      }
    }
  });
  
  console.log(`[Watermark] Successfully processed ${processedFiles.length}/${sources.length} images`);
  return processedFiles;
}

/**
 * Helper: Convert base64 data URL to File
 */
export function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Helper: Convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
