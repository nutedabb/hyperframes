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

# Install Bun (The native package manager used by the HyperFrames engine)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy all repository files into the working directory
COPY . .

# Run bun install to properly resolve the workspace modules
RUN bun install

EXPOSE 3000

# Start the Express server bridge
CMD ["node", "server.cjs"]
