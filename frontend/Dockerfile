# Use Node.js 22.6.0 as specified in .tool-versions
FROM node:22.6.0-alpine AS build

# Install dependencies only when needed
FROM build AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@10.12.1
RUN pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM build AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm install -g pnpm@10.12.1
RUN pnpm build

# Production image, copy all the files and run nginx
FROM nginx:alpine

# Copy the built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
