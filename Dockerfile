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

# 1. Copy ALL files first so npm can find the internal workspace folders
COPY . .

# 2. Run npm install against the complete monorepo layout
RUN npm install

EXPOSE 3000

# Tell Render to run the web API bridge
CMD ["node", "server.js"]
