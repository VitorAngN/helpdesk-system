<h1 align="center">Helpdesk Corporativo - Projeto Autoral de Gestão de Chamados</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Concluído-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Linguagem-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Conteinerização-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS_EC2-Deploy_validado-FF9900?style=flat-square&logo=amazonaws&logoColor=white" alt="AWS EC2" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI-2088FF?style=flat-square&logo=github-actions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Linux-Infra-FCC624?style=flat-square&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
</p>

---

## Visão Geral

Sistema de gestão de chamados para simular um fluxo real de suporte técnico. O projeto foi conteinerizado com Docker e validado em ambiente Linux em uma instância AWS EC2. Também conta com pipeline de CI via GitHub Actions para validação automatizada de código (lint, build e Docker build).

Este projeto foi construído com foco em organização, manutenção e execução reproduzível, utilizando TypeScript em ambas as camadas e Docker Compose para facilitar a inicialização do ambiente.

---

## Diferenciais Técnicos e Engenharia

### Comunicação em Tempo Real (WebSockets)
Diferente de sistemas que dependem de requisições HTTP constantes (polling), este projeto utiliza **Socket.io**. Isso permite uma comunicação bidirecional de baixa latência, onde mensagens de chat e notificações globais são entregues instantaneamente assim que ocorrem no servidor.

### Gestão de Arquivos e Persistência
Implementação de upload real de arquivos utilizando a biblioteca **Multer**. O sistema gerencia o ciclo de vida de anexos (PDFs e Imagens), tratando o armazenamento no servidor e vinculando os metadados às mensagens do chat e aos protocolos de abertura de chamados.

### Indicadores de Performance (SLA e CSAT)
O sistema conta com um motor de analytics para administradores:
- **SLA (Service Level Agreement):** Monitoramento automático do tempo entre a abertura e o fechamento do ticket, calculando a eficiência média da equipe.
- **CSAT (Customer Satisfaction Score):** Sistema de avaliação pós-atendimento que permite medir o índice de satisfação do cliente final através de métricas quantitativas.

### Segurança e Controle de Acesso
- **RBAC (Role-Based Access Control):** Controle de acesso baseado em cargos (Admin, Agente, Cliente), validado por middlewares de segurança no Backend.
- **Autenticação JWT:** Implementação de tokens de curta duração para sessões seguras, com senhas criptografadas via Bcrypt.
- **Auditoria:** Logs detalhados de ações administrativas para rastreabilidade de eventos críticos.

---

## Stack Tecnológica

### Infraestrutura & DevOps
- **Conteinerização:** Docker com Docker Compose para orquestração de serviços (Frontend, Backend, MySQL)
- **Cloud:** AWS EC2 (Ubuntu 24.04 LTS) para validação prática de deploy em ambiente Linux
- **CI:** GitHub Actions com pipeline automatizado (lint, type-check e Docker build) · deploy manual validado em AWS EC2
- **Servidor Web:** Nginx (Alpine) servindo o frontend via Multi-stage Build

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js com TypeScript
- **Banco de Dados:** MySQL 8.0
- **ORM:** Prisma (Object-Relational Mapping)
- **Protocolos:** Socket.io para WebSockets e Multer para Multipart/Form-Data

### Frontend
- **Biblioteca:** React 18 com Vite
- **Gerenciamento de Estado:** Context API para autenticação global e persistência de sessão.
- **Estilização:** CSS Moderno (Vanilla) focado em performance e responsividade.
- **Ícones e UI:** Lucide React para elementos visuais consistentes.

---

## Arquitetura do Projeto

```
helpdesk-system/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI (GitHub Actions)
├── backend/
│   ├── prisma/                 # Modelagem de dados e Migrations
│   ├── src/                    # Lógica de negócio, Rotas e Socket Server
│   ├── uploads/                # Armazenamento físico de anexos
│   ├── Dockerfile              # Imagem Docker do Backend (Node.js Alpine)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis (Layout, StatusBadge, Header)
│   │   ├── pages/              # Fluxos de visualização (Dashboard, Chat, Analytics)
│   │   ├── services/           # Integração com API (Axios e Socket Client)
│   │   └── contexts/           # Gerenciamento de estado de autenticação
│   └── Dockerfile              # Imagem Docker do Frontend (Multi-stage + Nginx)
└── docker-compose.yml          # Orquestração dos serviços (Frontend, Backend, MySQL)
```

---

## Instruções de Instalação e Execução

### Opção 1: Via Docker Compose (Recomendado)

A infraestrutura completa da aplicação foi desenhada para subir com um único comando.

1. Instale o Docker e o Docker Compose.
2. Na raiz do repositório, rode o comando:
   ```bash
   docker-compose up -d --build
   ```
3. Acesse a aplicação:
   - **Frontend:** http://localhost
   - **Backend API:** http://localhost:3000

---

### Opção 2: Desenvolvimento Local (Manual)

#### Pré-requisitos
- Node.js instalado
- Instância do MySQL rodando localmente

#### Configuração do Backend
1. Navegue até a pasta: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env`:
   ```env
   DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/helpdesk_system"
   JWT_SECRET="sua_chave_secreta"
   ```
4. Sincronize o Banco de Dados:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Inicie o servidor: `npm run dev` (Porta padrão: 3000)

#### Configuração do Frontend
1. Navegue até a pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie a aplicação: `npm run dev` (Porta padrão: 5173)

---

## Demonstração Visual

Abaixo você confere o sistema em funcionamento, dividido pelos níveis de acesso da plataforma:

### Autenticação e Registro
| Login | Cadastro |
| :---: | :---: |
| <img src="docs/login.png" width="400"/> | <img src="docs/register.png" width="400"/> |

### Visão do Cliente (Abertura e Acompanhamento)
| Dashboard do Cliente | Novo Chamado |
| :---: | :---: |
| <img src="docs/client-dashboard.png" width="400"/> | <img src="docs/new-ticket.png" width="400"/> |

| Chat em Tempo Real (Cliente) | Histórico de Protocolos |
| :---: | :---: |
| <img src="docs/client-chat.png" width="400"/> | <img src="docs/client-history.png" width="400"/> |

### Visão do Agente (Atendimento Operacional)
| Dashboard do Agente | Histórico do Agente |
| :---: | :---: |
| <img src="docs/agent-dashboard.png" width="400"/> | <img src="docs/agent-history.png" width="400"/> |

**Chat de Atendimento:**
<img src="docs/agent-chat.png" width="800"/>

### Visão do Administrador (Gestão do Sistema)
**Dashboard Analítico (SLA e CSAT):**
<img src="docs/admin-dashboard.png" width="800"/>

| Gestão de Usuários | Gestão de Empresas |
| :---: | :---: |
| <img src="docs/admin-create-user.png" width="400"/> | <img src="docs/admin-create-company.png" width="400"/> |

**Configurações do Sistema:**
<img src="docs/admin-configs.png" width="800"/>

### Validação em AWS EC2
**Acesso via SSH e monitoramento do servidor:**
<img src="docs/Terminal%20na%20AWS.png" width="800"/>

<img src="https://komarev.com/ghpvc/?username=VitorAngN-helpdesk-system" width="1" height="1" alt="" />
