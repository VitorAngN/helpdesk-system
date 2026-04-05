<h1 align="center">🛠️ Sistema de Helpdesk e Gestão de Chamados de TI</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

## 📌 Sobre o Projeto

Este projeto é um **Sistema de Helpdesk Corporativo** projetado para resolver problemas reais de comunicação entre usuários e suporte de TI. Ele permite que colaboradores abram chamados relatando problemas e que técnicos de suporte gerenciem, assumam e resolvam esses tickets através de um fluxo de trabalho estruturado e seguro.

---

## 🎯 Funcionalidades e Escopo (MVP)

Abaixo está o mapeamento do que já foi estruturado e do que será desenvolvido (Roadmap):

### 🔐 Autenticação e Perfis (Roles)
- [ ] **Login seguro** com JWT (JSON Web Tokens).
- [ ] **Perfil Colaborador**: Pode abrir chamados, ver o status dos próprios chamados e comentar.
- [ ] **Perfil Técnico**: Acesso ao Dashboard, assumir chamados, mudar status e fechar tickets.

### 🎫 Gestão de Chamados
- [ ] Criação e leitura de chamados de suporte.
- [ ] Atualização de status (Aberto, Em Andamento, Resolvido).
- [ ] Arquivamento lógico de tickets resolvidos.

### 📊 Dashboard Profissional
- [ ] Tela de entrada para o Suporte com gráficos simples (Ex: Volume de chamados abertos x resolvidos, chamados por Categoria).

---

## 💻 Tecnologias e Arquitetura

O sistema foi arquitetado utilizando padrões de mercado, separando o cliente da API para garantir escalabilidade:

* **Design e Fluxo:** Figma *(A fazer)*
* **Banco de Dados:** MySQL *(A modelar)*
* **Backend (API):** Node.js / Laravel *(A iniciar)*
* **Frontend:** React.js / Next.js com TailwindCSS *(A iniciar)*

---

## 📁 Estrutura do Workspace

O repositório já se encontra organizado para separar as responsabilidades do projeto:

```text
helpdesk-system/
├── backend/          # Código fonte da API (Regras de negócio e rotas)
├── database/         # Migrations e dados de configuração (SQL)
├── docs/             # Documentação em marcação e esquemas da arquitetura
└── frontend/         # Componentes visuais, páginas e consumo da API
```

---

## 🚀 Instruções de Uso

> 🚧 **Em Desenvolvimento**: As instruções para rodar a aplicação localmente (`npm install`, `npm run dev`, etc.) aparecerão aqui assim que inicializarmos as bases do código.

---

## 📚 Documentação da Integridade da API

> 🚧 **Em Desenvolvimento**: Em breve disponibilizaremos o Swagger/OpenAPI ou a coleção do Postman para verificar detalhes como rotas HTTP, formatos JSON esperados e retornos de erro da API.
