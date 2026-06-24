# Step 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json bun.lock package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Production environment using Nginx
FROM nginx:alpine
# Vite/React ka build output dist folder mein aata hai
COPY --from=build /app/dist /usr/share/nginx/html

# SPA Routing dashboard support ke liye Nginx config replace karo
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
