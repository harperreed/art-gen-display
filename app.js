const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const Replicate = require('replicate');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 8354;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  generateImage();
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});



function generatePrompt() {
  const types = ["photo", "painting", "vector image", "digital art"];
  const keywords = ["panda", "cityscape", "rain", "night"];
  const styles = ["vibrant", "surreal", "photorealistic", "painting-like"];
  const artistStyles = ["picasso", "hiroshi nagai", "murakami", "ansel adams", "maplethorpe"];

  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomArtistStyle = artistStyles[Math.floor(Math.random() * artistStyles.length)];
  
  // Construct the prompt
  // You can customize the prompt pattern as needed
  return `a black and white ${randomType} of ${randomKeyword} in ${randomStyle} style made by ${randomArtistStyle} for display in a museum `;
}


// Function to generate a new image
async function generateImage() {
  console.log('Generating image...')
  const width = 2560;
  const height = 1440;
  const negative_prompt = `(bad_prompt_version2:0.8), bad-artist, logo, dog, Glasses, Watermark, bad artist, helmet, blur, blurry, text, b&w, 3d, bad art, poorly drawn, disfigured, deformed, extra limbs, ugly hands, extra fingers, canvas frame, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), weird colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, deformed, cross-eye, body out of frame, blurry, bad art, bad anatomy, 3d render`;
  const prompt = generatePrompt();
  const replicateInput = {
    width: height,
    height: width,
    prompt: prompt,
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
  }
  console.log(replicateInput)
  try {
      const output = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: replicateInput
          }
      );
      console.log('Image generated!');
      console.log(output);
      if (output && output[0]) {
          const imageUrl = output[0]; // Adjust based on response structure
          io.emit('image changed', imageUrl);
      }
  } catch (error) {
      console.error('Error generating image:', error);
  }
}

// Generate a new image every 5 minutes
setInterval(generateImage, 300000); // 300000 milliseconds = 5 minutes


server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
