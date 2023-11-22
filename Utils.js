
const fs = require('fs');
const CryptoJS = require("crypto-js");
const https = require('https');
const http = require('http')
const winston = require('winston');
class Utils {
  static logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.label({ label: 'Util' }), // Adding a label
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'utils-error.log', level: 'error' }),
      new winston.transports.File({ filename: 'utils-combined.log' })
    ]
  });

  static downloadImage(url, filePath, input, callback) {
    this.logger.debug("downloadImage", url, filePath, input)
    // Ensure url is a string
    if (typeof url !== 'string') {
      callback('URL must be a string');
      return;
    }

    if (input) {
      const inputPath = filePath.replace('.jpg', '.json');
      fs.writeFile(inputPath, JSON.stringify(input, null, 2), (err) => {
        if (err) {
          this.logger.error(err.message);
        }
      });
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

  static makeResolutionDivisibleBy8(width, height) {
    // Calculate the remainders when dividing width and height by 8
    const widthRemainder = width % 8;
    const heightRemainder = height % 8;

    // Subtract the remainders from width and height
    const newWidth = width - widthRemainder;
    const newHeight = height - heightRemainder;

    return { width: newWidth, height: newHeight };
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