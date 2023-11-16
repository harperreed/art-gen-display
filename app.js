const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const Replicate = require('replicate');
const session = require('express-session');
require('dotenv').config();
const fs = require('fs');
const CryptoJS = require("crypto-js");


const cacheDir = path.join(__dirname, 'cache');


const app = express();
// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const server = http.createServer(app);
const io = socketIo(server);
const port = 8354;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const imageCache = {}; // Key: prompt, Value: image URL

app.use('/cache', express.static('cache'));

app.use(session({
  secret: 'omg ai is going to kill us all', // Use a secret key for session handling
  resave: false,
  saveUninitialized: true,
  cookie: { secure: !true } // Set true in production with HTTPS
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:width/:height', (req, res) => {
  // Retrieve width and height from the request parameters
  const width = parseInt(req.params.width, 10);
  const height = parseInt(req.params.height, 10);

  // Assign the parsed values to the session
  req.session.width = width;
  req.session.height = height;

  // Send the file response
  res.sendFile(path.join(__dirname, 'index.html'));
});


io.on('connection', (socket) => {
  console.log('a user connected');
  generateImageForClient(socket, 1024, 1024);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

function downloadImage(url, filePath, callback) {
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);  // close() is async, call callback after close completes.
    });
  }).on('error', (err) => {
    fs.unlink(filePath); // Delete the file async. (No need to check the result)
    if (callback) callback(err.message);
  });
}


function generateFilename(prompt, width, height) {
  const hash = CryptoJS.SHA256(prompt).toString(CryptoJS.enc.Hex);
  return `${hash}-${width}x${height}.jpg`;
}

// Function to check if an image is in the cache
function isImageCached(filename) {
  return fs.existsSync(path.join(cacheDir, filename));
}

// Function to get the cached image URL
function getCachedImageUrl(filename) {
  // Adjust the path according to how you serve static files
  return `/cache/${filename}`;
}

async function generateImageWithReplicate(prompt, width, height) {
  
  const negative_prompt = `(bad_prompt_version2:0.8), bad-artist, logo, dog, Glasses, Watermark, bad artist, helmet, blur, blurry, text, b&w, 3d, bad art, poorly drawn, disfigured, deformed, extra limbs, ugly hands, extra fingers, canvas frame, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), weird colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, deformed, cross-eye, body out of frame, blurry, bad art, bad anatomy, 3d render`;
  const replicateInput = {
    width: width,
    height: height,
    prompt: prompt,
    disable_safety_checker: true,
    refine: "expert_ensemble_refiner",
    scheduler: "K_EULER",
    lora_scale: 0.6,
    num_outputs: 1,
    guidance_scale: 7.5,
    apply_watermark: false,
    high_noise_frac: 0.8,
    negative_prompt: negative_prompt,
    prompt_strength: 0.8,
    num_inference_steps: 25
  };
  console.log('Replicate input:', replicateInput)

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      { input: replicateInput }
    );
    console.log('Replicate output:', output)

    if (output && output[0]) {
      return output[0]; // Assuming this is the image URL
    }

    return null;
  } catch (error) {
    console.error('Error generating image with Replicate:', error);
    return null;
  }
}


function generatePrompt() {
  const types = ["photo", "painting", "vector image", "digital art"];
  const feelings = ["lonely", "excited", "sad", "depressed"];
  const keywords = ["cyborg", "fireworks", "forest", "cityscape", "rain", "night", "snow", "wolf", "80s hifi bar"];
  const styles = ["vibrant", "surreal", "photorealistic", "painting-like", "collage"];
  const artistStyles = ["Jean-Michel Basquiat", "Marlene Dumas", "keith haring", "picasso", "Yayoi Kusama", "hiroshi nagai", "murakami", "ansel adams", "robert maplethorpe", "Hiroshi Sugimoto"];

  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomFeeling = feelings[Math.floor(Math.random() * feelings.length)];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomArtistStyle = artistStyles[Math.floor(Math.random() * artistStyles.length)];

  return `a black and white ${randomType} of a ${randomFeeling} ${randomKeyword} in ${randomStyle} style made by ${randomArtistStyle} for display in a museum `;
}

async function generateImageForClient(socket, width, height) {
  const prompt = generatePrompt();
  const filename = generateFilename(prompt, width, height);
  const filePath = path.join(cacheDir, filename);

  if (isImageCached(filename)) {
    socket.emit('image changed', getCachedImageUrl(filename));
    return;
  }

  const imageUrl = await generateImageWithReplicate(prompt, width, height);

  if (imageUrl) {
    // Store the new image in the cache

    console.log('Image generated!');

    downloadImage(imageUrl, filePath, (error) => {
      if (error) {
        console.error('Error downloading image:', error);
        return;
      }

      // Emit the image URL after successful download
      socket.emit('image changed', getCachedImageUrl(filename));
    });
  }

}



server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
