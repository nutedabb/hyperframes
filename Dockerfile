FROM node:22-bullseye

# Install FFmpeg and system dependencies required for headless browser video recording
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies inside the container environment
COPY package*.json ./
RUN npm install

# Copy all engine code from your fork
COPY . .

EXPOSE 3000

# Tell Render to run the web API bridge instead of standard CLI execution
CMD ["node", "server.js"]
