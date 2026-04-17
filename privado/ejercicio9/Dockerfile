# === Stage 1: Dependencias ===
FROM node:22-alpine AS deps
WORKDIR /app
# Instalar dependencias de compilación para Prisma
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

# Copiar el esquema y generar el cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Instalar solo producción
RUN npm prune --production

# === Stage 2: Producción ===
FROM node:22-alpine AS runner
WORKDIR /app

# Instalar solo lo necesario para ejecutar (OpenSSL es requerido por Prisma)
RUN apk add --no-cache openssl

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeapp

# Copiar archivos necesarios
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Cambiar permisos al usuario no-root
RUN chown -R nodeapp:nodejs /app
USER nodeapp

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]