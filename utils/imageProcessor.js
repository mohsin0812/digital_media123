const path = require('path');
const fs = require('fs');

// Check if sharp is available (optional dependency)
let sharp = null;
let sharpAvailable = false;
try {
  sharp = require('sharp');
  sharpAvailable = true;
} catch (e) {
  console.log('Sharp not available. Image optimization disabled. Install with: npm install sharp');
}

/**
 * Process and optimize uploaded image
 * Creates thumbnails and optimized versions
 */
async function processImage(filePath, options = {}) {
  if (!sharpAvailable) {
    return {
      original: filePath,
      optimized: filePath,
      thumbnail: filePath
    };
  }

  const { 
    maxWidth = 1920, 
    maxHeight = 1080, 
    quality = 85,
    thumbnailSize = 300 
  } = options;

  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    
    const optimizedPath = path.join(dir, `${baseName}_optimized${ext}`);
    const thumbnailPath = path.join(dir, `${baseName}_thumb${ext}`);

    if (!sharp) {
      return {
        original: filePath,
        optimized: filePath,
        thumbnail: filePath
      };
    }

    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Create optimized version
    let optimized = image.clone();
    
    // Resize if needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      optimized = optimized.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Optimize based on format
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      optimized = optimized.jpeg({ quality, progressive: true });
    } else if (metadata.format === 'png') {
      optimized = optimized.png({ quality, compressionLevel: 9 });
    } else if (metadata.format === 'webp') {
      optimized = optimized.webp({ quality });
    }

    await optimized.toFile(optimizedPath);

    // Create thumbnail
    await image
      .clone()
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return {
      original: filePath,
      optimized: optimizedPath,
      thumbnail: thumbnailPath,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      }
    };
  } catch (error) {
    console.error('Image processing error:', error);
    // Return original if processing fails
    return {
      original: filePath,
      optimized: filePath,
      thumbnail: filePath
    };
  }
}

/**
 * Get image dimensions and metadata
 */
async function getImageMetadata(filePath) {
  if (!sharpAvailable) {
    return null;
  }

  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    console.error('Error reading image metadata:', error);
    return null;
  }
}

module.exports = {
  processImage,
  getImageMetadata,
  sharpAvailable
};

