FROM oven/bun:1 AS build
WORKDIR /app

ENV NITRO_PRESET=node-server

ARG VITE_API_BASE_URL="http://bharatbot-backend-alb-439988424.us-east-1.elb.amazonaws.com/api"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json ./
RUN bun install
RUN node /app/node_modules/esbuild/install.js

COPY . .
RUN bun run build

FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]