const express = require('express');
const path = require('path');
const http = require('http');
const Utils = require('./Utils');
const https = require('https');
const socketIo = require('socket.io');
const session = require('express-session');
const sharedsession = require("express-socket.io-session");

class Server {
  constructor(port, imageGenerator, imageCache) {
    this.port = port;
    this.imageGenerator = imageGenerator;
    this.imageCache = imageCache;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.setupExpress();
    this.setupSocketIO();
  }

  setupExpress() {
    // Set EJS as the templating engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));

    // Serve static files from 'public' directory (if you have one)
    this.app.use(express.static('public'));
    this.app.use('/cache', express.static('cache'));

    const sessionMiddleware = session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: 'auto' }
    });

    // Session configuration (if needed)
    this.app.use(sessionMiddleware);

    this.io.use(sharedsession(sessionMiddleware, {
      autoSave: true
    }));

    // Define your routes
    this.app.get('/', (req, res) => {
      res.render('index', { title: 'My App' });
    });

    // Additional routes can be defined here
    // ...

    // Handle 404 errors
    this.app.use((req, res, next) => {
      res.status(404).send("Sorry, can't find that!");
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('a user connected');
      if (socket.handshake.session) {
        // Access session data
        console.log('Session data:', socket.handshake.session);

        // You can also modify the session data
        socket.handshake.session.visits = socket.handshake.session.visits ? socket.handshake.session.visits + 1 : 1;
        socket.handshake.session.save();
      }


      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
      socket.on('request image', (width, height) => {
        console.log('Image request:', width, height);
        // ... handle image generation and caching ...
        this.generateImageForClient(socket, width, height)
      });

      const showClock = process.env.SHOW_CLOCK;
      const showPrompt = process.env.SHOW_PROMPT;
      const showProgressBar = process.env.SHOW_PROGRESS_BAR;

      console.log(showClock, showPrompt)
      if (showClock === "True") {
        socket.emit('show clock', true);
      }

      if (showPrompt) {
        socket.emit('show prompt', true);
      }

      if (showProgressBar) {
        socket.emit('show progressbar', true);
      }

    });
  }

  async generateImageForClient(socket, width, height) {
    const prompt = this.imageGenerator.generatePrompt();
    const filename = Utils.generateFilename(prompt, width, height);
    const filePath = path.join(this.imageCache.cacheDir, filename);

    if (this.imageCache.isImageCached(filename)) {
      socket.emit('image changed', this.imageCache.getCachedImageUrl(filename));
      return;
    }
    console.log("making image request")
    const imageUrl = await this.imageGenerator.generateImageWithReplicate(prompt, width, height);


    if (imageUrl) {
      // Store the new image in the cache

      console.log('Image generated!');

      Utils.downloadImage(imageUrl, filePath, (error) => {
        if (error) {
          console.error('Error downloading image:', error);
          return;
        }

        // Emit the image URL after successful download
        socket.emit('image changed', this.imageCache.getCachedImageUrl(filename));
        socket.emit('image prompt', prompt);
      });
    } else {
      console.log("no image url")

    }

  }


  start() {
    this.server.listen(this.port, () => {
      console.log(`Server running at http://localhost:${this.port}`);
    });
  }
}


module.exports = Server;