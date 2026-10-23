# ====================================================================
# DOCKERFILE FOR EXPENSE TRACKER FRONTEND (REACT + VITE + TAILWIND)
# Giai đoạn 1: Biên dịch bundle tối ưu hóa (Multi-stage build)
# Giai đoạn 2: Phục vụ qua Nginx Alpine siêu nhẹ & bảo mật
# Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
# ====================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy kết quả build từ builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx tối ưu phục vụ Single Page App (SPA)
RUN printf 'server {\n\
    listen 3000;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
