# Stage 1: Build
FROM --platform=linux/arm64 node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Serve
FROM --platform=linux/arm64 nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing if needed
RUN echo "server { \
    listen 6500; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files \$uri \$uri/ /index.html; \
    } \
    location = /index.html { \
        root /usr/share/nginx/html; \
        add_header Cache-Control 'no-store, no-cache, must-revalidate'; \
    } \
    location /downloads/ { \
        alias /usr/share/nginx/downloads/; \
        autoindex on; \
    } \
    location /api/ { \
        proxy_pass http://relay:8080; \
    } \
}" > /etc/nginx/conf.d/default.conf
EXPOSE 6500
CMD ["nginx", "-g", "daemon off;"]
