<h1 align="center">Sistema de Helpdesk e Gestão de Atendimentos</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Finalizado-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

> [!NOTE]  
> **Arquitetura Full-Stack Completada:**  
> Este projeto foi concebido e finalizado como um MVP de um **Sistema de Helpdesk Corporativo**, contando com as duas pontas da tecnologia: API Relacional blindada com JWT no lado do Backend, e Interface de Usuário (*SPA*) construída do absoluto zero com React e Vite usando práticas profundas de UX/UI.

---

## Sobre o Projeto

O **HelpDesk** é uma plataforma que otimiza a ponte entre clientes e a área de suporte especializado. Através deste painel, é possível registrar chamados (abrir tickets), monitorar em tempo real a evolução destes pedidos de suporte, e estabelecer uma conversa assíncrona — estilo chat — com o Analista/Agente designado. O sistema foi lapidado para entregar uma experiência premium, contando com painéis segmentados baseados no cargo de quem fez o Login.

---

## Interface do Sistema

### Acesso ao Sistema (Login e Cadastro)
![Tela de Login](docs/login.png)
![Tela de Cadastro](docs/register.png)

### Experiência do Cliente
![Dashboard do Cliente](docs/client-dashboard.png)
![Histórico de Chamados](docs/client-history.png)
![Chat de Atendimento](docs/client-chat.png)

### Painel do Agente (Suporte)
![Dashboard do Agente](docs/agent-dashboard.png)
![Gerenciamento de Chamados](docs/agent-history.png)
![Interface de Chat do Agente](docs/agent-chat.png)

### Gestão Administrativa (Admin)
![Dashboard do Admin](docs/admin-dashboard.png)
![Gerenciamento de Empresas](docs/admin-companies.png)
![Cadastro de Empresa](docs/admin-create-company.png)
![Cadastro de Usuários e Perfis](docs/admin-create-user.png)

### Abertura de Novo Chamado
![Novo Chamado](docs/new-ticket.png)

---

## Funcionalidades Implementadas

### Segurança e Autenticação (JWT)
- **Login Seguro & Rotas Protegidas:** Middlewares de Frontend e Backend verificam a assinatura de Tokens JWT para impedir manipulações. Senhas são salvas usando criptografia Hash (`bcrypt`).
- **Roteamento Controlado por Níveis:** Três esferas de acesso (`Cliente`, `Agente`, `Admin`) com bloqueios totais em tela que previnem vazamento de escopo.

### Experiências por Nível de Acesso
- **Visão Cliente:** Possui um Dashboard amigável para acompanhar contatos abertos e visualizar seus protocolos e interagir no Chat do Suporte.
- **Visão Agente:** Acessa uma Dashboard analítica, recebe as filas de atendimento do sistema de modo simultâneo, podendo alterar Status de chamados (Resolvido, Cancelado) e notificar o usuário. 
- **Visão Admin:** Concentração e Governança de todo o Sistema. Painel para cadastro dinâmico de novas Empresas (B2B), Gestão total de Usuários/Agentes, além de visão integral aos dados do servidor.

### Experiência de Chat "WhatsApp Style"
A tela chave da ferramenta (o Contato Técnico) foi desenhada no modelo *Split Layout*. Do lado esquerdo a Sidebar de listagem de contatos filtráveis, do lado direito a bolha de interações baseada em mensagens instatâneas gravadas no MySQL.

### Notificações Ativas
O Cabeçalho (Header) principal varre ativamente eventos do usuário e apresenta "Badges" visuais informando Novas Respostas ou Atualizações no Status dos chamados, podendo ser limpas após leitura.

### Controle Histórico (Auditoria)
Todos os encerramentos de chamado não exluem dados, arquivam. Uma robusta rota em base de Tabela Genérica foi criada (`/historico`) para pesquisa massiva através de um filtro de Protocolos ou Assuntos em todo banco.

---

## Tecnologias da Estiva

### Camada Backend (API Rest API)
- **Node.js** v24 com **Express.js** 
- **Linguagem:** TypeScript Rigoroso
- **ORM:** Prisma v6
- **Banco de Dados:** MySQL 8 
- **Segurança:** Autenticação por JWT (JSON Web Tokens)

### Camada Frontend (Web Interface)
- **Framework:** React 18 (Vite Bundler)
- **Linguagem:** TypeScript
- **Estilização UI:** Vanilla CSS Moderno (Glassmorphism, Flexbox, UI Dark Mode Centrada)
- **Roteamento:** React Router Dom v7 
- **Acessibilidade:** Lucide-React (Ícones)

---

## Arquitetura do Workspace

```text
helpdesk-system/
├── backend/
│   ├── prisma/             # Schema, Relacionamentos e Definição das Tabelas
│   ├── src/                # Controladores Express, Roteamento e Inicialização Server
│   ├── .env                # Credenciais Locais DB (Cuidado)
│   ├── package.json
│   └── tsconfig.json
├── database/               # Relacionamentos Modelados / Arquivos Origem
└── frontend/
    ├── public/
    └── src/
        ├── components/     # Layout.tsx, Header.tsx, StatusBadge.tsx
        ├── pages/          # 3 Fluxos de Telas: Cliente, Admin, Agente, Login, Historico...
        ├── services/       # axios / api.ts e fetcher handlers
        ├── contexts/       # AuthContext (Persistência global de sessão Storage/JWT)
        └── App.tsx         # Roteador Local
```

---

## Como Rodar e Testar na sua Máquina

### Iniciando o Servidor (Backend)
1. Instale o **Node.js v18+** e garanta que o seu Servidor MySQL Local (`localhost:3306`) esteja rodando na sua máquina.
2. Acesse a parta do servidor: `cd backend`
3. Instale os módulos: `npm install`
4. Crie um arquivo oculto chamando `.env` na pasta `backend/` e injete sua string:
   ```env
   DATABASE_URL="mysql://root:SUASENHA@localhost:3306/helpdesk_system"
   JWT_SECRET="sua_chave_secreta"
   ```
5. Inicie a base de Dados e as Tabelas do Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. Inicialize o cérebro: `npm run dev` 
*(A Api passará a servir na rota http://localhost:3000)*

### Inicializando as Telas (Frontend React)
1. Abra um terminal separado e acesse o cliente pela raiz: `cd frontend`
2. Instale as dependências visuais: `npm install`
3. Inicie a compilação local pelo vite: `npm run dev`
*(A aplicação vai pular na sua tela no seu localhost:5173 e você já pode criar contas novas na tela de Cadastro e testar).*
