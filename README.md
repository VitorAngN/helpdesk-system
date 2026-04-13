<h1 align="center">🛠️ Sistema de Helpdesk e Gestão de Chamados de TI</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

> [!WARNING]
> **Aviso de Fase de Desenvolvimento:**
> Este projeto encontra-se em desenvolvimento ativo. O backend foi reescrito do zero utilizando **Node.js + Express + Prisma v6 + JWT**. Muitas funcionalidades já estão implementadas e funcionais, mas o frontend ainda está a iniciar.

## 📌 Sobre o Projeto

Este projeto é um **Sistema de Helpdesk Corporativo** projetado para resolver problemas reais de comunicação entre usuários e suporte de TI. Ele permite que colaboradores abram chamados relatando problemas e que técnicos de suporte gerenciem, assumam e resolvam esses tickets através de um fluxo de trabalho estruturado e seguro.

---

## 🎯 Funcionalidades Implementadas

### 🔐 Autenticação e Autorização (JWT)
- [x] **Cadastro de usuário** com senha criptografada via `bcrypt`
- [x] **Login seguro** com JWT — `POST /api/auth/login`
- [x] **Middleware de autenticação** (`verificarToken`) — protege todas as rotas
- [x] **Middleware de autorização** por perfil:
  - [x] `apenasAdmin` — restringe rotas críticas ao administrador
  - [x] `apenasAgente` — restringe rotas operacionais a agentes e admins
- [x] **Perfil Cliente**: Abre chamados, vê **apenas os próprios** chamados e mensagens
- [x] **Perfil Agente**: Acessa dashboard, muda status, responde chat, atualiza disponibilidade
- [x] **Perfil Admin**: Acesso total — gerencia empresas, agentes, usuários e chamados

### 🎫 Gestão de Chamados (CRUD completo)
- [x] Criação de chamados — protocolo gerado automaticamente no formato `HD-YYYY-NNNNN` (RN-07)
- [x] Listagem filtrada por perfil — cliente só vê os próprios (RN-09)
- [x] Atualização completa (`PUT`) e parcial de status (`PATCH /api/chamados/:id/status`)
- [x] Deleção de chamados (restrita a admin)

### 💬 Chat de Mensagens
- [x] Mensagens vinculadas ao chamado — `POST /api/chamados/:id/mensagens`
- [x] Listagem em ordem cronológica — `GET /api/chamados/:id/mensagens`

### 🔔 Notificações
- [x] Criação de notificações por agentes/admin
- [x] Listagem filtrada — cada usuário vê **apenas as próprias** notificações
- [x] Marcar como lida — `PATCH /api/notificacoes/:id/lida`

### 🏢 Empresas e Agentes
- [x] CRUD completo de empresas (restrito a admin)
- [x] CRUD completo de agentes — atualização de disponibilidade via `PATCH`

---

## 💻 Tecnologias e Arquitetura

| Camada | Tecnologia |
|---|---|
| **Runtime** | Node.js v24 |
| **Linguagem** | TypeScript |
| **Framework** | Express.js v5 |
| **ORM** | Prisma v6 (estável) |
| **Banco de Dados** | MySQL 8 |
| **Autenticação** | JWT + bcrypt |
| **Frontend** | React.js *(a iniciar)* |

---

## 📁 Estrutura do Workspace

```text
helpdesk-system/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma     # Models: Usuario, Empresa, Agente, Chamado, Chat_Mensagem, Notificacao
│   ├── src/
│   │   └── server.ts         # Servidor Express com todas as rotas e middlewares
│   ├── .env                  # Variáveis de ambiente (não versionado)
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── database.sql          # Script SQL de referência
├── docs/                     # Documentação e contrato da API
└── frontend/                 # (a iniciar)
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js v18+
- MySQL 8 rodando localmente

### Passos

```bash
# 1. Entre na pasta do backend
cd backend

# 2. Instale as dependências
npm install

# 3. Configure o .env com sua string de conexão MySQL
# DATABASE_URL="mysql://root:SUASENHA@localhost:3306/helpdesk_system"
# JWT_SECRET="sua_chave_secreta"

# 4. Gere o Prisma Client
npx prisma generate

# 5. Sincronize o schema com o banco
npx prisma db push

# 6. Suba o servidor em modo desenvolvimento
npm run dev
```

O servidor estará acessível em `http://localhost:3000`.

---

## 📚 Rotas Disponíveis

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Login — retorna JWT |
| `POST` | `/api/usuarios` | Público | Cadastro de novo usuário |
| `GET` | `/api/usuarios` | Admin | Lista todos os usuários |
| `POST` | `/api/chamados` | Autenticado | Abre novo chamado |
| `GET` | `/api/chamados` | Autenticado | Lista chamados (filtrado por perfil) |
| `PATCH` | `/api/chamados/:id/status` | Agente/Admin | Atualiza status do chamado |
| `POST` | `/api/chamados/:id/mensagens` | Autenticado | Envia mensagem no chamado |
| `GET` | `/api/chamados/:id/mensagens` | Autenticado | Lista mensagens do chamado |
| `GET` | `/api/notificacoes` | Autenticado | Lista notificações do usuário logado |
| `PATCH` | `/api/notificacoes/:id/lida` | Autenticado | Marca notificação como lida |
| `POST` | `/api/empresas` | Admin | Cadastra empresa |
| `PATCH` | `/api/agentes/:id/disponibilidade` | Agente/Admin | Atualiza disponibilidade |
