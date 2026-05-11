<h1 align="center">HelpDesk Enterprise - Sistema de Gest├úo de Atendimentos</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Conclu├¡do-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Linguagem-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Conteineriza├º├úo-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS_EC2-Deploy-FF9900?style=flat-square&logo=amazonaws&logoColor=white" alt="AWS EC2" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=flat-square&logo=github-actions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Linux-Infra-FCC624?style=flat-square&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
</p>

---

## Vis├úo Geral

Sistema de gest├úo de chamados. Destaque para a infraestrutura da aplica├º├úo, que foi totalmente conteinerizada com Docker e provisionada em ambiente Linux num servidor AWS EC2. Implementa├º├úo de pipeline de CI/CD via GitHub Actions para valida├º├úo automatizada de c├│digo.

Este projeto foi constru├¡do com foco em escalabilidade e manutenibilidade, utilizando TypeScript em ambas as camadas e orquestra├º├úo de containers para facilitar o provisionamento de infraestrutura.

---

## Diferenciais T├®cnicos e Engenharia

### Comunica├º├úo em Tempo Real (WebSockets)
Diferente de sistemas que dependem de requisi├º├Áes HTTP constantes (polling), este projeto utiliza **Socket.io**. Isso permite uma comunica├º├úo bidirecional de baixa lat├¬ncia, onde mensagens de chat e notifica├º├Áes globais s├úo entregues instantaneamente assim que ocorrem no servidor.

### Gest├úo de Arquivos e Persist├¬ncia
Implementa├º├úo de upload real de arquivos utilizando a biblioteca **Multer**. O sistema gerencia o ciclo de vida de anexos (PDFs e Imagens), tratando o armazenamento no servidor e vinculando os metadados ├ás mensagens do chat e aos protocolos de abertura de chamados.

### Indicadores de Performance (SLA e CSAT)
O sistema conta com um motor de analytics para administradores:
- **SLA (Service Level Agreement):** Monitoramento autom├ítico do tempo entre a abertura e o fechamento do ticket, calculando a efici├¬ncia m├®dia da equipe.
- **CSAT (Customer Satisfaction Score):** Sistema de avalia├º├úo p├│s-atendimento que permite medir o ├¡ndice de satisfa├º├úo do cliente final atrav├®s de m├®tricas quantitativas.

### Seguran├ºa e Governan├ºa
- **RBAC (Role-Based Access Control):** Controle de acesso baseado em cargos (Admin, Agente, Cliente), validado por middlewares de seguran├ºa no Backend.
- **Autentica├º├úo JWT:** Implementa├º├úo de tokens de curta dura├º├úo para sess├Áes seguras, com senhas criptografadas via Bcrypt.
- **Auditoria:** Logs detalhados de a├º├Áes administrativas para rastreabilidade de eventos cr├¡ticos.

---

## Stack Tecnol├│gica

### Infraestrutura & DevOps
- **Conteineriza├º├úo:** Docker com Docker Compose para orquestra├º├úo de servi├ºos (Frontend, Backend, MySQL)
- **Cloud:** AWS EC2 (Ubuntu 24.04 LTS) para provisionamento do ambiente de produ├º├úo
- **CI/CD:** GitHub Actions com pipeline automatizado de valida├º├úo, lint e build
- **Servidor Web:** Nginx (Alpine) servindo o frontend via Multi-stage Build

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js com TypeScript
- **Banco de Dados:** MySQL 8.0
- **ORM:** Prisma (Object-Relational Mapping)
- **Protocolos:** Socket.io para WebSockets e Multer para Multipart/Form-Data

### Frontend
- **Biblioteca:** React 18 com Vite
- **Gerenciamento de Estado:** Context API para autentica├º├úo global e persist├¬ncia de sess├úo.
- **Estiliza├º├úo:** CSS Moderno (Vanilla) focado em performance e responsividade.
- **├ìcones e UI:** Lucide React para elementos visuais consistentes.

---

## Arquitetura do Projeto

```text
helpdesk-system/
Ôö£ÔöÇÔöÇ .github/
Ôöé   ÔööÔöÇÔöÇ workflows/
Ôöé       ÔööÔöÇÔöÇ ci.yml              # Pipeline CI/CD (GitHub Actions)
Ôö£ÔöÇÔöÇ backend/
Ôöé   Ôö£ÔöÇÔöÇ prisma/                 # Modelagem de dados e Migrations
Ôöé   Ôö£ÔöÇÔöÇ src/                    # L├│gica de neg├│cio, Rotas e Socket Server
Ôöé   Ôö£ÔöÇÔöÇ uploads/                # Armazenamento f├¡sico de anexos
Ôöé   Ôö£ÔöÇÔöÇ Dockerfile              # Imagem Docker do Backend (Node.js Alpine)
Ôöé   ÔööÔöÇÔöÇ package.json
Ôö£ÔöÇÔöÇ frontend/
Ôöé   Ôö£ÔöÇÔöÇ src/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ components/         # Componentes reutiliz├íveis (Layout, StatusBadge, Header)
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ pages/              # Fluxos de visualiza├º├úo (Dashboard, Chat, Analytics)
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ services/           # Integra├º├úo com API (Axios e Socket Client)
Ôöé   Ôöé   ÔööÔöÇÔöÇ contexts/           # Gerenciamento de estado de autentica├º├úo
Ôöé   ÔööÔöÇÔöÇ Dockerfile              # Imagem Docker do Frontend (Multi-stage + Nginx)
ÔööÔöÇÔöÇ docker-compose.yml          # Orquestra├º├úo dos servi├ºos (Frontend, Backend, MySQL)
```

---

## Instru├º├Áes de Instala├º├úo e Execu├º├úo

### Op├º├úo 1: Via Docker Compose (Recomendado)

A infraestrutura completa da aplica├º├úo foi desenhada para subir com um ├║nico comando.

1. Instale o Docker e o Docker Compose.
2. Na raiz do reposit├│rio, rode o comando:
   ```bash
   docker-compose up -d --build
   ```
3. Acesse a aplica├º├úo:
   - **Frontend:** http://localhost
   - **Backend API:** http://localhost:3000

---

### Op├º├úo 2: Desenvolvimento Local (Manual)

#### Pr├®-requisitos
- Node.js instalado
- Inst├óncia do MySQL rodando localmente

#### Configura├º├úo do Backend
1. Navegue at├® a pasta: `cd backend`
2. Instale as depend├¬ncias: `npm install`
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
5. Inicie o servidor: `npm run dev` (Porta padr├úo: 3000)

#### Configura├º├úo do Frontend
1. Navegue at├® a pasta: `cd frontend`
2. Instale as depend├¬ncias: `npm install`
3. Inicie a aplica├º├úo: `npm run dev` (Porta padr├úo: 5173)

---

## Demonstra├º├úo Visual

Abaixo voc├¬ confere o sistema em funcionamento, dividido pelos n├¡veis de acesso da plataforma:

### Autentica├º├úo e Registro
| Login | Cadastro |
| :---: | :---: |
| <img src="docs/login.png" width="400"/> | <img src="docs/register.png" width="400"/> |

### Vis├úo do Cliente (Abertura e Acompanhamento)
| Dashboard do Cliente | Novo Chamado |
| :---: | :---: |
| <img src="docs/client-dashboard.png" width="400"/> | <img src="docs/new-ticket.png" width="400"/> |

| Chat em Tempo Real (Cliente) | Hist├│rico de Protocolos |
| :---: | :---: |
| <img src="docs/client-chat.png" width="400"/> | <img src="docs/client-history.png" width="400"/> |

### Vis├úo do Agente (Atendimento Operacional)
| Dashboard do Agente | Hist├│rico do Agente |
| :---: | :---: |
| <img src="docs/agent-dashboard.png" width="400"/> | <img src="docs/agent-history.png" width="400"/> |

**Chat de Atendimento:**
<img src="docs/agent-chat.png" width="800"/>

### Vis├úo do Administrador (Gest├úo Enterprise)
**Dashboard Anal├¡tico (SLA e CSAT):**
<img src="docs/admin-dashboard.png" width="800"/>

| Gest├úo de Usu├írios | Gest├úo de Empresas |
| :---: | :---: |
| <img src="docs/admin-create-user.png" width="400"/> | <img src="docs/admin-create-company.png" width="400"/> |

**Configura├º├Áes do Sistema:**
<img src="docs/admin-configs.png" width="800"/>
<img src="https://komarev.com/ghpvc/?username=VitorAngN-helpdesk-system" width="1" height="1" alt="" />
