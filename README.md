
# Image Generator with Replicate

This project is a Node.js web application that periodically generates images using the Replicate API and displays them on a web server. It uses Socket.IO for real-time communication and updates the displayed image every 5 minutes with a new, randomly generated prompt.

## Features

- Image generation using Replicate API.
- Real-time updates to all connected clients using Socket.IO.
- Periodic generation of images with dynamic prompts.
- Docker support for easy deployment and scalability.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (version 16 or later)
- NPM (Node Package Manager)
- Docker (optional, for containerization)
- Replicate API token

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/harperreed/art-gen-display
   cd art-gen-display
   ```

2. Install NPM packages:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Replicate API token:
   ```
   REPLICATE_API_TOKEN=your_api_token_here
   ```

4. Run the server (without Docker):
   ```sh
   node app.js
   ```

   Or with Docker:
   ```sh
   docker-compose up --build
   ```

5. Open a web browser and navigate to `http://localhost:8354` to view the application.

## Usage

The application will automatically generate and display a new image every 5 minutes. Each image is based on a unique combination of predefined keywords and styles.

## Docker Deployment

This project includes Docker support. To deploy using Docker, ensure you have Docker and Docker Compose installed, then use the `docker-compose up --build` command as mentioned in the installation steps.


## License

Distributed under the MIT License. See `LICENSE` for more information.
