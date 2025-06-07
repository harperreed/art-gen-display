import path from 'path';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import ImageGenerator from './ImageGenerator.js';
import ImageCache from './ImageCache.js';
import Server from './Server.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const cacheDir = path.join(__dirname, 'cache');
const port = process.env.PORT || 8354;

const imageGenerator = new ImageGenerator(replicate);
const imageCache = new ImageCache(cacheDir);
const server = new Server(port, imageGenerator, imageCache);

server.start();

