const Replicate = require('replicate');  // Import if needed in this file
const axios = require('axios');
const winston = require('winston');
const Utils = require('./Utils');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ImageGenerator {
  constructor(replicate) {
    this.replicate = replicate;
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.label({ label: 'ImageGenerator' }), // Adding a label
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: './logs/image-gen.error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/image-gen.combined.log' })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  generatePrompt() {
    // Load and parse YAML file
    const fileContents = fs.readFileSync('./prompts.yaml', 'utf8');
    const data = yaml.load(fileContents);

    // Random selection from each array
    const randomType = data.types[Math.floor(Math.random() * data.types.length)];
    const randomFeeling = data.feelings[Math.floor(Math.random() * data.feelings.length)];
    const randomKeyword = data.keywords[Math.floor(Math.random() * data.keywords.length)];
    const randomStyle = data.styles[Math.floor(Math.random() * data.styles.length)];
    const randomArtistStyle = data.artistStyles[Math.floor(Math.random() * data.artistStyles.length)];

    // Return the generated prompt
    return `a ${randomType} of a ${randomFeeling} ${randomKeyword} in ${randomStyle} style made by ${randomArtistStyle} that would appeal to tasteless oligarch`;
  }

  async generateImageWithReplicate(prompt, originalWidth, originalHeight) {

    this.logger.debug("width", originalWidth)
    this.logger.debug("height", originalHeight)
    const { width, height } = Utils.makeResolutionDivisibleBy8(originalWidth, originalHeight);
    this.logger.debug("new width", width)
    this.logger.debug("new height", height)
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
      num_inference_steps: 50
    };

    // Read the environmental variable
    const replicateServiceType = process.env.REPLICATE_SERVICE;

    // Choose the service based on the environmental variable
    let output;
    if (replicateServiceType === 'local') {
      this.logger.info("calling local replicate service")
      const localReplicateServiceURL = process.env.REPLICATE_API_URL;
      this.logger.debug(localReplicateServiceURL)
      output = await this.callLocalReplicateService(localReplicateServiceURL, replicateInput);


    } else { // default to remote if not specified or specified as 'remote'
      this.logger.info("calling remote replicate service")
      const model = process.env.REPLICATE_MODEL;
      this.logger.debug(model)
      output = await this.callReplicateService(model, replicateInput);

    }

    if (output && output[0]) {
      // this.logger.debug("output", output[0])
      return {
        imageUrl: output[0], generatorInput: replicateInput
      }; // Assuming this is the image URL
    }
    this.logger.error("no usable output from replicate")
    this.logger.error(`output: ${JSON.stringify(output)}`)
    return { imageUrl: null, generatorInput: replicateInput };
  }


  async callReplicateService(model, input) {

    try {
      this.logger.debug(`model:  ${model}`)
      this.logger.debug(`input: ${JSON.stringify(input)}`)
      const output = await this.replicate.run(
        model,
        { input: input }
      );
      this.logger.debug('Replicate output:', output)

      if (output) {
        return output; // Assuming this is the image URL
      }

      this.logger.error("no output from replicate")

      return null;
    } catch (error) {
      this.logger.error('Error generating image with Replicate:', error);
      return null;
    }
  }

  async callLocalReplicateService(url, payload) {
    this.logger.info("calling local replicate service")
    this.logger.debug(`Local URL: ${url}`)
    this.logger.debug(`Local Payload: ${JSON.stringify(payload)}`)
    try {
      const response = await axios.post(url, { input: payload });
      // this.logger.debug('Replicate output:', response.data.output)
      return response.data.output;
      // return null
    } catch (error) {
      this.logger.error('Error making the POST request:', error);
      return null;
    }
  }

}



module.exports = ImageGenerator;