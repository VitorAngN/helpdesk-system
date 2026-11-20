# Estágio 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Argumento de build para a URL da API
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar o código fonte e realizar o build
COPY . .
RUN npm run build

# Estágio 2: Nginx para servir arquivos estáticos
FROM nginx:alpine

# Copiar os arquivos gerados no estágio de build para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta padrao do Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
