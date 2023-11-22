const path = require('path');
const winston = require('winston');
const fs = require('fs');

class ImageCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.label({ label: 'ImageCache' }), // Adding a label
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: './logs/image-cache.error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/image-cache.combined.log' })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  // Function to check if an image is in the cache
  isImageCached(filename) {
    return fs.existsSync(path.join(this.cacheDir, filename));
  }

  // Function to get the cached image URL
  getCachedImageUrl(filename) {
    // Adjust the path according to how you serve static files
    this.logger.debug(filename);

    // return path.join(this.cacheDir, filename);
    return filename;
  }

  // Add other cache-related functions here
}

module.exports = ImageCache;