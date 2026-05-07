# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o código fonte e realizar o build
COPY . .
RUN npm run build

# Estágio 2: Nginx para servir arquivos estáticos
FROM nginx:alpine

# Copiar os arquivos gerados no estágio de build para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor a porta padrao do Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
