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

# Expor a porta que o servidor Node escuta
EXPOSE 3000

# Sincroniza o schema Prisma com o MySQL antes de iniciar o servidor
CMD ["sh", "-c", "until npx prisma db push; do echo 'Aguardando banco de dados...'; sleep 5; done; npx tsx src/server.ts"]
