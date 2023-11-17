const path = require('path');

const Replicate = require('replicate');
require('dotenv').config();

// Import your custom classes
const ImageGenerator = require('./ImageGenerator');
const ImageCache = require('./ImageCache');
const Server = require('./Server');


const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const cacheDir = path.join(__dirname, 'cache');
const port = process.env.PORT || 8354;

const imageGenerator = new ImageGenerator(replicate);
const imageCache = new ImageCache(cacheDir);
const server = new Server(port, imageGenerator, imageCache);

server.start();
