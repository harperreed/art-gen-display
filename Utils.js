
const fs = require('fs');
const CryptoJS = require("crypto-js");
const https = require('https');
const http = require('http')

class Utils {
  static downloadImage(url, filePath, callback) {
    // Ensure url is a string
    if (typeof url !== 'string') {
      callback('URL must be a string');
      return;
    }
    const file = fs.createWriteStream(filePath);

    // Check if the URL is Base64 encoded
    if (url.startsWith('data:image/png;base64,')) {
      const base64Data = url.replace(/^data:image\/png;base64,/, '');
      fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
          if (callback) callback(err.message);
        } else {
          if (callback) callback(null);
        }
      });
    } else {
      // Determine the protocol (HTTP or HTTPS)
      const protocol = url.startsWith('https://') ? https : http;

      protocol.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(callback);  // close() is async, call callback after close completes.
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => { }); // Delete the file async. (No need to check the result)
        if (callback) callback(err.message);
      });
    }
  }

  static saveBase64Image(base64String, outputPath) {
    // Remove the data URL prefix to get only the base64 data
    const base64Data = base64String.replace(/^data:image\/png;base64,/, '');

    // Decode the base64 data into binary image data
    const binaryData = Buffer.from(base64Data, 'base64');

    // Write the binary data to a file
    fs.writeFileSync(outputPath, binaryData);
  }

  static generateFilename(prompt, width, height) {
    const hash = CryptoJS.SHA256(prompt).toString(CryptoJS.enc.Hex);
    return `${hash}-${width}x${height}.jpg`;
  }
}
module.exports = Utils;