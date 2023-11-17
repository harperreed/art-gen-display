const path = require('path');
const fs = require('fs');

class ImageCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
  }

  // Function to check if an image is in the cache
  isImageCached(filename) {
    return fs.existsSync(path.join(this.cacheDir, filename));
  }

  // Function to get the cached image URL
  getCachedImageUrl(filename) {
    // Adjust the path according to how you serve static files
    console.log(filename);

    // return path.join(this.cacheDir, filename);
    return filename;
  }

  // Add other cache-related functions here
}

module.exports = ImageCache;