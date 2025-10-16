FROM node:18-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate || true
CMD ["node", "-r", "dotenv/config", "src/index.js"]
