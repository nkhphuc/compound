FROM node:22.6.0-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@10.12.1

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22.6.0-alpine
WORKDIR /app

RUN npm install -g pnpm@10.12.1

# Install netcat for database connection check
RUN apk add --no-cache netcat-openbsd

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/start.sh ./start.sh

# Ensure start.sh has execute permissions and is properly formatted
RUN chmod +x start.sh && \
    dos2unix start.sh 2>/dev/null || true && \
    ls -la start.sh

USER 1000

EXPOSE 3002
ENV PORT=3002

CMD ["./start.sh"]
