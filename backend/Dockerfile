# ---------- Etapa 1: build (compila TypeScript e gera o Prisma Client) ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# ---------- Etapa 2: produção (só dependências de runtime + JS compilado) ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY --from=build /app/dist ./dist

# Roda sem privilégios de root
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Sincroniza o schema com o MySQL e inicia a API compilada
CMD ["sh", "-c", "until npx prisma db push --skip-generate; do echo 'Aguardando banco de dados...'; sleep 5; done; node dist/server.js"]
