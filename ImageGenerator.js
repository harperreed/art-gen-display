const Replicate = require('replicate');  // Import if needed in this file
const axios = require('axios');
const Utils = require('./Utils');
const fs = require('fs');
const path = require('path');

class ImageGenerator {
  constructor(replicate) {
    this.replicate = replicate;
  }

  generatePrompt() {
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

    return `a ${randomType} of a ${randomFeeling} ${randomKeyword} in ${randomStyle} style made by ${randomArtistStyle} for display in a museum `;
  }

  async generateImageWithReplicate(prompt, width, height) {

    const { newWidth, newHeight } = Utils.makeResolutionDivisibleBy8(width, height);

    const negative_prompt = `(bad_prompt_version2:0.8), bad-artist, logo, dog, Glasses, Watermark, bad artist, helmet, blur, blurry, text, b&w, 3d, bad art, poorly drawn, disfigured, deformed, extra limbs, ugly hands, extra fingers, canvas frame, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), weird colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, deformed, cross-eye, body out of frame, blurry, bad art, bad anatomy, 3d render`;
    const replicateInput = {
      width: newWidth,
      height: newHeight,
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
    // console.log('Replicate input:', replicateInput)
    // console.log('Replicate input:', JSON.stringify(replicateInput))
    const output = await this.callLocalReplicateService('http://100.123.55.148:5000/predictions', replicateInput)
    // const model = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
    // const output = this.callReplicateService(model, replicateInput)
    if (output && output[0]) {
      return output[0]; // Assuming this is the image URL
    }
    return null;
  }


  async callReplicateService(model, input) {

    try {
      const output = await this.replicate.run(
        model,
        { input: input }
      );
      console.log('Replicate output:', output)

      if (output) {
        return output; // Assuming this is the image URL
      }

      return null;
    } catch (error) {
      console.error('Error generating image with Replicate:', error);
      return null;
    }
  }

  async callLocalReplicateService(url, payload) {

    try {
      const response = await axios.post(url, { input: payload });

      return response.data.output;
      // return null
    } catch (error) {
      console.error('Error making the POST request:', error);
      return null;
    }
  }

}



module.exports = ImageGenerator;