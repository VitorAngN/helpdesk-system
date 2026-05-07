FROM node:20-alpine

# Definir o diretório de trabalho no container
WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instalar as dependências do projeto
RUN npm install

# Gerar o Prisma Client
RUN npx prisma generate

# Copiar o restante do código-fonte
COPY . .

# Construir a aplicação (Transpilar TypeScript)
RUN npm run build

# Expor a porta que o servidor Node escuta
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
