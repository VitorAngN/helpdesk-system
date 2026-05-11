# Sistema Corporativo de Helpdesk e Gestão de Chamados

<p>
  <img src="https://img.shields.io/badge/Status-Concluído-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white" alt="AWS" />
</p>

API REST de nível corporativo para gerenciamento do ciclo de vida completo de chamados de suporte, do ticket aberto até o encerramento com métricas de SLA e CSAT.

---

## Funcionalidades

- **Autenticação JWT + Bcrypt** com controle de acesso por perfil (RBAC)
- **Mais de 20 endpoints REST** cobrindo criação, atribuição, atualização e encerramento de tickets
- **Comunicação em tempo real** com Socket.io para notificações instantâneas de tickets
- **Upload de anexos** via Multer (imagens, PDFs, logs)
- **Logs de auditoria** de todas as ações por usuário e timestamp
- **Métricas de SLA e CSAT** por agente e por período

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22+, TypeScript |
| Framework | Express.js |
| Banco de Dados | MySQL 8, Prisma ORM |
| Tempo Real | Socket.io |
| Upload | Multer |
| Auth | JWT, Bcrypt |
| Infra | Docker, Docker Compose, GitHub Actions, AWS EC2 |

---

## Infra e CI/CD

A aplicação é **totalmente conteinerizada** com Docker e Docker Compose, separando o serviço Node.js do banco MySQL em redes isoladas.

O repositório possui um **pipeline de CI com GitHub Actions** que executa a validação de build e lint automaticamente a cada `push` na branch principal.

O deploy foi validado em um servidor **Linux Ubuntu na AWS EC2**, com configuração manual de variáveis de ambiente e execução dos contêineres via Docker Compose.

---

## Como Executar

Você precisa do **Docker** e do **Docker Compose** instalados.

```bash
# 1. Clonar o repositório
git clone https://github.com/VitorAngN/helpdesk-system.git
cd helpdesk-system

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Subir os serviços
docker compose up -d

# 4. Rodar as migrations
npx prisma migrate deploy
```

A API estará disponível em `http://localhost:3000`.

---

## Estrutura de Pastas

```
helpdesk-system/
├── src/
│   ├── controllers/   # Lógica de negócio por recurso
│   ├── middlewares/   # Autenticação JWT e controle de acesso
│   ├── routes/        # Mapeamento de endpoints
│   ├── services/      # Regras de SLA, métricas e notificações
│   └── server.ts      # Inicialização da aplicação e Socket.io
├── prisma/
│   └── schema.prisma  # Modelagem relacional dos dados
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ # Pipeline de CI
```

<img src="https://komarev.com/ghpvc/?username=VitorAngN-helpdesk-system" width="1" height="1" alt="" />
