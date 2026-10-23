# ====================================================================
# DOCKERFILE FOR EXPENSE TRACKER BACKEND (NODE.JS EXPRESS)
# HARDENING: Chạy dưới quyền người dùng không đặc quyền (non-root node)
# Sinh viên: Trần Mạnh Dũng | MSSV: DTC245160020
# ====================================================================

FROM node:20-alpine AS base

# Cài đặt thư viện cần thiết cho native modules nếu có
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Cài đặt production dependencies
RUN npm ci --omit=dev

# Copy toàn bộ mã nguồn
COPY . .

# 1. HARDENING: Phân quyền thư mục cho user 'node' và chuyển user non-root
RUN chown -R node:node /app
USER node

# Khai báo cổng dịch vụ
EXPOSE 5000

# Healthcheck nội bộ container
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
