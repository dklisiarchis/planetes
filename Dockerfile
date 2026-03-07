# Stage 1: Build Rust WASM
FROM rust:1.82-slim AS wasm-builder

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /build
COPY nbody-wasm/ ./nbody-wasm/
RUN cd nbody-wasm && wasm-pack build --target web --release

# Stage 2: Node app
FROM node:22-slim

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and WASM build output
COPY . .
COPY --from=wasm-builder /build/nbody-wasm/pkg/ ./nbody-wasm/pkg/

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
