# Regras de Negócio — HelpDesk Project

> **Versão:** 1.0.0  
> **Autor:** João Vitor Angelim Nogueira  
> **Data:** Abril de 2026  
> **Status:** Em desenvolvimento

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Perfis de Usuário](#2-perfis-de-usuário)
3. [Regras de Negócio por Módulo](#3-regras-de-negócio-por-módulo)
4. [Modelagem do Banco de Dados](#4-modelagem-do-banco-de-dados)
5. [Relacionamentos entre Tabelas](#5-relacionamentos-entre-tabelas)
6. [Scripts SQL de Criação](#6-scripts-sql-de-criação)
7. [Regras de Integridade e Restrições](#7-regras-de-integridade-e-restrições)
8. [Glossário](#8-glossário)

---

## 1. Visão Geral do Sistema

O **HelpDesk Project** é uma plataforma SaaS de suporte técnico multiempresa. Ela conecta clientes que precisam de suporte com agentes técnicos responsáveis pelo atendimento, sob supervisão de um administrador central que gerencia toda a plataforma.

### Fluxo principal

```
Cliente abre chamado → Agente recebe e atende → Admin monitora e gera relatórios
```

O sistema é composto por três ambientes distintos, cada um acessível por um perfil de usuário diferente, com rotas, interfaces e permissões separadas.

---

## 2. Perfis de Usuário

### 2.1 Cliente
- Pessoa física ou colaborador de uma empresa cadastrada na plataforma.
- Acessa o sistema via login com e-mail e senha.
- Pode abrir chamados de suporte, visualizar seus chamados em aberto, cancelar chamados e acessar o histórico de atendimentos.
- Só visualiza chamados associados ao seu próprio usuário — nunca chamados de outros clientes.
- Recebe notificações de novas mensagens e atualizações de status dos seus chamados.

### 2.2 Agente (Técnico de Suporte)
- Colaborador interno responsável pelo atendimento dos chamados.
- Acessa o sistema por uma rota de login separada da do cliente.
- Visualiza apenas os chamados atribuídos a ele.
- Pode iniciar atendimento, trocar mensagens com o cliente via chat e concluir chamados.
- Possui status de disponibilidade (disponível / indisponível) que pode ser alterado manualmente ou atualizado automaticamente via login/logout.
- Está vinculado a uma empresa cadastrada no sistema.

### 2.3 Administrador
- Dono da plataforma. Não resolve chamados de TI.
- Acessa um painel administrativo exclusivo.
- Cadastra e gerencia empresas clientes da plataforma (ativar, desativar, editar).
- Cadastra e gerencia agentes vinculados a cada empresa.
- Visualiza relatórios consolidados de uso, volume de chamados e métricas de atendimento.
- Configura regras globais do sistema.
- Possui o maior nível de acesso — suas rotas são protegidas por perfil `admin` no token JWT.

---

## 3. Regras de Negócio por Módulo

### 3.1 Autenticação

| Regra | Descrição |
|---|---|
| RN-01 | Todos os perfis se autenticam com e-mail e senha. |
| RN-02 | A senha nunca é armazenada em texto puro — sempre como hash bcrypt. |
| RN-03 | O sistema retorna um token JWT contendo o `idUsuario` e o `nivelAcesso`. |
| RN-04 | O token JWT é obrigatório em todas as rotas protegidas, enviado no header `Authorization: Bearer <token>`. |
| RN-05 | Um cliente não pode acessar rotas do agente, e vice-versa. O perfil é validado via middleware. |
| RN-06 | Tentativa de acesso com token inválido ou perfil incorreto retorna HTTP 403. |

### 3.2 Chamados

| Regra | Descrição |
|---|---|
| RN-07 | Todo chamado possui um número de protocolo único gerado automaticamente no formato `HD-YYYY-NNNNN` (ex: HD-2026-00001). |
| RN-08 | Um chamado é sempre criado com status `aberto`. |
| RN-09 | Os status possíveis de um chamado são: `aberto`, `em_atendimento`, `aguardando_cliente`, `concluido`, `cancelado`. |
| RN-10 | O cliente pode cancelar apenas chamados com status `aberto` ou `aguardando_cliente`. |
| RN-11 | Somente o agente atribuído pode alterar o status do chamado para `em_atendimento`, `aguardando_cliente` ou `concluido`. |
| RN-12 | Um chamado pode ter no máximo um arquivo anexo no momento da abertura. |
| RN-13 | Arquivos anexos não são armazenados no banco de dados — apenas o caminho do arquivo no servidor de storage é salvo. |
| RN-14 | Chamados concluídos ou cancelados ficam acessíveis somente como histórico — o cliente não pode reabri-los. |

### 3.3 Chat

| Regra | Descrição |
|---|---|
| RN-15 | O chat de um chamado só está ativo enquanto o status for `aberto`, `em_atendimento` ou `aguardando_cliente`. |
| RN-16 | Chamados com status `concluido` ou `cancelado` bloqueiam o envio de novas mensagens. |
| RN-17 | Uma mensagem pode conter texto, um arquivo ou ambos — mas não pode ser completamente vazia. |
| RN-18 | Arquivos enviados no chat também são armazenados apenas como caminho no banco. |
| RN-19 | O sistema registra se cada mensagem foi lida pelo destinatário (campo `lida`). |

### 3.4 Disponibilidade do Agente

| Regra | Descrição |
|---|---|
| RN-20 | O agente pode alterar manualmente seu status entre `disponível` e `indisponível`. |
| RN-21 | Ao fazer login, o status do agente é automaticamente definido como `disponível`. |
| RN-22 | Ao fazer logout, o status é automaticamente definido como `indisponível`. |
| RN-23 | Agentes indisponíveis não recebem novos chamados automaticamente. |

### 3.5 Gerenciamento pelo Administrador

| Regra | Descrição |
|---|---|
| RN-24 | O administrador pode cadastrar empresas com nome, CNPJ e e-mail. |
| RN-25 | Empresas desativadas pelo admin não podem ter novos chamados abertos. |
| RN-26 | O admin pode cadastrar agentes e vinculá-los a uma empresa. |
| RN-27 | Agentes desativados não conseguem fazer login. |
| RN-28 | O admin visualiza relatórios de volume de chamados, tempo médio de atendimento e disponibilidade dos agentes por empresa. |

---

## 4. Modelagem do Banco de Dados

**SGBD:** MySQL 8+  
**Engine:** InnoDB (suporte a transações e foreign keys)  
**Charset:** utf8mb4 (suporte completo a Unicode e emojis)

### Tabelas

| Tabela | Descrição |
|---|---|
| `usuarios` | Armazena todos os usuários do sistema (clientes, agentes e admin). |
| `empresas` | Armazena as empresas clientes cadastradas na plataforma. |
| `agentes` | Perfil estendido de usuários com papel de agente (disponibilidade, cargo, empresa). |
| `chamados` | Registra todos os chamados de suporte abertos pelos clientes. |
| `chat_mensagens` | Armazena o histórico de mensagens trocadas em cada chamado. |
| `notificacoes` | Armazena notificações geradas por eventos do sistema para cada usuário. |

---

## 5. Relacionamentos entre Tabelas

```
empresas (1) ──────< (N) agentes
usuarios (1) ───────────< (1) agentes
usuarios (1) ──────< (N) chamados          [como cliente]
agentes  (1) ──────< (N) chamados          [como responsável]
empresas (1) ──────< (N) chamados
chamados (1) ──────< (N) chat_mensagens
usuarios (1) ──────< (N) chat_mensagens    [como remetente]
usuarios (1) ──────< (N) notificacoes
chamados (1) ──────< (N) notificacoes
```

---

## 6. Scripts SQL de Criação

> ⚠️ Executar na ordem abaixo para respeitar as dependências entre as foreign keys.

### 6.1 Tabela `usuarios`

```sql
CREATE TABLE usuarios (
  idUsuario    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(100)    NOT NULL,
  email        VARCHAR(100)    NOT NULL,
  senha        VARCHAR(255)    NOT NULL,  -- hash bcrypt, nunca texto puro
  nivelAcesso  ENUM('cliente', 'agente', 'admin') NOT NULL,
  createdAt    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (idUsuario),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.2 Tabela `empresas`

```sql
CREATE TABLE empresas (
  idEmpresa  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(150)  NOT NULL,
  cnpj       VARCHAR(18)       NULL,  -- formato: XX.XXX.XXX/XXXX-XX
  email      VARCHAR(100)      NULL,
  ativo      TINYINT(1)    NOT NULL DEFAULT 1,
  createdAt  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (idEmpresa),
  UNIQUE KEY uq_empresas_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.3 Tabela `agentes`

```sql
CREATE TABLE agentes (
  idAgente    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idUsuario   INT UNSIGNED  NOT NULL,
  idEmpresa   INT UNSIGNED      NULL,
  cargo       VARCHAR(50)   NOT NULL DEFAULT 'agente',  -- 'agente' ou 'supervisor'
  disponivel  TINYINT(1)    NOT NULL DEFAULT 1,

  PRIMARY KEY (idAgente),
  UNIQUE KEY uq_agentes_idUsuario (idUsuario),
  CONSTRAINT fk_agentes_usuario  FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
  CONSTRAINT fk_agentes_empresa  FOREIGN KEY (idEmpresa) REFERENCES empresas(idEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.4 Tabela `chamados`

```sql
CREATE TABLE chamados (
  idChamado     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  protocolo     VARCHAR(20)    NOT NULL,  -- formato: HD-YYYY-NNNNN
  idCliente     INT UNSIGNED   NOT NULL,
  idAgente      INT UNSIGNED       NULL,  -- NULL até ser atribuído
  idEmpresa     INT UNSIGNED       NULL,
  titulo        VARCHAR(150)   NOT NULL,
  descricao     TEXT           NOT NULL,
  categoria     VARCHAR(50)        NULL,
  status        ENUM('aberto','em_atendimento','aguardando_cliente','concluido','cancelado')
                               NOT NULL DEFAULT 'aberto',
  prioridade    ENUM('baixa','media','alta')
                               NOT NULL DEFAULT 'media',
  anexo         VARCHAR(500)       NULL,  -- caminho do arquivo no servidor/storage
  mimeTypeAnexo VARCHAR(100)       NULL,  -- ex: 'application/pdf', 'image/png'
  createdAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (idChamado),
  UNIQUE KEY uq_chamados_protocolo (protocolo),
  KEY idx_chamados_idCliente (idCliente),
  KEY idx_chamados_idAgente  (idAgente),
  KEY idx_chamados_status    (status),
  CONSTRAINT fk_chamados_cliente  FOREIGN KEY (idCliente) REFERENCES usuarios(idUsuario),
  CONSTRAINT fk_chamados_agente   FOREIGN KEY (idAgente)  REFERENCES agentes(idAgente),
  CONSTRAINT fk_chamados_empresa  FOREIGN KEY (idEmpresa) REFERENCES empresas(idEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.5 Tabela `chat_mensagens`

```sql
CREATE TABLE chat_mensagens (
  idMensagem    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idChamado     INT UNSIGNED  NOT NULL,
  idRemetente   INT UNSIGNED  NOT NULL,
  mensagem      TEXT              NULL,  -- NULL se a mensagem for apenas um arquivo
  anexo         VARCHAR(500)      NULL,  -- caminho do arquivo no servidor/storage
  mimeTypeAnexo VARCHAR(100)      NULL,  -- ex: 'image/jpeg', 'application/pdf'
  lida          TINYINT(1)    NOT NULL DEFAULT 0,
  createdAt     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (idMensagem),
  KEY idx_chat_idChamado   (idChamado),
  KEY idx_chat_idRemetente (idRemetente),
  CONSTRAINT fk_chat_chamado   FOREIGN KEY (idChamado)   REFERENCES chamados(idChamado),
  CONSTRAINT fk_chat_remetente FOREIGN KEY (idRemetente) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.6 Tabela `notificacoes`

```sql
CREATE TABLE notificacoes (
  idNotificacao  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  idUsuario      INT UNSIGNED  NOT NULL,
  idChamado      INT UNSIGNED      NULL,
  tipo           ENUM('novo_chamado','nova_mensagem','chamado_concluido','chamado_cancelado')
                               NOT NULL,
  lida           TINYINT(1)   NOT NULL DEFAULT 0,
  createdAt      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (idNotificacao),
  KEY idx_notif_idUsuario (idUsuario),
  KEY idx_notif_lida      (lida),
  CONSTRAINT fk_notif_usuario  FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
  CONSTRAINT fk_notif_chamado  FOREIGN KEY (idChamado) REFERENCES chamados(idChamado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 7. Regras de Integridade e Restrições

### Campos obrigatórios por tabela

| Tabela | Campos NOT NULL obrigatórios |
|---|---|
| `usuarios` | nome, email, senha, nivelAcesso |
| `empresas` | nome, ativo |
| `agentes` | idUsuario, cargo, disponivel |
| `chamados` | protocolo, idCliente, titulo, descricao, status, prioridade |
| `chat_mensagens` | idChamado, idRemetente, lida — e ao menos `mensagem` ou `anexo` deve ser preenchido |
| `notificacoes` | idUsuario, tipo, lida |

### Unicidades

| Campo | Tabela | Motivo |
|---|---|---|
| `email` | `usuarios` | Impede cadastro duplicado de usuários. |
| `protocolo` | `chamados` | Garante que cada chamado tenha identificador único. |
| `cnpj` | `empresas` | Impede cadastro duplicado de empresas. |
| `idUsuario` | `agentes` | Um usuário só pode ter um perfil de agente. |

### Sobre arquivos

Os campos `anexo` e `mimeTypeAnexo` presentes em `chamados` e `chat_mensagens` **nunca armazenam o arquivo em si**. Armazenam apenas a referência (caminho relativo ou URL de preferência encurtada) do arquivo salvo no servidor de arquivos ou serviço de storage (como na AWS S3, Google Cloud Storage, ou diretório local do servidor). O campo `mimeTypeAnexo` registra o tipo do conteúdo para que o frontend saiba como exibir ou fazer download do arquivo corretamente.

---

## 8. Glossário

| Termo | Definição |
|---|---|
| **Chamado** | Registro de uma solicitação de suporte aberta por um cliente. |
| **Protocolo** | Identificador único de um chamado no formato `HD-YYYY-NNNNN`. |
| **Agente** | Técnico de suporte responsável por atender os chamados. |
| **Admin** | Administrador da plataforma, responsável por gerenciar empresas e agentes. |
| **JWT** | JSON Web Token — mecanismo de autenticação stateless utilizado pelo sistema. |
| **nivelAcesso** | Campo ENUM na tabela `usuarios` que determina o perfil do usuário: `cliente`, `agente` ou `admin`. |
| **ENUM** | Tipo de dado do MySQL que restringe os valores possíveis de uma coluna a uma lista pré-definida. |
| **TINYINT(1)** | Convenção do MySQL para armazenar valores booleanos (0 = false, 1 = true). |
| **TEXT** | Tipo de dado do MySQL para textos longos sem limite fixo, suportando até 65.535 caracteres. |
| **mimeType** | Padrão que identifica o formato de um arquivo (ex: `image/png`, `application/pdf`). |
| **FK (Foreign Key)** | Chave estrangeira — campo que referencia a chave primária de outra tabela, garantindo integridade referencial. |
| **bcrypt** | Algoritmo de hash recomendado para armazenar senhas com segurança. |
