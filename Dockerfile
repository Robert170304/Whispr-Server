FROM ubuntu:22.04

# Install required tools
RUN apt-get update && \
    apt-get install -y build-essential cmake git curl

# Set working directory
WORKDIR /app

# Copy everything including whisper.cpp
COPY . .

# Download the correct model file
# Adjust the URL if you need a different model
RUN curl -L -o /app/whisper.cpp/models/ggml-tiny.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/models/ggml-tiny.en.bin

# Build whisper.cpp
WORKDIR /app/whisper.cpp
RUN make VERBOSE=1 && find . -type f -print

# Back to root for your app
WORKDIR /app

# Install Node deps (if you're using Node.js)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install NPM deps
RUN npm install

# Start your server
CMD ["node", "server.js"]
