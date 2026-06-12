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

# Enable Corepack and prepare pnpm (needed for HyperFrames workspace dependencies)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all engine files and monorepo structure
COPY . .

# Run pnpm install instead of npm install to support "workspace:" links
RUN pnpm install

EXPOSE 3000

# Tell Render to run the web API bridge
CMD ["node", "server.js"]
